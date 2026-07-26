const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateCatalog,
  renderCatalog,
} = require('../scripts/build-knowledge');

function rule(overrides = {}) {
  return {
    id: 'TENETS-TEST-001',
    title: 'Complete test rule',
    kind: 'rule',
    status: 'stable',
    category: 'testing',
    severity: 'error',
    profiles: ['core'],
    related: [],
    aliases: [],
    body: [
      '## Rule',
      'Rule.',
      '## Rationale',
      'Rationale.',
      '## Incorrect',
      'Incorrect.',
      '## Correct',
      'Correct.',
      '## Remediation',
      'Remediation.',
      '## Review check',
      'Review check.',
    ].join('\n\n'),
    source: 'knowledge/rules/testing/TENETS-TEST-001.md',
    ...overrides,
  };
}

test('knowledge validation accepts a complete atomic rule', () => {
  assert.deepEqual(validateCatalog([rule()]), []);
});

test('knowledge validation rejects duplicate IDs and broken references', () => {
  const errors = validateCatalog([
    rule({ related: ['TENETS-MISSING-001'] }),
    rule({ source: 'knowledge/rules/testing/duplicate.md' }),
  ]);

  assert.ok(errors.some((error) => error.includes('duplicate ID TENETS-TEST-001')));
  assert.ok(errors.some((error) => error.includes('unknown related ID TENETS-MISSING-001')));
});

test('knowledge validation rejects incomplete records and unknown metadata', () => {
  const entry = rule({
    body: '## Rule\n\nOnly one section.',
    profiles: ['core', 'core'],
    invented: true,
  });
  const errors = validateCatalog([entry]);

  assert.ok(errors.some((error) => error.includes('unknown frontmatter field invented')));
  assert.ok(errors.some((error) => error.includes('profiles values must be unique')));
  assert.ok(errors.some((error) => error.includes('missing section ## Rationale')));
});

test('catalog includes aliases without duplicating entries', () => {
  const output = JSON.parse(
    renderCatalog([rule({ aliases: ['TENETS-TEST-099'] })])
  );

  assert.equal(output.entries.length, 1);
  assert.equal(output.aliases['TENETS-TEST-099'], 'TENETS-TEST-001');
});
