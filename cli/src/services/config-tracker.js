const fs = require('node:fs');
const path = require('node:path');
const { CONFIG_FILE } = require('../constants');
const { logger } = require('../ui/logger');

/**
 * Schema version tracks the config format.
 *   v1 (0.1.x): single assembled file per tool (CLAUDE.md, .cursorrules, etc.)
 *   v2 (0.2.x): claude gets multi-output (rules/ + skill + hook + CLAUDE.md snippet),
 *               other tools unchanged.
 */
const SCHEMA_VERSION = 2;

function configPath() {
  return path.resolve(process.cwd(), CONFIG_FILE);
}

function readConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    logger.warn(`Could not read ${CONFIG_FILE} — treating as fresh install.`);
    logger.dim(`  The file may be corrupted. Delete it and re-run \`npx tenets init\` if needed.`);
    return null;
  }
}

function writeConfig(config) {
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function updateToolEntry(toolKey, targetFile, contentHash, mode) {
  const config = readConfig() || { schemaVersion: SCHEMA_VERSION, tools: {} };

  config.schemaVersion = SCHEMA_VERSION;

  config.tools[toolKey] = {
    targetFile,
    contentHash,
    mode,
    installedAt: config.tools[toolKey]?.installedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);
}

/**
 * Detect whether a tool entry needs migration from v1 -> v2.
 * Returns true if the config was written by v1 (no schemaVersion or schemaVersion < 2)
 * and the tool is now a multi-output tool.
 */
function needsMigration(config, toolKey) {
  const configVersion = config?.schemaVersion || 1;
  if (configVersion >= SCHEMA_VERSION) {
    return false;
  }

  const entry = config?.tools?.[toolKey];
  if (!entry) {
    return false;
  }

  // v1 claude entries have mode: "replace" or "append" (single-file)
  // v2 claude entries have mode: "multi"
  return entry.mode !== 'multi';
}

function updateSpeckitEntry(presetId) {
  const config = readConfig() || { schemaVersion: SCHEMA_VERSION, tools: {}, speckit: {} };
  config.schemaVersion = SCHEMA_VERSION;
  if (!config.speckit) config.speckit = {};

  config.speckit[presetId] = {
    installedAt: config.speckit[presetId]?.installedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);
}

function getSpeckitEntries(config) {
  return config?.speckit || {};
}

/**
 * Record that the user declined the v1→v2 migration so we don't prompt again.
 */
function markMigrationDeclined(toolKey) {
  const config = readConfig() || { schemaVersion: SCHEMA_VERSION, tools: {} };
  config.schemaVersion = SCHEMA_VERSION;
  if (!config.tools) config.tools = {};
  if (!config.tools[toolKey]) config.tools[toolKey] = {};
  config.tools[toolKey].migrationDeclinedAt = new Date().toISOString();
  writeConfig(config);
}

/**
 * Returns true if the user previously declined the v1→v2 migration for this tool.
 */
function isMigrationDeclined(config, toolKey) {
  return Boolean(config?.tools?.[toolKey]?.migrationDeclinedAt);
}

module.exports = {
  readConfig,
  writeConfig,
  updateToolEntry,
  updateSpeckitEntry,
  getSpeckitEntries,
  needsMigration,
  markMigrationDeclined,
  isMigrationDeclined,
  SCHEMA_VERSION,
};
