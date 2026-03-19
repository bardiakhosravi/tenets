const fs = require('node:fs');
const path = require('node:path');
const { TOOLS } = require('../constants');
const { fetchContent, assembleContent, computeHash } = require('../services/content-fetcher');
const { writeFile } = require('../services/file-writer');
const { updateToolEntry } = require('../services/config-tracker');
const { promptToolSelection, promptFileConflict } = require('../ui/prompts');
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
  const targetPath = path.resolve(process.cwd(), tool.targetFile);

  let mode = 'replace';
  if (fs.existsSync(targetPath)) {
    mode = await promptFileConflict(targetPath);
    if (mode === 'cancel') {
      logger.info('Cancelled.');
      return;
    }
  }

  const { rules, contextFiles } = await fetchContent();
  const assembled = assembleContent(rules, contextFiles);
  const hash = computeHash(assembled);

  writeFile(targetPath, assembled, mode);
  updateToolEntry(toolKey, tool.targetFile, hash, mode);

  logger.blank();
  logger.success(`Rules installed to ${tool.targetFile}`);
  logger.dim(`  Tool: ${tool.name}`);
  logger.dim(`  Mode: ${mode}`);
  logger.dim(`  Run \`npx tenets update\` to update later.`);
}

module.exports = { initCommand };
