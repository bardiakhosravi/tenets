const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { MARKERS } = require('../src/constants');
const { fetchContent } = require('../src/services/content-fetcher');
const {
  writeCursorIntegration,
} = require('../src/services/cursor-writer');
const {
  writeCopilotIntegration,
} = require('../src/services/copilot-writer');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-integration-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('Cursor writes always-on and path-scoped MDC rules', async (t) => {
  const directory = temporaryDirectory(t);
  fs.writeFileSync(
    path.join(directory, '.cursorrules'),
    `Keep this\n\n${MARKERS.start}\nLegacy Tenets\n${MARKERS.end}\n`
  );

  const result = writeCursorIntegration(directory, await fetchContent());

  assert.equal(result.writtenFiles.length, 5);
  assert.equal(result.removedLegacyRules, true);
  assert.equal(
    fs.readFileSync(path.join(directory, '.cursorrules'), 'utf-8'),
    'Keep this\n'
  );

  const globalRule = fs.readFileSync(
    path.join(directory, '.cursor/rules/tenets-global.mdc'),
    'utf-8'
  );
  const domainRule = fs.readFileSync(
    path.join(directory, '.cursor/rules/tenets-domain.mdc'),
    'utf-8'
  );
  assert.match(globalRule, /alwaysApply: true/);
  assert.match(domainRule, /globs: "\*\*\/domain\/\*\*"/);
  assert.match(domainRule, /alwaysApply: false/);
  assert.ok(
    fs.existsSync(
      path.join(directory, '.cursor/commands/tenets-review-architecture.md')
    )
  );
});

test('Copilot preserves global user content and writes scoped instructions', async (t) => {
  const directory = temporaryDirectory(t);
  const globalPath = path.join(directory, '.github/copilot-instructions.md');
  fs.mkdirSync(path.dirname(globalPath), { recursive: true });
  fs.writeFileSync(globalPath, '# Team instructions\n\nKeep this rule.\n');

  const first = writeCopilotIntegration(directory, await fetchContent());
  const second = writeCopilotIntegration(directory, await fetchContent());

  assert.equal(first.globalAction, 'appended');
  assert.equal(second.globalAction, 'replaced');
  assert.equal(first.writtenFiles.length, 6);

  const globalInstructions = fs.readFileSync(globalPath, 'utf-8');
  assert.match(globalInstructions, /Keep this rule\./);
  assert.equal(globalInstructions.split(MARKERS.start).length - 1, 1);

  const applicationInstructions = fs.readFileSync(
    path.join(
      directory,
      '.github/instructions/tenets-application.instructions.md'
    ),
    'utf-8'
  );
  assert.match(
    applicationInstructions,
    /applyTo: "\*\*\/application\/\*\*,\*\*\/use_cases\/\*\*,\*\*\/handlers\/\*\*"/
  );
  assert.ok(
    fs.existsSync(
      path.join(
        directory,
        '.github/prompts/tenets-review-architecture.prompt.md'
      )
    )
  );
});

test('bundled content loads without making a network request', async () => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => {
    called = true;
    throw new Error('network unavailable');
  };

  try {
    const content = await fetchContent();
    assert.equal(called, false);
    assert.ok(content.introduction.length > 0);
    assert.equal(content.sections.length, 4);
    assert.ok(content.sections.every((section) => section.files.length > 0));
  } finally {
    global.fetch = originalFetch;
  }
});
