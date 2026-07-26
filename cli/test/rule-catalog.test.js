const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRuleId,
  resolveRule,
  suggestRuleIds,
} = require('../src/services/rule-catalog');

const catalog = {
  entries: [
    {
      id: 'TENETS-PORT-001',
      title: 'Replacement',
      status: 'stable',
    },
    {
      id: 'TENETS-PORT-099',
      title: 'Old policy',
      status: 'deprecated',
      replaced_by: 'TENETS-PORT-001',
    },
  ],
  aliases: {
    'TENETS-PORT-098': 'TENETS-PORT-001',
  },
};

test('rule IDs are normalized and aliases resolve to canonical entries', () => {
  assert.equal(normalizeRuleId(' tenets-port-098 '), 'TENETS-PORT-098');
  const result = resolveRule(catalog, 'tenets-port-098');
  assert.equal(result.entry.id, 'TENETS-PORT-001');
  assert.equal(result.resolvedFrom, 'TENETS-PORT-098');
});

test('deprecated IDs redirect to their replacement and retain deprecation data', () => {
  const result = resolveRule(catalog, 'TENETS-PORT-099');
  assert.equal(result.entry.id, 'TENETS-PORT-001');
  assert.equal(result.resolvedFrom, 'TENETS-PORT-099');
  assert.equal(result.deprecatedEntry.id, 'TENETS-PORT-099');
});

test('unknown IDs receive deterministic close matches', () => {
  assert.deepEqual(
    suggestRuleIds(catalog, 'TENETS-PORT-002', 1),
    ['TENETS-PORT-001']
  );
});
