const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { TOOLS } = require('../constants');
const {
  readConfig,
  updateProjectPolicy,
  updateToolEntry,
  updateSpeckitEntry,
  getSpeckitEntries,
  needsMigration,
  markMigrationDeclined,
  isMigrationDeclined,
} = require('../services/config-tracker');
const {
  deriveApplicability,
  profileFromArgs,
  resolveProfile,
} = require('../services/profiles');
const {
  detectRepository,
} = require('../services/repository-detector');
const {
  fetchContent,
  assembleContent,
  assembleCodeReviewAgentContent,
  computeHash,
  computeClaudeHash,
  computeAugmentHash,
  computeCursorHash,
  computeCopilotHash,
  computeReviewCommandHash,
} = require('../services/content-fetcher');
const {
  assertCanWriteOwnedFiles,
  isTenetsOwnedFile,
  replaceMarkedContent,
  writeOwnedFile,
} = require('../services/file-writer');
const {
  writeClaudeIntegration,
  writeHookSettings,
  writeCodeReviewAgentHookSettings,
  claudeIntegrationComplete,
} = require('../services/claude-writer');
const {
  writeAugmentIntegration,
  augmentIntegrationComplete,
} = require('../services/augment-writer');
const {
  writeCursorIntegration,
  cursorIntegrationComplete,
} = require('../services/cursor-writer');
const {
  writeCopilotIntegration,
  copilotIntegrationComplete,
} = require('../services/copilot-writer');
const {
  reviewCommandPath,
  writeReviewCommand,
  reviewCommandExists,
} = require('../services/review-command-writer');
const {
  scaffoldCommandPath,
  writeScaffoldCommand,
  scaffoldCommandExists,
} = require('../services/scaffold-command-writer');
const { promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');
const { runPreview } = require('../services/preview-runner');

function isCommandAvailable(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function updateSpeckitPresets(config, options = {}) {
  const entries = getSpeckitEntries(config);
  const presetIds = Object.keys(entries);
  if (presetIds.length === 0) return;

  const specifyDir = path.resolve(process.cwd(), '.specify');
  if (!fs.existsSync(specifyDir)) return;

  for (const presetId of presetIds) {
    if (!options.dryRun && isCommandAvailable('specify')) {
      try {
        execSync(`specify preset update ${presetId}`, { stdio: 'inherit' });
        updateSpeckitEntry(presetId);
        logger.success(`speckit:${presetId} — updated via specify CLI.`);
        continue;
      } catch {
        logger.warn(`specify CLI update failed for ${presetId}. Falling back to bundled update...`);
      }
    }

    // Fallback: overwrite from bundled files
    const bundledPresetDir = path.resolve(__dirname, '..', '..', 'bundled', 'speckit-preset');
    const presetDir = path.resolve(specifyDir, 'presets', presetId);
    copyDirRecursive(bundledPresetDir, presetDir);
    updateSpeckitEntry(presetId);
    logger.success(`speckit:${presetId} — updated from bundled files.`);
  }
}

async function updateCommand(args = [], options = {}) {
  const dryRun = args.includes('--dry-run');
  if (dryRun && !options.capturingPreview) {
    const commandArgs = args.filter((arg) => arg !== '--dry-run');
    return runPreview('tenets update', () =>
      updateCommand(commandArgs, {
        ...options,
        capturingPreview: true,
        dryRun: true,
      })
    );
  }

  let config = readConfig();

  if (!config || (!config.tools && !config.speckit) ||
      (Object.keys(config.tools || {}).length === 0 && Object.keys(config.speckit || {}).length === 0)) {
    logger.error(
      'No tools configured. Run `npx tenets init` first.'
    );
    process.exitCode = 1;
    return;
  }

  const profile = resolveProfile(config, profileFromArgs(args));
  const migratedLegacyProfile = !config.profile;
  const appliesTo = config.appliesTo ??
    (migratedLegacyProfile ? [] : deriveApplicability(detectRepository()));
  const changedProfile = config.profile && config.profile !== profile;
  updateProjectPolicy(profile, appliesTo);
  config = readConfig();
  if (migratedLegacyProfile) {
    logger.info(
      'Migrated this existing installation to the strict profile to preserve its current rules.'
    );
  } else if (changedProfile) {
    logger.info(`Changed the architecture profile to ${profile}.`);
  } else {
    logger.info(`Using the ${profile} architecture profile.`);
  }

  // Update speckit presets first (independent of tool content hash)
  await updateSpeckitPresets(config, options);

  if (!config.tools || Object.keys(config.tools).length === 0) {
    logger.blank();
    logger.info('All up to date.');
    return { updatedCount: 0, profile, appliesTo };
  }

  const content = await fetchContent({ profile, appliesTo });
  const assembled = assembleContent(content);
  const codeReviewAgentContent = assembleCodeReviewAgentContent(
    assembled,
    content
  );
  const baseHash = computeHash(assembled);
  const codeReviewAgentHash = computeHash(codeReviewAgentContent);
  const claudeHash = computeClaudeHash(assembled, content);
  const augmentHash = computeAugmentHash(assembled, content);
  const cursorHash = computeCursorHash(assembled, content);
  const copilotHash = computeCopilotHash(assembled, content);

  let updatedCount = 0;
  const yes = args.includes('--yes');

  for (const [toolKey, entry] of Object.entries(config.tools)) {
    const tool = TOOLS[toolKey];
    const newHash = tool?.codeReviewAgent
      ? codeReviewAgentHash
      : tool?.multiOutput
        ? claudeHash
        : tool?.augmentMultiOutput
          ? augmentHash
          : tool?.cursorMultiOutput
            ? cursorHash
            : tool?.copilotMultiOutput
              ? copilotHash
              : tool?.reviewCommand
                ? computeReviewCommandHash(assembled, toolKey, content)
                : baseHash;

    // Claude migration remains interactive because hook installation is optional.
    if (tool?.multiOutput && needsMigration(config, toolKey)) {
      // Skip if user already declined migration to avoid prompting on every update run.
      if (isMigrationDeclined(config, toolKey)) {
        logger.info(`${toolKey} — migration to v2 format was previously declined.`);
        logger.dim('  Run `npx tenets init --claude` any time to migrate.');
        continue;
      }
      const migrated = await handleClaudeMigration(
        toolKey,
        entry,
        tool,
        content,
        newHash,
        { yes }
      );
      if (migrated) {
        updatedCount++;
      }
      continue;
    }

    if (tool?.cursorMultiOutput && needsMigration(config, toolKey, 'cursor-multi')) {
      const { writtenFiles, removedLegacyRules } = writeCursorIntegration(
        process.cwd(),
        content
      );
      updateToolEntry(toolKey, tool.targetFile, newHash, 'cursor-multi');
      logger.success(`${toolKey} — migrated to scoped rules (${writtenFiles.length} files).`);
      if (removedLegacyRules) {
        logger.dim('  Removed the legacy Tenets block from .cursorrules.');
      }
      updatedCount++;
      continue;
    }

    if (tool?.copilotMultiOutput && needsMigration(config, toolKey, 'copilot-multi')) {
      const { writtenFiles } = writeCopilotIntegration(process.cwd(), content);
      updateToolEntry(toolKey, tool.targetFile, newHash, 'copilot-multi');
      logger.success(`${toolKey} — migrated to scoped instructions (${writtenFiles.length} files).`);
      updatedCount++;
      continue;
    }

    const commandMissing =
      tool?.reviewCommand && !reviewCommandExists(process.cwd(), toolKey);
    const scaffoldCommandMissing =
      tool?.scaffoldCommand &&
      !scaffoldCommandExists(process.cwd(), toolKey);
    const integrationIncomplete =
      (tool?.multiOutput && !claudeIntegrationComplete(process.cwd())) ||
      (tool?.augmentMultiOutput && !augmentIntegrationComplete(process.cwd())) ||
      (tool?.cursorMultiOutput && !cursorIntegrationComplete(process.cwd())) ||
      (tool?.copilotMultiOutput && !copilotIntegrationComplete(process.cwd()));
    const targetUnownedOrMissing =
      !tool?.multiOutput &&
      !tool?.augmentMultiOutput &&
      !tool?.cursorMultiOutput &&
      !tool?.copilotMultiOutput &&
      !isTenetsOwnedFile(path.resolve(process.cwd(), entry.targetFile));

    if (
      entry.contentHash === newHash &&
      !commandMissing &&
      !scaffoldCommandMissing &&
      !integrationIncomplete &&
      !targetUnownedOrMissing
    ) {
      logger.success(`${toolKey} — already up to date.`);
      continue;
    }

    const isSingleFileAgentIntegration =
      (tool?.reviewCommand || tool?.scaffoldCommand) &&
      !tool?.multiOutput &&
      !tool?.augmentMultiOutput &&
      !tool?.cursorMultiOutput &&
      !tool?.copilotMultiOutput;
    if (isSingleFileAgentIntegration) {
      assertCanWriteOwnedFiles([
        ...(tool?.reviewCommand
          ? [reviewCommandPath(process.cwd(), toolKey)]
          : []),
        ...(tool?.scaffoldCommand
          ? [scaffoldCommandPath(process.cwd(), toolKey)]
          : []),
      ]);
    }

    if (tool?.codeReviewAgent) {
      const targetFile = entry.targetFile || tool.targetFile;
      const targetPath = path.resolve(process.cwd(), targetFile);
      const replaced = replaceMarkedContent(targetPath, codeReviewAgentContent);

      if (replaced) {
        logger.success(`${targetFile} — updated (marker replacement).`);
      } else {
        writeOwnedFile(targetPath, codeReviewAgentContent);
        logger.success(`${targetFile} — updated (Tenets-owned file).`);
      }
    } else if (tool?.multiOutput) {
      const projectRoot = process.cwd();
      const installCodeReviewAgent = Boolean(config.tools.codeReviewAgent);
      const { writtenFiles, claudeMdAction } = writeClaudeIntegration(projectRoot, content, {
        installCodeReviewAgent,
      });
      if (installCodeReviewAgent) {
        const settingsFile = writeCodeReviewAgentHookSettings(projectRoot);
        if (!writtenFiles.includes(settingsFile)) {
          writtenFiles.push(settingsFile);
        }
      }
      if (claudeMdAction === 'appended') {
        logger.info('Appending Tenets block to existing CLAUDE.md.');
      }
      logger.success(`${toolKey} — updated ${writtenFiles.length} files.`);
      for (const file of writtenFiles) {
        logger.dim(`  ${file}`);
      }
    } else if (tool?.augmentMultiOutput) {
      const writtenFiles = writeAugmentIntegration(process.cwd(), content);
      logger.success(`${toolKey} — updated ${writtenFiles.length} files.`);
      for (const file of writtenFiles) {
        logger.dim(`  ${file}`);
      }
    } else if (tool?.cursorMultiOutput) {
      const { writtenFiles, removedLegacyRules } = writeCursorIntegration(
        process.cwd(),
        content
      );
      logger.success(`${toolKey} — updated ${writtenFiles.length} files.`);
      for (const file of writtenFiles) {
        logger.dim(`  ${file}`);
      }
      if (removedLegacyRules) {
        logger.dim('  Removed the legacy Tenets block from .cursorrules.');
      }
    } else if (tool?.copilotMultiOutput) {
      const { writtenFiles } = writeCopilotIntegration(process.cwd(), content);
      logger.success(`${toolKey} — updated ${writtenFiles.length} files.`);
      for (const file of writtenFiles) {
        logger.dim(`  ${file}`);
      }
    } else {
      const targetPath = path.resolve(process.cwd(), entry.targetFile);
      const replaced = replaceMarkedContent(targetPath, assembled);

      if (replaced) {
        logger.success(`${entry.targetFile} — updated (marker replacement).`);
      } else {
        writeOwnedFile(targetPath, assembled);
        logger.success(`${entry.targetFile} — updated (Tenets-owned file).`);
      }

      if (tool?.reviewCommand) {
        const commandFile = writeReviewCommand(process.cwd(), toolKey, {
          content,
        });
        logger.dim(`  ${commandFile}`);
      }
      if (tool?.scaffoldCommand) {
        const commandFile = writeScaffoldCommand(process.cwd(), toolKey);
        logger.dim(`  ${commandFile}`);
      }
    }

    const mode = tool?.cursorMultiOutput
      ? 'cursor-multi'
      : tool?.copilotMultiOutput
        ? 'copilot-multi'
        : entry.mode || 'replace';
    updateToolEntry(toolKey, tool?.targetFile || entry.targetFile, newHash, mode);
    updatedCount++;
  }

  logger.blank();
  if (updatedCount === 0) {
    logger.info('All tools are up to date.');
  } else {
    logger.success(`Updated ${updatedCount} tool(s).`);
  }
  return { updatedCount, profile, appliesTo };
}

/**
 * Guide the user through migrating from v1 (single CLAUDE.md dump) to
 * v2 (rules files + skill + hook + concise CLAUDE.md snippet).
 */
async function handleClaudeMigration(
  toolKey,
  entry,
  tool,
  content,
  newHash,
  options = {}
) {
  logger.blank();
  logger.warn('Migration required: Claude Code integration has changed.');
  logger.blank();
  logger.info('What changed in tenets v0.2.0:');
  logger.dim('  Old: All rules dumped into a single CLAUDE.md file');
  logger.dim('  New: Four-layer integration for a much better experience:');
  logger.blank();
  logger.dim('  1. .claude/rules/tenets-*.md    Auto-load rules by file path (glob-based)');
  logger.dim('  2. CLAUDE.md snippet             Concise top-level principles (always loaded)');
  logger.dim('  3. .claude/skills/...            /tenets-review-architecture on-demand review');
  logger.dim('  4. .claude/hooks/...             Continuous architecture monitoring');
  logger.blank();
  logger.info('Your existing CLAUDE.md tenets block will be replaced with a concise snippet.');
  logger.info('The full rules move to .claude/rules/ where they auto-load contextually.');
  logger.blank();

  const proceed = options.yes || await promptYesNo('Migrate to the new format?');

  if (!proceed) {
    markMigrationDeclined(toolKey);
    logger.info('Skipped. You can migrate later with `npx tenets init --claude`.');
    return false;
  }

  const projectRoot = process.cwd();

  // Write the new multi-output files (this also replaces the CLAUDE.md markers block)
  const { writtenFiles, claudeMdAction } = writeClaudeIntegration(projectRoot, content);
  if (claudeMdAction === 'appended') {
    logger.info('Appending Tenets block to existing CLAUDE.md.');
  }

  // Commit the config update immediately — the core migration is done.
  // The hook prompt below is optional and shouldn't block config persistence.
  updateToolEntry(toolKey, tool.targetFile, newHash, 'multi');

  // Offer hook installation
  const installHook = !options.yes && await promptYesNo(
      'Install PostToolUse hook for continuous architecture monitoring?'
    );

  if (installHook) {
    const settingsFile = writeHookSettings(projectRoot);
    writtenFiles.push(settingsFile);
  }

  logger.blank();
  logger.success('Migration complete!');
  logger.blank();
  logger.info(`${writtenFiles.length} files written:`);
  for (const file of writtenFiles) {
    logger.dim(`  ${file}`);
  }
  logger.blank();
  logger.info('Usage:');
  logger.dim('  Edit any file — rules auto-load based on the layer you\'re working in');
  logger.dim('  Run /tenets-review-architecture for a full compliance review');

  return true;
}

module.exports = { updateCommand };
