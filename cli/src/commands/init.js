const fs = require('node:fs');
const path = require('node:path');
const { TOOLS } = require('../constants');
const { fetchContent, computeHash, assembleContent } = require('../services/content-fetcher');
const { writeSeparateFiles } = require('../services/file-writer');
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
  const targetDir = path.resolve(process.cwd(), tool.targetDir);

  if (fs.existsSync(targetDir)) {
    const mode = await promptFileConflict(targetDir);
    if (mode === 'cancel') {
      logger.info('Cancelled.');
      return;
    }
  }

  const content = await fetchContent();
  const writtenFiles = writeSeparateFiles(targetDir, content, tool.fileExtension);

  const assembled = assembleContent(content);
  const hash = computeHash(assembled);
  updateToolEntry(toolKey, tool.targetDir, hash);

  logger.blank();
  logger.success(`Rules installed to ${tool.targetDir}/`);
  logger.dim(`  Tool: ${tool.name}`);
  logger.dim(`  ${tool.description}`);
  logger.blank();
  logger.info(`${writtenFiles.length} files written:`);
  for (const file of writtenFiles) {
    logger.dim(`  ${tool.targetDir}/${file}`);
  }
  logger.blank();
  logger.dim('Run `npx tenets update` to update later.');
}

module.exports = { initCommand };
