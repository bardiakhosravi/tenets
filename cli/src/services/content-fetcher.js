const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  CONTENT_SECTIONS,
  MARKERS,
  CODE_REVIEW_AGENT_TEMPLATE,
} = require('../constants');
const { logger } = require('../ui/logger');
const {
  LEGACY_PROFILE,
  isEntryActive,
  normalizeProfile,
  profileDescription,
} = require('./profiles');

const BUNDLED_DIR = path.join(__dirname, '..', '..', 'bundled');
const CLI_ROOT = path.join(__dirname, '..', '..');
const PACKAGE_VERSION = require('../../package.json').version;
const CATALOG_PATH = path.join(BUNDLED_DIR, 'catalog', 'rules.json');
const VIEWS_PATH = path.join(BUNDLED_DIR, 'knowledge', 'views.json');

function readCliFile(relativePath) {
  return fs.readFileSync(path.join(CLI_ROOT, relativePath), 'utf-8');
}

function renderView(view, entriesById, activeEntryIds) {
  const parts = [
    '<!-- tenets:generated-source -->',
    `# ${view.title}`,
    '',
    `> Generated for the active Tenets profile from canonical knowledge entries.`,
    '',
  ];
  let renderedEntries = 0;
  for (const id of view.entries) {
    if (!activeEntryIds.has(id)) continue;
    const entry = entriesById.get(id);
    if (!entry) continue;
    parts.push(`## ${entry.id}: ${entry.title}`, '', entry.body, '');
    renderedEntries++;
  }
  return renderedEntries > 0
    ? `${parts.join('\n').trim()}\n`
    : null;
}

function loadBundled(options = {}) {
  logger.info(`Using versioned rules bundled with tenets v${PACKAGE_VERSION}...`);
  const profile = normalizeProfile(options.profile || LEGACY_PROFILE);
  const appliesTo = options.appliesTo || [];
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const viewManifest = JSON.parse(fs.readFileSync(VIEWS_PATH, 'utf-8'));
  const entriesById = new Map(
    catalog.entries.map((entry) => [entry.id, entry])
  );
  const activeEntries = catalog.entries.filter((entry) =>
    isEntryActive(entry, profile, appliesTo)
  );
  const activeEntryIds = new Set(activeEntries.map((entry) => entry.id));
  const viewsByOutput = new Map(
    viewManifest.views.map((view) => [view.output, view])
  );

  const introPath = path.join(BUNDLED_DIR, '00-introduction.md');
  const baseIntroduction = fs.existsSync(introPath)
    ? fs.readFileSync(introPath, 'utf-8')
    : '';
  const targetDescription = appliesTo.length > 0
    ? appliesTo.join(', ')
    : 'unrestricted';
  const introduction = [
    baseIntroduction.trim(),
    '',
    '## Active Tenets Profile',
    '',
    `- Profile: \`${profile}\``,
    `- Applicability: ${targetDescription}`,
    `- Active knowledge entries: ${activeEntries.length} of ${catalog.entries.length}`,
    '',
    profileDescription(profile),
    '',
    'Only active rule IDs may be reported as Tenets compliance violations.',
  ].join('\n');

  const sections = [];
  for (const section of CONTENT_SECTIONS) {
    const files = [];
    for (const entry of section.files) {
      const view = viewsByOutput.get(entry.path);
      const content = view
        ? renderView(view, entriesById, activeEntryIds)
        : (() => {
            const fileName = path.basename(entry.path);
            const sectionDir = section.section.toLowerCase();
            const filePath = path.join(
              BUNDLED_DIR,
              'context',
              sectionDir,
              fileName
            );
            return fs.existsSync(filePath)
              ? fs.readFileSync(filePath, 'utf-8')
              : null;
          })();

      if (content) {
        files.push({
          title: entry.title,
          content,
        });
      }
    }
    sections.push({ section: section.section, files });
  }

  return {
    introduction,
    sections,
    profile,
    appliesTo,
    activeRuleIds: activeEntries
      .filter((entry) => entry.kind === 'rule')
      .map((entry) => entry.id),
    activeEntryIds: [...activeEntryIds],
  };
}

async function fetchContent(options = {}) {
  return loadBundled(options);
}

/**
 * Assemble all content into a single string for single-file tools
 * (Cursor, Copilot, AGENTS.md).
 */
