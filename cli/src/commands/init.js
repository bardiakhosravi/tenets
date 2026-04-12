const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { TOOLS } = require('../constants');
const { fetchContent, assembleContent, computeHash, computeClaudeHash } = require('../services/content-fetcher');
const { writeFile } = require('../services/file-writer');
const { writeClaudeIntegration, writeHookSettings } = require('../services/claude-writer');
const { updateToolEntry, updateSpeckitEntry } = require('../services/config-tracker');
const { promptToolSelection, promptFileConflict, promptYesNo } = require('../ui/prompts');
const { logger } = require('../ui/logger');

const SPECKIT_PRESET_ID = 'tenets-ddd';
const SPECKIT_PRESET_RELEASE_URL =
  'https://github.com/bardiakhosravi/ai-agent-backend-standards/releases/latest/download/tenets-speckit-preset.zip';

function resolveToolFromFlags(args) {
  for (const [key, tool] of Object.entries(TOOLS)) {
    if (args.includes(tool.flag)) {
      return key;
    }
  }
  return null;
}

function isCommandAvailable(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updatePresetRegistry(presetsDir) {
  const registryPath = path.resolve(presetsDir, 'registry.json');
  let registry = { presets: [] };

  if (fs.existsSync(registryPath)) {
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      if (!Array.isArray(registry.presets)) registry.presets = [];
    } catch {
      // Start fresh if registry is malformed
    }
  }

  registry.presets = registry.presets.filter(p => p.id !== SPECKIT_PRESET_ID);
  registry.presets.push({
    id: SPECKIT_PRESET_ID,
    priority: 10,
    installedAt: new Date().toISOString(),
    source: 'tenets',
  });

  if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir, { recursive: true });
  }
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

async function initSpeckit() {
  const projectRoot = process.cwd();
  const specifyDir = path.resolve(projectRoot, '.specify');

  if (!fs.existsSync(specifyDir)) {
    logger.blank();
    logger.info('Spec-Kit is not initialized in this project. Initializing now...');
    logger.blank();
    // Use the global CLI if available, otherwise fall back to npx so no global install is needed.
    const specifyCmd = isCommandAvailable('specify') ? 'specify init' : 'npx @spec-kit/cli init';
    try {
      execSync(specifyCmd, { stdio: 'inherit' });
    } catch {
      logger.error('Spec-Kit initialization failed. Fix the error above and re-run `npx tenets init --speckit`.');
      process.exitCode = 1;
      return;
    }
  }

  const presetDir = path.resolve(specifyDir, 'presets', SPECKIT_PRESET_ID);
  const alreadyInstalled = fs.existsSync(presetDir);

  if (alreadyInstalled) {
    const overwrite = await promptYesNo(
      `Tenets DDD preset already installed at .specify/presets/${SPECKIT_PRESET_ID}/. Reinstall?`
    );
    if (!overwrite) {
      // Still write the config entry so `tenets update` knows the preset is installed.
      updateSpeckitEntry(SPECKIT_PRESET_ID);
      logger.info('Skipped.');
      return;
    }
  }

  // Prefer the specify CLI so spec-kit manages its own registry
  if (isCommandAvailable('specify')) {
    logger.info('Installing via specify CLI...');
    try {
      execSync(`specify preset add --from ${SPECKIT_PRESET_RELEASE_URL}`, { stdio: 'inherit' });
      updateSpeckitEntry(SPECKIT_PRESET_ID);
      logger.blank();
      logger.success('Spec-Kit DDD preset installed via specify CLI!');
      _printSpeckitSummary();
      return;
    } catch {
      logger.warn('specify CLI install failed. Falling back to bundled install...');
    }
  }

  // Fallback: copy bundled preset files directly
  const bundledPresetDir = path.resolve(__dirname, '..', '..', 'bundled', 'speckit-preset');
  copyDirRecursive(bundledPresetDir, presetDir);
  updatePresetRegistry(path.resolve(specifyDir, 'presets'));
  updateSpeckitEntry(SPECKIT_PRESET_ID);

  logger.blank();
  logger.success('Spec-Kit DDD preset installed!');
  _printSpeckitSummary();
}

function _printSpeckitSummary() {
  logger.blank();
  logger.info('What was installed:');
  logger.dim(`  .specify/presets/${SPECKIT_PRESET_ID}/    DDD-enhanced templates (preset layer)`);
  logger.blank();
  logger.info('Templates now active (via Spec-Kit resolution stack):');
  logger.dim('  spec-template    Adds: Domain Language, Bounded Context, Candidate Domain Concepts');
  logger.dim('  plan-template    Adds: Constitution Check gate, Complexity Tracking');
  logger.dim('  tasks-template   Adds: DDD-aware structure, BDD test-first, parallel markers');
  logger.dim('  checklist-template  Adds: DDD/hexagonal architecture checklist items');
  logger.blank();
  logger.info('Your own .specify/templates/overrides/ always takes highest priority.');
  logger.dim('  Run `npx tenets update` to update the preset later.');
}

async function initCommand(args) {
  // --speckit is orthogonal — handle it independently before tool selection
  if (args.includes('--speckit')) {
    await initSpeckit();
    // If --speckit was the only flag, we're done
    const hasToolFlag = Object.values(TOOLS).some(t => args.includes(t.flag));
    if (!hasToolFlag) return;
  }

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

  if (tool.multiOutput) {
    const hash = computeClaudeHash(assembled);
    await initClaudeMultiOutput(args, toolKey, tool, content, hash);
  } else {
    const hash = computeHash(assembled);
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
    const overwrite = await promptYesNo(
      `.claude/rules/ already exists. Overwrite existing rules?`
    );
    if (!overwrite) {
      logger.info('Cancelled.');
      return;
    }
  }

  const { writtenFiles, claudeMdAction } = writeClaudeIntegration(projectRoot, content);

  if (claudeMdAction === 'appended') {
    logger.info('Appending Tenets block to existing CLAUDE.md.');
  }

  // Offer to install the continuous monitoring hook
  logger.blank();
  logger.info('Optional: Continuous architecture monitoring hook');
  logger.dim('  After every file edit, Claude checks whether the change respects');
  logger.dim('  DDD and Hexagonal Architecture rules for the layer you\'re working in.');
  logger.dim('  Yes  → adds a hook to .claude/settings.json (reversible: delete that file to remove)');
  logger.dim('  No   → skip for now; re-run `npx tenets init --claude` any time to add it later');
  logger.blank();
  const installHook = args.includes('--with-hook') || await promptYesNo(
    'Install continuous monitoring hook?'
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
  logger.dim('  .claude/skills/...           /tenets-review-architecture command');
  if (installHook) {
    logger.dim('  .claude/hooks/...            Continuous monitoring hook');
    logger.dim('  .claude/settings.json        Hook configuration');
  }
  logger.blank();
  logger.info('Usage:');
  logger.dim('  Edit any file — rules auto-load based on the layer you\'re working in');
  logger.dim('  Run /tenets-review-architecture for a full compliance review');
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
