#!/usr/bin/env node

/**
 * Copies the latest content from the repo root into cli/bundled/
 * for offline fallback. Run before publishing: `npm run bundle`
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BUNDLED_DIR = path.resolve(__dirname, '..', 'bundled');
const BUNDLED_CONTEXT_DIR = path.join(BUNDLED_DIR, 'context');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const content = fs.readFileSync(src, 'utf-8');
  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`  ${path.relative(REPO_ROOT, src)} -> ${path.relative(REPO_ROOT, dest)}`);
}

console.log('Bundling content for offline fallback...\n');

ensureDir(BUNDLED_DIR);
ensureDir(BUNDLED_CONTEXT_DIR);

copyFile(
  path.join(REPO_ROOT, 'domain_driven_design_hexagonal_arhictecture_python_rules.md'),
  path.join(BUNDLED_DIR, 'rules.md')
);

const contextFiles = [
  'context/architecture/01-hexagonal-primer.md',
  'context/architecture/02-components.md',
  'context/global/project_structure.md',
];

for (const file of contextFiles) {
  const src = path.join(REPO_ROOT, file);
  const dest = path.join(BUNDLED_CONTEXT_DIR, path.basename(file));

  if (fs.existsSync(src)) {
    copyFile(src, dest);
  } else {
    console.log(`  SKIP: ${file} (not found)`);
  }
}

console.log('\nDone. Bundled content is ready.');
