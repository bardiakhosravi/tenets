const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { TOOLS } = require('../constants');
const { readConfig, updateToolEntry, updateSpeckitEntry, getSpeckitEntries, needsMigration, markMigrationDeclined, isMigrationDeclined } = require('../services/config-tracker');
const { fetchContent, assembleContent, computeHash, computeClaudeHash } = require('../services/content-fetcher');
const { writeFile, replaceMarkedContent } = require('../services/file-writer');
const { writeClaudeIntegration, writeHookSettings } = require('../services/claude-writer');
const { promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');

const SPECKIT_PRESET_RELEASE_URL =
  'https://github.com/bardiakhosravi/ai-agent-backend-standards/releases/latest/download/tenets-speckit-preset.zip';

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

async function updateSpeckitPresets(config) {
  const entries = getSpeckitEntries(config);
  const presetIds = Object.keys(entries);
  if (presetIds.length === 0) return;

  const specifyDir = path.resolve(process.cwd(), '.specify');
  if (!fs.existsSync(specifyDir)) return;

  for (const presetId of presetIds) {
    if (isCommandAvailable('specify')) {
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

async function updateCommand() {
  const config = readConfig();

  if (!config || (!config.tools && !config.speckit) ||
      (Object.keys(config.tools || {}).length === 0 && Object.keys(config.speckit || {}).length === 0)) {
    logger.error(
      'No tools configured. Run `npx tenets init` first.'
    );
    process.exitCode = 1;
    return;
  }

  // Update speckit presets first (independent of tool content hash)
  await updateSpeckitPresets(config);

  if (!config.tools || Object.keys(config.tools).length === 0) {
    logger.blank();
    logger.info('All up to date.');
    return;
  }

  const content = await fetchContent();
  const assembled = assembleContent(content);
  const baseHash = computeHash(assembled);
  const claudeHash = computeClaudeHash(assembled);

  let updatedCount = 0;

  for (const [toolKey, entry] of Object.entries(config.tools)) {
    const tool = TOOLS[toolKey];
    const newHash = tool?.multiOutput ? claudeHash : baseHash;

    // --- Migration check: v1 single-file -> v2 multi-output ---
    if (tool?.multiOutput && needsMigration(config, toolKey)) {
      // Skip if user already declined migration to avoid prompting on every update run.
      if (isMigrationDeclined(config, toolKey)) {
        logger.info(`${toolKey} — migration to v2 format was previously declined.`);
        logger.dim('  Run `npx tenets init --claude` any time to migrate.');
        continue;
      }
      const migrated = await handleClaudeMigration(toolKey, entry, tool, content, newHash);
      if (migrated) {
        updatedCount++;
      }
      continue;
    }

    if (entry.contentHash === newHash) {
      logger.success(`${toolKey} — already up to date.`);
      continue;
    }

    if (tool?.multiOutput) {
      const projectRoot = process.cwd();
      const { writtenFiles, claudeMdAction } = writeClaudeIntegration(projectRoot, content);
      if (claudeMdAction === 'appended') {
        logger.info('Appending Tenets block to existing CLAUDE.md.');
      }
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
        writeFile(targetPath, assembled, entry.mode || 'replace');
        logger.success(`${entry.targetFile} — updated (full ${entry.mode || 'replace'}).`);
      }
    }

    updateToolEntry(toolKey, entry.targetFile, newHash, entry.mode || 'replace');
    updatedCount++;
  }

  logger.blank();
  if (updatedCount === 0) {
    logger.info('All tools are up to date.');
  } else {
    logger.success(`Updated ${updatedCount} tool(s).`);
  }
}

/**
 * Guide the user through migrating from v1 (single CLAUDE.md dump) to
 * v2 (rules files + skill + hook + concise CLAUDE.md snippet).
 */
async function handleClaudeMigration(toolKey, entry, tool, content, newHash) {
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

  const proceed = await promptYesNo('Migrate to the new format?');

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
  const installHook = await promptYesNo(
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
