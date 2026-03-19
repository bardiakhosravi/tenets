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
  ensureDir(path.dirname(dest));
  const content = fs.readFileSync(src, 'utf-8');
  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`  ${path.relative(REPO_ROOT, src)} -> ${path.relative(REPO_ROOT, dest)}`);
}

console.log('Bundling content for offline fallback...\n');

ensureDir(BUNDLED_DIR);
ensureDir(BUNDLED_CONTEXT_DIR);

// Introduction file
copyFile(
  path.join(REPO_ROOT, 'context/00-introduction.md'),
  path.join(BUNDLED_DIR, '00-introduction.md')
);

// Context files — preserve directory structure
const contextFiles = [
  // Architecture
  'context/architecture/01-hexagonal-primer.md',
  'context/architecture/02-components.md',
  'context/architecture/03-ports.md',
  'context/architecture/04-primary-adapters.md',
  'context/architecture/05-secondary-adapters.md',
  'context/architecture/06-adapter-configuration.md',
  'context/architecture/07-integration-flow.md',
  'context/architecture/08-infrastructure-replaceability.md',
  'context/architecture/09-api-boundaries.md',
  // Domain
  'context/domain/01-entities.md',
  'context/domain/02-value-objects.md',
  'context/domain/03-aggregates.md',
  'context/domain/04-domain-services.md',
  'context/domain/05-repositories.md',
  'context/domain/06-domain-events.md',
  'context/domain/07-bounded-contexts.md',
  'context/domain/08-ubiquitous-language.md',
  // Application
  'context/application/01-use-cases.md',
  'context/application/02-synergy-rules.md',
  'context/application/03-event-integration.md',
  'context/application/04-cross-context-communication.md',
  // Global
  'context/global/project_structure.md',
  'context/global/cross-cutting-concerns.md',
  'context/global/validation-error-handling.md',
  'context/global/naming-conventions.md',
  'context/global/dependency-rules.md',
  'context/global/testing.md',
  'context/global/async-idempotency.md',
  'context/global/architecture-decision-records.md',
];

for (const file of contextFiles) {
  const src = path.join(REPO_ROOT, file);
  // Preserve subdirectory structure: context/architecture/foo.md -> bundled/context/architecture/foo.md
  const relativePath = file.replace(/^context\//, '');
  const dest = path.join(BUNDLED_CONTEXT_DIR, relativePath);

  if (fs.existsSync(src)) {
    copyFile(src, dest);
  } else {
    console.log(`  SKIP: ${file} (not found)`);
  }
}

console.log('\nDone. Bundled content is ready.');
