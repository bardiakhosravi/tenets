const fs = require('node:fs');
const path = require('node:path');
const { TOOLS } = require('../constants');
const {
  readConfig,
  writeConfig,
} = require('../services/config-tracker');
const { claudeOwnedPaths } = require('../services/claude-writer');
const { augmentOwnedPaths } = require('../services/augment-writer');
const { cursorOwnedPaths } = require('../services/cursor-writer');
const { copilotOwnedPaths } = require('../services/copilot-writer');
const {
  isTenetsOwnedFile,
  removeMarkedContent,
} = require('../services/file-writer');
const { reviewCommandPath } = require('../services/review-command-writer');
const { scaffoldCommandPath } = require('../services/scaffold-command-writer');
const { promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');
const { runPreview } = require('../services/preview-runner');

function selectedTools(args, config) {
  const explicit = Object.entries(TOOLS)
    .filter(([, tool]) => args.includes(tool.flag))
    .map(([toolKey]) => toolKey);
  if (explicit.length > 0) return explicit;
  if (args.includes('--speckit')) return [];
  return Object.keys(config.tools || {});
}

function removeOwnedFile(filePath, result) {
  if (!fs.existsSync(filePath)) return;
  const relativePath = path.relative(process.cwd(), filePath);
  if (!isTenetsOwnedFile(filePath)) {
    result.conflicts.push(relativePath);
    return;
  }
  fs.unlinkSync(filePath);
  result.removed.push(relativePath);
}

function removeSharedBlock(filePath, result) {
  if (!fs.existsSync(filePath)) return;
  if (removeMarkedContent(filePath)) {
    result.removed.push(`${path.relative(process.cwd(), filePath)} (Tenets block)`);
  } else {
    result.conflicts.push(path.relative(process.cwd(), filePath));
  }
}

function removeEmptyDirectories(directoryPaths) {
  for (const directoryPath of directoryPaths) {
    if (
      fs.existsSync(directoryPath) &&
      fs.readdirSync(directoryPath).length === 0
    ) {
      fs.rmdirSync(directoryPath);
    }
  }
}

function removeClaudeHooks(projectRoot, removeArchitecture, removeReview, result) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return;

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    result.conflicts.push('.claude/settings.json (malformed JSON)');
    return;
  }

  const hooks = settings?.hooks?.PostToolUse;
  if (!Array.isArray(hooks)) return;
  const filtered = hooks.flatMap((entry) => {
    const entryHooks = Array.isArray(entry?.hooks) ? entry.hooks : [];
    const retainedHooks = entryHooks.filter((hook) => {
      const architectureHook =
        hook?.command?.includes('check-architecture');
      const reviewHook =
        hook?.type === 'agent' &&
        hook?.prompt?.includes('Tenets code review agent');
      return !(
        (removeArchitecture && architectureHook) ||
        (removeReview && reviewHook)
      );
    });
    if (retainedHooks.length === entryHooks.length) return [entry];
    if (retainedHooks.length === 0) return [];
    return [{ ...entry, hooks: retainedHooks }];
  });
  if (JSON.stringify(filtered) === JSON.stringify(hooks)) return;
  settings.hooks.PostToolUse = filtered;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  result.removed.push('.claude/settings.json (Tenets hooks)');
}

