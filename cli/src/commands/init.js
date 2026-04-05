const fs = require('node:fs');
const path = require('node:path');
const { TOOLS } = require('../constants');
const { fetchContent, assembleContent, computeHash } = require('../services/content-fetcher');
const { writeFile } = require('../services/file-writer');
const { writeClaudeIntegration, writeHookSettings } = require('../services/claude-writer');
const { updateToolEntry } = require('../services/config-tracker');
const { promptToolSelection, promptFileConflict, promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');

function resolveToolFromFlags(args) {
  for (const [key, tool] of Object.entries(TOOLS)) {
    if (args.includes(tool.flag)) {
      return key;
    }
  }
  return null;
}

async function initCommand(args) {
  let toolKey = resolveToolFromFlags(args);

  if (!toolKey) {
    toolKey = await promptToolSelection(TOOLS);
    if (!toolKey) {
      logger.error('Invalid selection. Aborting.');
      process.exitCode = 1;
      return;
    }
  }

  const tool = TOOLS[toolKey];

  const content = await fetchContent();
  const assembled = assembleContent(content);
  const hash = computeHash(assembled);

  if (tool.multiOutput) {
    await initClaudeMultiOutput(args, toolKey, tool, content, hash);
  } else {
    await initSingleFile(toolKey, tool, assembled, hash);
  }
}

/**
 * Claude Code: writes rules files, CLAUDE.md snippet, skill, and optionally hook config.
 */
async function initClaudeMultiOutput(args, toolKey, tool, content, hash) {
  const projectRoot = process.cwd();
  const rulesDir = path.resolve(projectRoot, '.claude', 'rules');

  if (fs.existsSync(rulesDir)) {
    const mode = await promptFileConflict(rulesDir);
    if (mode === 'cancel') {
      logger.info('Cancelled.');
      return;
    }
  }

  const { writtenFiles } = writeClaudeIntegration(projectRoot, content);

  // Offer to install the continuous monitoring hook
  const installHook = args.includes('--with-hook') || await promptYesNo(
    'Install PostToolUse hook for continuous architecture monitoring?'
  );

  if (installHook) {
    const settingsFile = writeHookSettings(projectRoot);
    writtenFiles.push(settingsFile);
  }

  updateToolEntry(toolKey, tool.targetFile, hash, 'multi');

  logger.blank();
  logger.success('Claude Code integration installed!');
  logger.blank();
  logger.info(`${writtenFiles.length} files written:`);
  for (const file of writtenFiles) {
    logger.dim(`  ${file}`);
  }
  logger.blank();
  logger.info('What was installed:');
  logger.dim('  .claude/rules/tenets-*.md    Context-aware rules (auto-load by file path)');
  logger.dim('  CLAUDE.md                    Top-level principles (always loaded)');
  logger.dim('  .claude/skills/...           /review-architecture command');
  if (installHook) {
    logger.dim('  .claude/hooks/...            Continuous monitoring hook');
    logger.dim('  .claude/settings.json        Hook configuration');
  }
  logger.blank();
  logger.info('Usage:');
  logger.dim('  Edit any file — rules auto-load based on the layer you\'re working in');
  logger.dim('  Run /review-architecture for a full compliance review');
  logger.dim('  Run `npx tenets update` to update rules later');
}

/**
 * Other tools (Cursor, Copilot, AGENTS.md): single assembled file.
 */
async function initSingleFile(toolKey, tool, assembled, hash) {
  const targetPath = path.resolve(process.cwd(), tool.targetFile);

  let mode = 'replace';
  if (fs.existsSync(targetPath)) {
    mode = await promptFileConflict(targetPath);
    if (mode === 'cancel') {
      logger.info('Cancelled.');
      return;
    }
  }

  writeFile(targetPath, assembled, mode);
  updateToolEntry(toolKey, tool.targetFile, hash, mode);

  logger.blank();
  logger.success(`Rules installed to ${tool.targetFile}`);
  logger.dim(`  Tool: ${tool.name}`);
  logger.dim(`  Mode: ${mode}`);
  logger.dim(`  Run \`npx tenets update\` to update later.`);
}

module.exports = { initCommand };
