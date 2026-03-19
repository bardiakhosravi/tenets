const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { GITHUB_URLS, MARKERS } = require('../constants');
const { logger } = require('../ui/logger');

const BUNDLED_DIR = path.join(__dirname, '..', '..', 'bundled');

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

  const rules = await fetchUrl(GITHUB_URLS.rules);

  const contextFiles = [];
  for (const entry of GITHUB_URLS.context) {
    const content = await fetchUrl(entry.url);
    contextFiles.push({ title: entry.title, content });
  }

  return { rules, contextFiles };
}

function loadBundled() {
  logger.info('Using bundled content (offline fallback)...');

  const rulesPath = path.join(BUNDLED_DIR, 'rules.md');
  if (!fs.existsSync(rulesPath)) {
    throw new Error(
      'Bundled rules not found. Please reinstall the package.'
    );
  }

  const rules = fs.readFileSync(rulesPath, 'utf-8');

  const contextDir = path.join(BUNDLED_DIR, 'context');
  const contextFiles = [];

  const contextEntries = [
    { file: '01-hexagonal-primer.md', title: 'Hexagonal Architecture Primer' },
    { file: '02-components.md', title: 'Components' },
    { file: 'project_structure.md', title: 'Project Structure' },
  ];

  for (const entry of contextEntries) {
    const filePath = path.join(contextDir, entry.file);
    if (fs.existsSync(filePath)) {
      contextFiles.push({
        title: entry.title,
        content: fs.readFileSync(filePath, 'utf-8'),
      });
    }
  }

  return { rules, contextFiles };
}

async function fetchContent() {
  try {
    return await fetchFromGitHub();
  } catch {
    logger.warn('Could not fetch from GitHub, using bundled content.');
    return loadBundled();
  }
}

function assembleContent(rules, contextFiles) {
  const parts = [
    MARKERS.start,
    '# DDD + Hexagonal Architecture Rules',
    '',
    '> Installed by tenets. Run `npx tenets update` to update.',
    '',
    rules.trim(),
  ];

  for (const ctx of contextFiles) {
    parts.push('', '---', `## Appendix: ${ctx.title}`, '', ctx.content.trim());
  }

  parts.push('', MARKERS.end, '');

  return parts.join('\n');
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = { fetchContent, assembleContent, computeHash };