function assembleContent({ introduction, sections }) {
  const parts = [
    MARKERS.start,
    introduction.trim(),
    '',
  ];

  for (const section of sections) {
    parts.push(`---`, '', `# ${section.section}`, '');
    for (const file of section.files) {
      parts.push(file.content.trim(), '');
    }
  }

  parts.push(MARKERS.end, '');
  return parts.join('\n');
}

function stripTenetsMarkers(content) {
  return content
    .replace(MARKERS.start, '')
    .replace(MARKERS.end, '')
    .trim();
}

/**
 * Assemble a standalone prompt for a repository-installed code review agent.
 * This file is intentionally tool-agnostic: any local or remote parent agent can
 * load it as the review agent's system/project instructions.
 */
function formatActiveRuleIds(content = {}) {
  return (content.activeRuleIds || [])
    .map((id) => `- \`${id}\``)
    .join('\n');
}

function assembleCodeReviewAgentContent(assembledRules, content = {}) {
  const rulebook = stripTenetsMarkers(assembledRules);
  const template = readCliFile(CODE_REVIEW_AGENT_TEMPLATE);

  const renderedTemplate = template
    .replace('{{TENETS_RULEBOOK}}', rulebook)
    .replace('{{ACTIVE_PROFILE}}', content.profile || LEGACY_PROFILE)
    .replace('{{ACTIVE_RULE_IDS}}', formatActiveRuleIds(content));
  return `${MARKERS.start}\n${renderedTemplate.trim()}\n${MARKERS.end}\n`;
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compute a hash that covers both fetched content AND CLI templates
 * (CLAUDE.md snippet, skill, hook). This ensures that when we release
 * a new CLI version with updated templates, `npx tenets update` detects
 * the change even if the rule content hasn't changed.
 */
function computeClaudeHash(assembled, content = {}) {
  const {
    CLAUDE_MD_SNIPPET,
    CLAUDE_RULE_DEFINITIONS,
    CLAUDE_CODE_REVIEW_AGENT_TEMPLATE,
    CODE_REVIEW_AGENT_HOOK_PROMPT_TEMPLATE,
    CLAUDE_HOOK_SCRIPT,
  } = require('../constants');
  const { buildReviewCommand } = require('./review-command-writer');
  const codeReviewAgentTemplate = readCliFile(CLAUDE_CODE_REVIEW_AGENT_TEMPLATE);
  const codeReviewHookPromptTemplate = readCliFile(CODE_REVIEW_AGENT_HOOK_PROMPT_TEMPLATE);
  const combined =
    assembled +
    '\n---CLI_TEMPLATES---\n' +
    JSON.stringify(CLAUDE_RULE_DEFINITIONS) +
    CLAUDE_MD_SNIPPET +
    buildReviewCommand('claude', content) +
    codeReviewAgentTemplate +
    codeReviewHookPromptTemplate +
    CLAUDE_HOOK_SCRIPT;
  return computeHash(combined);
}

function computeAugmentHash(assembled, content = {}) {
  const { AUGMENT_RULE_DEFINITIONS } = require('../constants');
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---AUGMENT_RULES---\n${JSON.stringify(AUGMENT_RULE_DEFINITIONS)}` +
    `\n---AUGMENT_COMMAND---\n${buildReviewCommand('augment', content)}`
  );
}

function computeCursorHash(assembled, content = {}) {
  const { CURSOR_RULE_DEFINITIONS } = require('../constants');
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---CURSOR_RULES---\n${JSON.stringify(CURSOR_RULE_DEFINITIONS)}` +
    `\n---CURSOR_COMMAND---\n${buildReviewCommand('cursor', content)}`
  );
}

function computeCopilotHash(assembled, content = {}) {
  const {
    COPILOT_INSTRUCTION_DEFINITIONS,
    COPILOT_MD_SNIPPET,
  } = require('../constants');
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---COPILOT_INSTRUCTIONS---\n` +
    JSON.stringify(COPILOT_INSTRUCTION_DEFINITIONS) +
    COPILOT_MD_SNIPPET +
    `\n---COPILOT_PROMPT---\n${buildReviewCommand('copilot', content)}`
  );
}

function computeReviewCommandHash(assembled, toolKey, content = {}) {
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---REVIEW_COMMAND:${toolKey}---\n${buildReviewCommand(toolKey, content)}`
  );
}

module.exports = {
  fetchContent,
  assembleContent,
  assembleCodeReviewAgentContent,
  computeHash,
  computeClaudeHash,
  computeAugmentHash,
  computeCursorHash,
  computeCopilotHash,
  computeReviewCommandHash,
};
