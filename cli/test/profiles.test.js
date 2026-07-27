const test = require('node:test');
const assert = require('node:assert/strict');

const {
  fetchContent,
  assembleContent,
} = require('../src/services/content-fetcher');
const {
  isEntryActive,
} = require('../src/services/profiles');
const {
  buildReviewCommand,
} = require('../src/services/review-command-writer');

test('profiles include entries cumulatively', () => {
  const coreEntry = { minimum_profile: 'core', applies_to: ['all'] };
  const pragmaticEntry = {
    minimum_profile: 'pragmatic',
    applies_to: ['all'],
  };
  const strictEntry = { minimum_profile: 'strict', applies_to: ['all'] };

  assert.equal(isEntryActive(coreEntry, 'core'), true);
  assert.equal(isEntryActive(coreEntry, 'pragmatic'), true);
  assert.equal(isEntryActive(coreEntry, 'strict'), true);
  assert.equal(isEntryActive(pragmaticEntry, 'core'), false);
  assert.equal(isEntryActive(pragmaticEntry, 'pragmatic'), true);
  assert.equal(isEntryActive(strictEntry, 'pragmatic'), false);
  assert.equal(isEntryActive(strictEntry, 'strict'), true);
});

test('technology applicability is independent from profile commitment', () => {
  const flaskEntry = {
    minimum_profile: 'core',
    applies_to: ['python', 'flask'],
  };

  assert.equal(isEntryActive(flaskEntry, 'strict', ['python', 'flask']), true);
  assert.equal(isEntryActive(flaskEntry, 'strict', ['python', 'fastapi']), false);
  assert.equal(isEntryActive(flaskEntry, 'strict', []), true);
});

test('bundled profile delivery grows from core to pragmatic to strict', async () => {
  const core = await fetchContent({ profile: 'core' });
  const pragmatic = await fetchContent({ profile: 'pragmatic' });
  const strict = await fetchContent({ profile: 'strict' });

  assert.equal(core.activeEntryIds.length, 68);
  assert.equal(pragmatic.activeEntryIds.length, 110);
  assert.equal(strict.activeEntryIds.length, 132);

  const coreRules = assembleContent(core);
  const pragmaticRules = assembleContent(pragmatic);
  const strictRules = assembleContent(strict);
  assert.match(coreRules, /TENETS-PORT-005/);
  assert.equal(core.activeEntryIds.includes('TENETS-EVENT-001'), false);
  assert.match(pragmaticRules, /TENETS-EVENT-001/);
  assert.equal(pragmatic.activeEntryIds.includes('TENETS-ADR-001'), false);
  assert.match(strictRules, /TENETS-ADR-001/);
  assert.match(strictRules, /TENETS-ASYNC-008/);
});

test('architecture review enforcement exposes only active rule IDs', async () => {
  const content = await fetchContent({ profile: 'core' });
  const command = buildReviewCommand('augment', content);
  const allowlist = command.match(
    /The following rule IDs[\s\S]*?Do not report/
  )?.[0];

  assert.ok(allowlist);
  assert.match(allowlist, /TENETS-PORT-005/);
  assert.doesNotMatch(allowlist, /TENETS-EVENT-008/);
  assert.doesNotMatch(allowlist, /TENETS-ADR-001/);
});
