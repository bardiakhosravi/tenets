const test = require('node:test');
const assert = require('node:assert/strict');

const {
  recommendNextAction,
} = require('../src/services/next-action-recommender');

function detection({
  languages = [],
  frameworks = [],
  kind = 'flat',
  sourceRoots = [],
  architectureDirectories = [],
} = {}) {
  return {
    languages: languages.map((id) => ({ id })),
    frameworks: frameworks.map((id) => ({ id })),
    layout: {
      kind,
      sourceRoots,
      architectureDirectories,
    },
  };
}

test('recommends scaffolding for an empty repository', () => {
  const result = recommendNextAction(detection());

  assert.equal(result.type, 'scaffold');
  assert.equal(result.command, '/tenets-scaffold');
  assert.equal(result.scope, 'current service');
});

test('delegates Flask starter classification to the scaffold workflow', () => {
  const result = recommendNextAction(
    detection({
      languages: ['python'],
      frameworks: ['flask'],
      kind: 'source-root',
      sourceRoots: ['src'],
    })
  );

  assert.equal(result.type, 'classify_and_scaffold');
  assert.equal(result.command, '/tenets-scaffold');
  assert.match(result.instruction, /classify this Flask repository/);
});

test('recommends a scoped review for existing architecture boundaries', () => {
  const result = recommendNextAction(
    detection({
      languages: ['python'],
      frameworks: ['fastapi'],
      kind: 'layered',
      sourceRoots: ['src'],
      architectureDirectories: ['src/application', 'src/domain'],
    })
  );

  assert.equal(result.type, 'scoped_review');
  assert.equal(
    result.command,
    '/tenets-review-architecture <path-or-workflow>'
  );
  assert.equal(result.scope, 'one existing boundary or the current change');
});

test('limits adoption guidance to the next bounded change', () => {
  const result = recommendNextAction(
    detection({
      languages: ['javascript'],
      frameworks: ['express'],
    })
  );

  assert.equal(result.type, 'scoped_adoption');
  assert.equal(
    result.command,
    '/tenets-review-architecture <changed-path-or-workflow>'
  );
  assert.equal(result.scope, 'the next bounded change');
  assert.doesNotMatch(result.instruction, /entire repository/);
});
