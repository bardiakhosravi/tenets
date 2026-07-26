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
const {
  writeClaudeIntegration,
  writeHookSettings,
} = require('../src/services/claude-writer');
const {
  FileOwnershipConflictError,
} = require('../src/services/file-writer');

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
  const applicationRule = fs.readFileSync(
    path.join(directory, '.cursor/rules/tenets-application.mdc'),
    'utf-8'
  );
  assert.match(globalRule, /alwaysApply: true/);
  assert.match(domainRule, /globs: "\*\*\/domain\/\*\*"/);
  assert.match(domainRule, /alwaysApply: false/);
  assert.match(applicationRule, /TENETS-UOW-001/);
  assert.match(applicationRule, /TENETS-EVENT-008/);
  assert.match(globalRule, /TENETS-ASYNC-008/);
  const reviewCommand = fs.readFileSync(
    path.join(directory, '.cursor/commands/tenets-review-architecture.md'),
    'utf-8'
  );
  assert.match(reviewCommand, /One valid stable Tenets rule ID and its title/);
  assert.match(reviewCommand, /Do not invent rule IDs/);
  assert.doesNotMatch(reviewCommand, /One class per file/);
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
  assert.match(applicationInstructions, /TENETS-UOW-001/);
  assert.match(applicationInstructions, /TENETS-EVENT-008/);
  const globalTenetsInstructions = fs.readFileSync(
    path.join(
      directory,
      '.github/instructions/tenets-global.instructions.md'
    ),
    'utf-8'
  );
  assert.match(globalTenetsInstructions, /TENETS-ASYNC-008/);
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
    const application = content.sections.find(
      (section) => section.section === 'Application'
    );
    assert.ok(
      application.files.some(
        (file) => file.title === 'Unit of Work'
      )
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('integration preflight prevents partial writes on ownership conflict', async (t) => {
  const directory = temporaryDirectory(t);
  const conflictingPath = path.join(
    directory,
    '.cursor/rules/tenets-domain.mdc'
  );
  fs.mkdirSync(path.dirname(conflictingPath), { recursive: true });
  fs.writeFileSync(conflictingPath, 'User-authored Cursor rule\n');

  assert.throws(
    () => writeCursorIntegration(directory, awaitContent()),
    FileOwnershipConflictError
  );
  assert.equal(
    fs.readFileSync(conflictingPath, 'utf-8'),
    'User-authored Cursor rule\n'
  );
  assert.equal(
    fs.existsSync(path.join(directory, '.cursor/rules/tenets-global.mdc')),
    false
  );

  function awaitContent() {
    return {
      introduction: 'Introduction',
      sections: [
        { section: 'Global', files: [] },
        { section: 'Architecture', files: [] },
        { section: 'Domain', files: [] },
        { section: 'Application', files: [] },
      ],
    };
  }
});

test('Claude preserves shared settings and refuses malformed JSON', async (t) => {
  const directory = temporaryDirectory(t);
  const settingsPath = path.join(directory, '.claude/settings.json');
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(
    settingsPath,
    JSON.stringify({ permissions: { allow: ['Read'] }, hooks: {} }, null, 2)
  );

  writeHookSettings(directory);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assert.deepEqual(settings.permissions, { allow: ['Read'] });
  assert.equal(settings.hooks.PostToolUse.length, 1);

  fs.writeFileSync(settingsPath, '{ invalid json');
  assert.throws(
    () => writeHookSettings(directory),
    /Refusing to overwrite malformed shared settings file/
  );
  assert.equal(fs.readFileSync(settingsPath, 'utf-8'), '{ invalid json');

  fs.writeFileSync(settingsPath, JSON.stringify({ hooks: [] }));
  assert.throws(
    () => writeHookSettings(directory),
    /non-object hooks value/
  );
  assert.equal(
    fs.readFileSync(settingsPath, 'utf-8'),
    JSON.stringify({ hooks: [] })
  );
});

test('Claude leaves unowned legacy-looking paths untouched', async (t) => {
  const directory = temporaryDirectory(t);
  const stalePath = path.join(
    directory,
    '.claude/rules/tenets-synergy.md'
  );
  fs.mkdirSync(path.dirname(stalePath), { recursive: true });
  fs.writeFileSync(stalePath, 'User-authored compatibility notes\n');

  writeClaudeIntegration(directory, await fetchContent());
  assert.equal(
    fs.readFileSync(stalePath, 'utf-8'),
    'User-authored compatibility notes\n'
  );
});
