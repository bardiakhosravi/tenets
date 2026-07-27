const test = require('node:test');
const assert = require('node:assert/strict');

const { GENERATED_MARKER } = require('../src/constants');
const {
  SCAFFOLD_COMMAND_DEFINITIONS,
  buildScaffoldCommand,
} = require('../src/services/scaffold-command-writer');

test('every agent receives the canonical service scaffold workflow', () => {
  for (const [toolKey, definition] of Object.entries(
    SCAFFOLD_COMMAND_DEFINITIONS
  )) {
    const command = buildScaffoldCommand(toolKey);

    assert.match(command, new RegExp(GENERATED_MARKER));
    assert.match(command, /current repository/);
    assert.match(command, /greenfield/);
    assert.match(command, /enterprise_starter/);
    assert.match(command, /active_service/);
    assert.match(
      command,
      /Do not write files before the user explicitly approves/
    );
    assert.match(command, /Do not move, rename, or delete existing files/);
    assert.match(command, /user-owned source code/);
    assert.match(command, /\/tenets-review-architecture/);
    assert.ok(definition.targetFile.includes('tenets-scaffold'));
  }
});

test('tool-specific scaffold wrappers load native Tenets rules', () => {
  assert.match(
    buildScaffoldCommand('claude'),
    /\.claude\/rules\/tenets-\*\.md/
  );
  assert.match(
    buildScaffoldCommand('cursor'),
    /\.cursor\/rules\/tenets-\*\.mdc/
  );
  assert.match(
    buildScaffoldCommand('augment'),
    /\.augment\/rules\/tenets-\*\.md/
  );
  assert.match(
    buildScaffoldCommand('copilot'),
    /\.github\/instructions\/tenets-\*\.instructions\.md/
  );
  assert.match(buildScaffoldCommand('agents'), /Read `AGENTS\.md` in full/);
});
