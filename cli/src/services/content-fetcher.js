const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { GITHUB_RAW_BASE, INTRODUCTION_FILE, CONTENT_SECTIONS } = require('../constants');
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

  const introUrl = `${GITHUB_RAW_BASE}/${INTRODUCTION_FILE.path}`;
  const introduction = await fetchUrl(introUrl);

  const sections = [];
  for (const section of CONTENT_SECTIONS) {
    const files = [];
    for (const file of section.files) {
      const url = `${GITHUB_RAW_BASE}/${file.path}`;
      const content = await fetchUrl(url);
      files.push({ title: file.title, content });
    }
    sections.push({ section: section.section, files });
  }

  return { introduction, sections };
}

function loadBundled() {
  logger.info('Using bundled content (offline fallback)...');

  const contextDir = path.join(BUNDLED_DIR, 'context');

  const introPath = path.join(BUNDLED_DIR, '00-introduction.md');
  const introduction = fs.existsSync(introPath)
    ? fs.readFileSync(introPath, 'utf-8')
    : '';

  const sections = [];
  for (const section of CONTENT_SECTIONS) {
    const files = [];
    for (const file of section.files) {
      const relativePath = file.path.replace(/^context\//, '');
      const filePath = path.join(contextDir, relativePath);
      if (fs.existsSync(filePath)) {
        files.push({
          title: file.title,
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
 * Concatenate all content into a single string for hash comparison.
 * Used only for change detection — not written to disk.
 */
function assembleContent({ introduction, sections }) {
  const parts = [introduction.trim()];

  for (const section of sections) {
    for (const file of section.files) {
      parts.push(file.content.trim());
    }
  }

  return parts.join('\n');
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = { fetchContent, assembleContent, computeHash };
