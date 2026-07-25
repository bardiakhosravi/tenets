const path = require('node:path');
const {
  captureFilesystemChanges,
  formatChangePlan,
} = require('./change-planner');
const { logger } = require('../ui/logger');

async function runPreview(label, operation) {
  logger.warn(`Dry run: simulating ${label}. No filesystem changes will be applied.`);
  logger.blank();
  const changes = await captureFilesystemChanges(operation);
  logger.blank();
  logger.info(`Planned filesystem changes (${changes.length}):`);
  if (!logger.isJsonMode()) {
    console.log(formatChangePlan(changes, process.cwd()));
  }
  logger.blank();
  logger.success('Dry run complete. No changes were applied.');
  return changes.map((change) => ({
    action: change.action,
    path: path.relative(process.cwd(), change.path)
      .split(path.sep)
      .join('/'),
    before: change.before?.toString('utf-8') ?? null,
    after: change.after?.toString('utf-8') ?? null,
    beforeMode: change.beforeMode,
    afterMode: change.afterMode,
  }));
}

module.exports = { runPreview };
