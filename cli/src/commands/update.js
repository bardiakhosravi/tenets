const path = require('node:path');
const { TOOLS } = require('../constants');
const { readConfig, updateToolEntry } = require('../services/config-tracker');
const { fetchContent, assembleContent, computeHash } = require('../services/content-fetcher');
const { writeSeparateFiles } = require('../services/file-writer');
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
    if (entry.contentHash === newHash) {
      logger.success(`${entry.targetDir} — already up to date.`);
      continue;
    }

    const tool = TOOLS[toolKey];
    if (!tool) {
      logger.warn(`Unknown tool "${toolKey}" in config, skipping.`);
      continue;
    }

    const targetDir = path.resolve(process.cwd(), entry.targetDir);
    writeSeparateFiles(targetDir, content, tool.fileExtension);
    updateToolEntry(toolKey, entry.targetDir, newHash);

    logger.success(`${entry.targetDir}/ — updated.`);
    updatedCount++;
  }

  logger.blank();
  if (updatedCount === 0) {
    logger.info('All tools are up to date.');
  } else {
    logger.success(`Updated ${updatedCount} tool(s).`);
  }
}

module.exports = { updateCommand };
