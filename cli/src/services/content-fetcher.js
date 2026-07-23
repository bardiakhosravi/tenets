const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  GITHUB_RAW_BASE,
  INTRODUCTION_FILE,
  CONTENT_SECTIONS,
  MARKERS,
  CODE_REVIEW_AGENT_TEMPLATE,
} = require('../constants');
const { logger } = require('../ui/logger');

const BUNDLED_DIR = path.join(__dirname, '..', '..', 'bundled');
const CLI_ROOT = path.join(__dirname, '..', '..');

function readCliFile(relativePath) {
  return fs.readFileSync(path.join(CLI_ROOT, relativePath), 'utf-8');
}

async function fetchUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromGitHub() {
  logger.info('Fetching latest rules from GitHub...');

  const introduction = await fetchUrl(`${GITHUB_RAW_BASE}/${INTRODUCTION_FILE.path}`);

  const sections = [];
  for (const section of CONTENT_SECTIONS) {
    const files = [];
    for (const entry of section.files) {
      const content = await fetchUrl(`${GITHUB_RAW_BASE}/${entry.path}`);
      files.push({ title: entry.title, content });
    }
    sections.push({ section: section.section, files });
  }

  return { introduction, sections };
}

function loadBundled() {
  logger.info('Using bundled content (offline fallback)...');

  const introPath = path.join(BUNDLED_DIR, '00-introduction.md');
  const introduction = fs.existsSync(introPath)
    ? fs.readFileSync(introPath, 'utf-8')
    : '';

  const sections = [];
  for (const section of CONTENT_SECTIONS) {
    const files = [];
    for (const entry of section.files) {
      const fileName = path.basename(entry.path);
      const sectionDir = section.section.toLowerCase();
      const filePath = path.join(BUNDLED_DIR, 'context', sectionDir, fileName);

      if (fs.existsSync(filePath)) {
        files.push({
          title: entry.title,
          content: fs.readFileSync(filePath, 'utf-8'),
        });
      }
    }
    sections.push({ section: section.section, files });
  }

  return { introduction, sections };
}

async function fetchContent() {
  try {
    return await fetchFromGitHub();
  } catch {
    logger.warn('Could not fetch from GitHub, using bundled content.');
    return loadBundled();
  }
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
function assembleCodeReviewAgentContent(assembledRules) {
  const rulebook = stripTenetsMarkers(assembledRules);
  const template = readCliFile(CODE_REVIEW_AGENT_TEMPLATE);

  return `${MARKERS.start}\n${template.replace('{{TENETS_RULEBOOK}}', rulebook).trim()}\n${MARKERS.end}\n`;
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
function computeClaudeHash(assembled) {
  const {
    CLAUDE_MD_SNIPPET,
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
    CLAUDE_MD_SNIPPET +
    buildReviewCommand('claude') +
    codeReviewAgentTemplate +
    codeReviewHookPromptTemplate +
    CLAUDE_HOOK_SCRIPT;
  return computeHash(combined);
}

function computeAugmentHash(assembled) {
  const { AUGMENT_RULE_DEFINITIONS } = require('../constants');
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---AUGMENT_RULES---\n${JSON.stringify(AUGMENT_RULE_DEFINITIONS)}` +
    `\n---AUGMENT_COMMAND---\n${buildReviewCommand('augment')}`
  );
}

function computeReviewCommandHash(assembled, toolKey) {
  const { buildReviewCommand } = require('./review-command-writer');
  return computeHash(
    `${assembled}\n---REVIEW_COMMAND:${toolKey}---\n${buildReviewCommand(toolKey)}`
  );
}

module.exports = {
  fetchContent,
  assembleContent,
  assembleCodeReviewAgentContent,
  computeHash,
  computeClaudeHash,
  computeAugmentHash,
  computeReviewCommandHash,
};
