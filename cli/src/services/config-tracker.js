const fs = require('node:fs');
const path = require('node:path');
const { CONFIG_FILE } = require('../constants');

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
    return null;
  }
}

function writeConfig(config) {
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function updateToolEntry(toolKey, targetDir, contentHash) {
  const config = readConfig() || { tools: {} };

  config.tools[toolKey] = {
    targetDir,
    contentHash,
    installedAt: config.tools[toolKey]?.installedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeConfig(config);
}

module.exports = { readConfig, writeConfig, updateToolEntry };