function removeTool(projectRoot, toolKey, result) {
  const tool = TOOLS[toolKey];
  if (!tool) return;

  if (tool.multiOutput) {
    for (const filePath of claudeOwnedPaths(projectRoot)) {
      removeOwnedFile(filePath, result);
    }
    removeSharedBlock(path.join(projectRoot, 'CLAUDE.md'), result);
    return;
  }
  if (tool.augmentMultiOutput) {
    for (const filePath of augmentOwnedPaths(projectRoot)) {
      removeOwnedFile(filePath, result);
    }
    return;
  }
  if (tool.cursorMultiOutput) {
    for (const filePath of cursorOwnedPaths(projectRoot)) {
      removeOwnedFile(filePath, result);
    }
    removeSharedBlock(path.join(projectRoot, '.cursorrules'), result);
    return;
  }
  if (tool.copilotMultiOutput) {
    for (const filePath of copilotOwnedPaths(projectRoot)) {
      removeOwnedFile(filePath, result);
    }
    removeSharedBlock(
      path.join(projectRoot, '.github', 'copilot-instructions.md'),
      result
    );
    return;
  }

  const targetPath = path.join(projectRoot, tool.targetFile);
  if (tool.codeReviewAgent) {
    removeOwnedFile(targetPath, result);
    removeOwnedFile(
      path.join(projectRoot, '.claude', 'agents', 'code-review-agent.md'),
      result
    );
  } else {
    removeSharedBlock(targetPath, result);
  }
  if (tool.reviewCommand) {
    removeOwnedFile(reviewCommandPath(projectRoot, toolKey), result);
  }
  if (tool.scaffoldCommand) {
    removeOwnedFile(scaffoldCommandPath(projectRoot, toolKey), result);
  }
}

function bundledFiles(directoryPath, relativePath = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directoryPath, relativePath), {
    withFileTypes: true,
  })) {
    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...bundledFiles(directoryPath, childRelativePath));
    } else {
      files.push(childRelativePath);
    }
  }
  return files;
}

function removeSpeckitPreset(projectRoot, presetId, result) {
  const bundledPresetPath = path.join(
    __dirname,
    '..',
    '..',
    'bundled',
    'speckit-preset'
  );
  const installedPresetPath = path.join(
    projectRoot,
    '.specify',
    'presets',
    presetId
  );
  if (fs.existsSync(installedPresetPath)) {
    for (const relativePath of bundledFiles(bundledPresetPath)) {
      const filePath = path.join(installedPresetPath, relativePath);
      if (fs.existsSync(filePath)) {
        const bundledFilePath = path.join(bundledPresetPath, relativePath);
        const installedContent = fs.readFileSync(filePath);
        const bundledContent = fs.readFileSync(bundledFilePath);
        if (installedContent.equals(bundledContent)) {
          fs.unlinkSync(filePath);
          result.removed.push(path.relative(projectRoot, filePath));
        } else {
          result.conflicts.push(
            `${path.relative(projectRoot, filePath)} (modified preset file)`
          );
        }
      }
    }
  }

  const registryPath = path.join(
    projectRoot,
    '.specify',
    'presets',
    'registry.json'
  );
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      const presets = Array.isArray(registry.presets)
        ? registry.presets
        : [];
      const filtered = presets.filter((preset) =>
        !(preset.id === presetId && preset.source === 'tenets')
      );
      if (filtered.length !== presets.length) {
        registry.presets = filtered;
        fs.writeFileSync(
          registryPath,
          JSON.stringify(registry, null, 2) + '\n'
        );
        result.removed.push(
          `${path.relative(projectRoot, registryPath)} (${presetId} entry)`
        );
      }
    } catch {
      result.conflicts.push(
        `${path.relative(projectRoot, registryPath)} (malformed JSON)`
      );
    }
  }
}

