const fs = require('node:fs');
const path = require('node:path');

const CATALOG_PATH = path.join(
  __dirname,
  '..',
  '..',
  'bundled',
  'catalog',
  'rules.json'
);

function loadRuleCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(
      'The bundled rule catalog is missing. Reinstall Tenets or run `npm run bundle` from the cli directory.'
    );
  }
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
}

function normalizeRuleId(value) {
  return String(value || '').trim().toUpperCase();
}

function levenshtein(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0)
  );
  for (let row = 0; row <= left.length; row++) rows[row][0] = row;
  for (let column = 0; column <= right.length; column++) rows[0][column] = column;

  for (let row = 1; row <= left.length; row++) {
    for (let column = 1; column <= right.length; column++) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + substitution
      );
    }
  }
  return rows[left.length][right.length];
}

function suggestRuleIds(catalog, requestedId, limit = 3) {
  const normalized = normalizeRuleId(requestedId);
  return catalog.entries
    .map((entry) => ({
      id: entry.id,
      distance: levenshtein(normalized, entry.id),
    }))
    .sort((left, right) =>
      left.distance - right.distance || left.id.localeCompare(right.id)
    )
    .slice(0, limit)
    .map((item) => item.id);
}

function resolveRule(catalog, requestedId) {
  const normalized = normalizeRuleId(requestedId);
  const canonicalId = catalog.aliases[normalized] || normalized;
  let entry = catalog.entries.find((candidate) => candidate.id === canonicalId);
  if (!entry) {
    return {
      entry: null,
      requestedId: normalized,
      suggestions: suggestRuleIds(catalog, normalized),
    };
  }
  const deprecatedEntry =
    entry.status === 'deprecated' && entry.replaced_by
      ? entry
      : null;
  if (deprecatedEntry) {
    entry = catalog.entries.find(
      (candidate) => candidate.id === deprecatedEntry.replaced_by
    );
  }
  return {
    entry,
    requestedId: normalized,
    resolvedFrom:
      canonicalId === normalized && !deprecatedEntry ? null : normalized,
    deprecatedEntry,
    suggestions: [],
  };
}

module.exports = {
  loadRuleCatalog,
  normalizeRuleId,
  resolveRule,
  suggestRuleIds,
};
