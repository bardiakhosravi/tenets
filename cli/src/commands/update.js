const path = require('node:path');
const { readConfig, updateToolEntry } = require('../services/config-tracker');
const { fetchContent, assembleContent, computeHash } = require('../services/content-fetcher');
const { writeFile, replaceMarkedContent } = require('../services/file-writer');
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

  const { rules, contextFiles } = await fetchContent();
  const assembled = assembleContent(rules, contextFiles);
  const newHash = computeHash(assembled);

  let updatedCount = 0;

  for (const [toolKey, entry] of Object.entries(config.tools)) {
    const targetPath = path.resolve(process.cwd(), entry.targetFile);

    if (entry.contentHash === newHash) {
      logger.success(`${entry.targetFile} — already up to date.`);
      continue;
    }

    const replaced = replaceMarkedContent(targetPath, assembled);

    if (replaced) {
      logger.success(`${entry.targetFile} — updated (marker replacement).`);
    } else {
      writeFile(targetPath, assembled, entry.mode || 'replace');
      logger.success(`${entry.targetFile} — updated (full ${entry.mode || 'replace'}).`);
    }

    updateToolEntry(toolKey, entry.targetFile, newHash, entry.mode || 'replace');
    updatedCount++;
  }

  logger.blank();
  if (updatedCount === 0) {
    logger.info('All tools are up to date.');
  } else {
    logger.success(`Updated ${updatedCount} file(s).`);
  }
}

module.exports = { updateCommand };
