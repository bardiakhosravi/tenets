const path = require('node:path');
const { TOOLS } = require('../constants');
const { readConfig, updateToolEntry, needsMigration } = require('../services/config-tracker');
const { fetchContent, assembleContent, computeHash } = require('../services/content-fetcher');
const { writeFile, replaceMarkedContent } = require('../services/file-writer');
const { writeClaudeIntegration, writeHookSettings } = require('../services/claude-writer');
const { promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');

async function updateCommand() {
  const config = readConfig();

  if (!config || !config.tools || Object.keys(config.tools).length === 0) {
    logger.error(
      'No tools configured. Run `npx tenets init` first.'
    );
    process.exitCode = 1;
    return;
  }

  const content = await fetchContent();
  const assembled = assembleContent(content);
  const newHash = computeHash(assembled);

  let updatedCount = 0;

  for (const [toolKey, entry] of Object.entries(config.tools)) {
    const tool = TOOLS[toolKey];

    // --- Migration check: v1 single-file -> v2 multi-output ---
    if (tool?.multiOutput && needsMigration(config, toolKey)) {
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
      const { writtenFiles } = writeClaudeIntegration(projectRoot, content);
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
  logger.dim('  3. .claude/skills/...            /review-architecture on-demand review');
  logger.dim('  4. .claude/hooks/...             Continuous architecture monitoring');
  logger.blank();
  logger.info('Your existing CLAUDE.md tenets block will be replaced with a concise snippet.');
  logger.info('The full rules move to .claude/rules/ where they auto-load contextually.');
  logger.blank();

  const proceed = await promptYesNo('Migrate to the new format?');

  if (!proceed) {
    logger.info('Skipped. You can migrate later with `npx tenets init --claude`.');
    return false;
  }

  const projectRoot = process.cwd();

  // Write the new multi-output files (this also replaces the CLAUDE.md markers block)
  const { writtenFiles } = writeClaudeIntegration(projectRoot, content);

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
  logger.dim('  Run /review-architecture for a full compliance review');

  return true;
}

module.exports = { updateCommand };
