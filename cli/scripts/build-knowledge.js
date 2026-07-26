#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const KNOWLEDGE_DIR = path.join(REPO_ROOT, 'knowledge');
const SCHEMA_PATH = path.join(KNOWLEDGE_DIR, 'schema.json');
const CATALOG_PATH = path.join(REPO_ROOT, 'catalog', 'rules.json');
const VIEW_MANIFEST_PATH = path.join(KNOWLEDGE_DIR, 'views.json');
const CHECK_MODE = process.argv.includes('--check');
const KNOWLEDGE_SCHEMA = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
const ID_PATTERN = new RegExp(KNOWLEDGE_SCHEMA.properties.id.pattern);

const REQUIRED_FIELDS = KNOWLEDGE_SCHEMA.required;

const REQUIRED_RULE_SECTIONS = [
  'Rule',
  'Rationale',
  'Incorrect',
  'Correct',
  'Remediation',
  'Review check',
];

const REQUIRED_PATTERN_SECTIONS = [
  'Purpose',
  'Implementation',
  'Trade-offs',
  'Related rules',
];
const ALLOWED_FIELDS = new Set([
  ...Object.keys(KNOWLEDGE_SCHEMA.properties),
  'body',
  'source',
]);

function normalizeNewlines(content) {
  return content.replace(/\r\n?/g, '\n');
}

function listMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? listMarkdownFiles(entryPath)
        : entry.name.endsWith('.md')
          ? [entryPath]
          : [];
    });
}

function parseScalar(value, filePath, key) {
  const trimmed = value.trim();
  if (trimmed === '') return '';

  if (
    trimmed.startsWith('[') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('"') ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    trimmed === 'null'
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new Error(
        `${path.relative(REPO_ROOT, filePath)}: invalid JSON value for ${key}: ${error.message}`
      );
    }
  }

  return trimmed;
}

function parseKnowledgeFile(filePath) {
  const source = normalizeNewlines(fs.readFileSync(filePath, 'utf-8'));
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(
      `${path.relative(REPO_ROOT, filePath)}: expected --- frontmatter delimiters`
    );
  }

  const metadata = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) {
      throw new Error(
        `${path.relative(REPO_ROOT, filePath)}: invalid frontmatter line: ${line}`
      );
    }
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1);
    if (Object.hasOwn(metadata, key)) {
      throw new Error(
        `${path.relative(REPO_ROOT, filePath)}: duplicate frontmatter key ${key}`
      );
    }
    metadata[key] = parseScalar(rawValue, filePath, key);
  }

  return {
    ...metadata,
    body: match[2].trim(),
    source: path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
  };
}

function sectionExists(body, section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^## ${escaped}\\s*$`, 'm').test(body);
}

function validateEntry(entry) {
  const errors = [];
  for (const field of Object.keys(entry)) {
    if (!ALLOWED_FIELDS.has(field)) {
      errors.push(`${entry.source}: unknown frontmatter field ${field}`);
    }
  }
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(entry, field)) {
      errors.push(`${entry.source}: missing frontmatter field ${field}`);
    }
  }

  if (!ID_PATTERN.test(entry.id || '')) {
    errors.push(`${entry.source}: invalid ID ${entry.id || '<missing>'}`);
  }
  if (!KNOWLEDGE_SCHEMA.properties.kind.enum.includes(entry.kind)) {
    errors.push(`${entry.source}: kind must be rule or pattern`);
  }
  if (!KNOWLEDGE_SCHEMA.properties.status.enum.includes(entry.status)) {
    errors.push(`${entry.source}: invalid status ${entry.status}`);
  }
  if (!KNOWLEDGE_SCHEMA.properties.severity.enum.includes(entry.severity)) {
    errors.push(`${entry.source}: invalid severity ${entry.severity}`);
  }
  for (const field of ['title', 'category']) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errors.push(`${entry.source}: ${field} must be a non-empty string`);
    }
  }
  for (const field of ['profiles', 'related', 'aliases', 'requires', 'supersedes']) {
    if (!Object.hasOwn(entry, field) && ['requires', 'supersedes'].includes(field)) {
      continue;
    }
    if (!Array.isArray(entry[field])) {
      errors.push(`${entry.source}: ${field} must be a JSON array`);
      continue;
    }
    if (field === 'profiles' && entry[field].length === 0) {
      errors.push(`${entry.source}: profiles must contain at least one profile`);
    }
    if (entry[field].some((value) => typeof value !== 'string')) {
      errors.push(`${entry.source}: ${field} values must be strings`);
    }
    if (new Set(entry[field]).size !== entry[field].length) {
      errors.push(`${entry.source}: ${field} values must be unique`);
    }
  }
  if (
    entry.status === 'deprecated' &&
    (!entry.replaced_by || typeof entry.replaced_by !== 'string')
  ) {
    errors.push(`${entry.source}: deprecated entries require replaced_by`);
  }

  const requiredSections =
    entry.kind === 'pattern'
      ? REQUIRED_PATTERN_SECTIONS
      : REQUIRED_RULE_SECTIONS;
  for (const section of requiredSections) {
    if (!sectionExists(entry.body || '', section)) {
      errors.push(`${entry.source}: missing section ## ${section}`);
    }
  }

  return errors;
}