async function uninstallCommand(args = [], options = {}) {
  const dryRun = args.includes('--dry-run');
  if (dryRun && !options.capturingPreview) {
    return runPreview('tenets uninstall', () =>
      uninstallCommand(
        [...args.filter((arg) => arg !== '--dry-run'), '--yes'],
        { ...options, capturingPreview: true }
      )
    );
  }

  const config = readConfig();
  if (!config) {
    throw new Error('No readable .tenets.json configuration was found.');
  }
  const toolKeys = selectedTools(args, config);
  const removeSpeckit =
    args.includes('--speckit') ||
    (toolKeys.length === 0 && Object.keys(config.speckit || {}).length > 0) ||
    (!Object.values(TOOLS).some((tool) => args.includes(tool.flag)) &&
      Object.keys(config.speckit || {}).length > 0);
  const yes = args.includes('--yes');
  if (logger.isJsonMode() && !yes) {
    throw new Error(
      '`tenets uninstall --json` requires `--yes` for noninteractive use.'
    );
  }

  if (!yes) {
    logger.info(
      `Selected integrations: ${[
        ...toolKeys,
        ...(removeSpeckit ? ['speckit'] : []),
      ].join(', ') || 'none'}`
    );
    const confirmed = await promptYesNo(
      'Remove the selected Tenets-owned files and marked content?'
    );
    if (!confirmed) {
      logger.info('Cancelled.');
      return { cancelled: true, removed: [], conflicts: [] };
    }
  }

  const projectRoot = process.cwd();
  const result = {
    cancelled: false,
    removed: [],
    conflicts: [],
    incompleteIntegrations: [],
  };
  for (const toolKey of toolKeys) {
    const conflictsBefore = result.conflicts.length;
    removeTool(projectRoot, toolKey, result);
    if (result.conflicts.length === conflictsBefore) {
      if (config.tools) delete config.tools[toolKey];
    } else {
      result.incompleteIntegrations.push(toolKey);
    }
  }

  const removeClaudeArchitecture = toolKeys.includes('claude');
  const removeClaudeReview = toolKeys.includes('codeReviewAgent');
  if (removeClaudeArchitecture || removeClaudeReview) {
    removeClaudeHooks(
      projectRoot,
      removeClaudeArchitecture,
      removeClaudeReview,
      result
    );
  }

  if (removeSpeckit) {
    for (const presetId of Object.keys(config.speckit || {})) {
      const conflictsBefore = result.conflicts.length;
      removeSpeckitPreset(projectRoot, presetId, result);
      if (result.conflicts.length === conflictsBefore) {
        delete config.speckit[presetId];
      } else {
        result.incompleteIntegrations.push(`speckit:${presetId}`);
      }
    }
  }

  const hasTools = Object.keys(config.tools || {}).length > 0;
  const hasSpeckit = Object.keys(config.speckit || {}).length > 0;
  const configPath = path.join(projectRoot, '.tenets.json');
  if (!hasTools && !hasSpeckit) {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      result.removed.push('.tenets.json');
    }
  } else {
    writeConfig(config);
  }

  removeEmptyDirectories([
    path.join(
      projectRoot,
      '.claude',
      'skills',
      'tenets-review-architecture'
    ),
    path.join(
      projectRoot,
      '.claude',
      'skills',
      'tenets-scaffold'
    ),
    path.join(projectRoot, '.claude', 'agents'),
    path.join(projectRoot, '.claude', 'hooks'),
    path.join(projectRoot, '.claude', 'rules'),
    path.join(projectRoot, '.claude', 'skills'),
    path.join(projectRoot, '.claude'),
    path.join(projectRoot, '.augment', 'commands'),
    path.join(projectRoot, '.augment', 'rules'),
    path.join(projectRoot, '.augment'),
    path.join(projectRoot, '.cursor', 'commands'),
    path.join(projectRoot, '.cursor', 'rules'),
    path.join(projectRoot, '.cursor'),
    path.join(projectRoot, '.github', 'instructions'),
    path.join(projectRoot, '.github', 'prompts'),
    path.join(projectRoot, '.tenets', 'agents'),
    path.join(projectRoot, '.tenets', 'prompts'),
    path.join(projectRoot, '.tenets'),
  ]);

  if (!logger.isJsonMode()) {
    logger.success(`Removed ${result.removed.length} Tenets item(s).`);
    for (const removed of result.removed) logger.dim(`  ${removed}`);
    if (result.conflicts.length > 0) {
      logger.warn(
        `${result.conflicts.length} unowned or malformed item(s) were preserved:`
      );
      for (const conflict of result.conflicts) logger.dim(`  ${conflict}`);
    }
  }
  if (result.conflicts.length > 0) {
    process.exitCode = 1;
  }
  return result;
}

module.exports = { uninstallCommand };
