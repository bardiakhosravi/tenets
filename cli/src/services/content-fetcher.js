const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { GITHUB_RAW_BASE, INTRODUCTION_FILE, CONTENT_SECTIONS, MARKERS } = require('../constants');
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

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = { fetchContent, assembleContent, computeHash };