function validateCatalog(entries) {
  const errors = entries.flatMap(validateEntry);
  const ids = new Map();
  const names = new Map();

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      errors.push(
        `duplicate ID ${entry.id}: ${ids.get(entry.id)} and ${entry.source}`
      );
    } else {
      ids.set(entry.id, entry.source);
      names.set(entry.id, entry.id);
    }
  }

  for (const entry of entries) {
    for (const alias of entry.aliases || []) {
      if (!ID_PATTERN.test(alias)) {
        errors.push(`${entry.source}: invalid alias ${alias}`);
      } else if (names.has(alias)) {
        errors.push(
          `${entry.source}: alias ${alias} conflicts with ${names.get(alias)}`
        );
      } else {
        names.set(alias, entry.id);
      }
    }
  }

  for (const entry of entries) {
    for (const field of ['related', 'requires', 'supersedes']) {
      for (const reference of entry[field] || []) {
        if (!ids.has(reference)) {
          errors.push(`${entry.source}: unknown ${field} ID ${reference}`);
        } else if (reference === entry.id) {
          errors.push(`${entry.source}: ${field} must not reference its own ID`);
        }
      }
    }
    if (entry.replaced_by && !ids.has(entry.replaced_by)) {
      errors.push(`${entry.source}: unknown replacement ID ${entry.replaced_by}`);
    } else if (entry.replaced_by === entry.id) {
      errors.push(`${entry.source}: replaced_by must not reference its own ID`);
    }
  }

  return errors;
}

function renderCatalog(entries) {
  const aliases = {};
  for (const entry of entries) {
    for (const alias of entry.aliases) aliases[alias] = entry.id;
  }

  return `${JSON.stringify({
    schema_version: 1,
    generated_from: 'knowledge/',
    entries,
    aliases,
  }, null, 2)}\n`;
}

function renderView(view, entriesById) {
  const parts = [
    '<!-- tenets:generated-source -->',
    `# ${view.title}`,
    '',
    '> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.',
    '',
  ];

  for (const id of view.entries) {
    const entry = entriesById.get(id);
    if (!entry) {
      throw new Error(`${view.output}: view references unknown ID ${id}`);
    }
    parts.push(`## ${entry.id}: ${entry.title}`, '', entry.body, '');
  }

  return `${parts.join('\n').trim()}\n`;
}

function assertOrWrite(filePath, content, errors) {
  if (CHECK_MODE) {
    if (!fs.existsSync(filePath)) {
      errors.push(`${path.relative(REPO_ROOT, filePath)}: generated file is missing`);
      return;
    }
    if (normalizeNewlines(fs.readFileSync(filePath, 'utf-8')) !== content) {
      errors.push(
        `${path.relative(REPO_ROOT, filePath)}: generated file is stale; run npm run catalog from cli/`
      );
    }
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function buildKnowledge() {
  const files = [
    ...listMarkdownFiles(path.join(KNOWLEDGE_DIR, 'rules')),
    ...listMarkdownFiles(path.join(KNOWLEDGE_DIR, 'patterns')),
  ];
  if (files.length === 0) {
    throw new Error('No knowledge entries found under knowledge/rules or knowledge/patterns');
  }

  const entries = files
    .map(parseKnowledgeFile)
    .sort((left, right) => left.id.localeCompare(right.id));
  const errors = validateCatalog(entries);
  if (errors.length > 0) {
    throw new Error(`Knowledge validation failed:\n- ${errors.join('\n- ')}`);
  }

  const generatedErrors = [];
  assertOrWrite(CATALOG_PATH, renderCatalog(entries), generatedErrors);

  const views = JSON.parse(fs.readFileSync(VIEW_MANIFEST_PATH, 'utf-8'));
  if (!views || !Array.isArray(views.views)) {
    throw new Error('knowledge/views.json must contain a views array');
  }
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
  const viewOutputs = new Set();
  for (const view of views.views) {
    if (
      !view ||
      typeof view.title !== 'string' ||
      !Array.isArray(view.entries) ||
      typeof view.output !== 'string'
    ) {
      generatedErrors.push('knowledge/views.json: every view requires output, title, and entries');
      continue;
    }
    if (viewOutputs.has(view.output)) {
      generatedErrors.push(`knowledge/views.json: duplicate output ${view.output}`);
      continue;
    }
    viewOutputs.add(view.output);
    const outputPath = path.resolve(REPO_ROOT, view.output);
    if (!outputPath.startsWith(`${REPO_ROOT}${path.sep}`)) {
      generatedErrors.push(`knowledge/views.json: output escapes repository: ${view.output}`);
      continue;
    }
    assertOrWrite(
      outputPath,
      renderView(view, entriesById),
      generatedErrors
    );
  }

  if (generatedErrors.length > 0) {
    throw new Error(`Generated knowledge validation failed:\n- ${generatedErrors.join('\n- ')}`);
  }

  console.log(
    `${CHECK_MODE ? 'Validated' : 'Generated'} ${entries.length} knowledge entries and ${views.views.length} views.`
  );
}

if (require.main === module) {
  try {
    buildKnowledge();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  normalizeNewlines,
  parseKnowledgeFile,
  validateCatalog,
  renderCatalog,
  renderView,
  buildKnowledge,
};
