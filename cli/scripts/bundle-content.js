#!/usr/bin/env node

/**
 * Copies the latest content from the repo root into cli/bundled/
 * for offline fallback. Run before publishing: `npm run bundle`
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BUNDLED_DIR = path.resolve(__dirname, '..', 'bundled');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const content = fs.readFileSync(src, 'utf-8');
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`  ${path.relative(REPO_ROOT, src)} -> ${path.relative(REPO_ROOT, dest)}`);
}

console.log('Bundling content for offline fallback...\n');

// Clean bundled directory
if (fs.existsSync(BUNDLED_DIR)) {
  fs.rmSync(BUNDLED_DIR, { recursive: true });
}
ensureDir(BUNDLED_DIR);

// Copy introduction
const introSrc = path.join(REPO_ROOT, 'context', '00-introduction.md');
if (fs.existsSync(introSrc)) {
  copyFile(introSrc, path.join(BUNDLED_DIR, '00-introduction.md'));
}

// Copy all section directories
const sections = ['architecture', 'domain', 'application', 'global'];

for (const section of sections) {
  const srcDir = path.join(REPO_ROOT, 'context', section);
  if (!fs.existsSync(srcDir)) {
    console.log(`  SKIP: context/${section}/ (not found)`);
    continue;
  }

  const destDir = path.join(BUNDLED_DIR, 'context', section);

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    copyFile(path.join(srcDir, file), path.join(destDir, file));
  }
}

console.log('\nDone. Bundled content is ready.');
