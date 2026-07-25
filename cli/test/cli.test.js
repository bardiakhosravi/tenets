const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const { MARKERS } = require('../src/constants');

const CLI = path.resolve(__dirname, '..', 'bin', 'tenets.js');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-cli-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function runCli(directory, args, input = '', environment = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: directory,
    input,
    encoding: 'utf-8',
    env: {
      ...process.env,
      NO_COLOR: '1',
      ...environment,
    },
  });

  assert.equal(
    result.status,
    0,
    `CLI failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return result.stdout + result.stderr;
}

function readConfig(directory) {
  return JSON.parse(
    fs.readFileSync(path.join(directory, '.tenets.json'), 'utf-8')
  );
}

test('fresh install covers every supported agent and updates idempotently', (t) => {
  const directory = temporaryDirectory(t);

  runCli(directory, [
    'init',
    '--claude',
    '--with-hook',
    '--augment',
    '--cursor',
    '--copilot',
    '--code-review-agent',
    '--agents',
  ]);
  const config = readConfig(directory);
  assert.equal(config.schemaVersion, 3);
  assert.equal(config.tools.claude.mode, 'multi');
  assert.equal(config.tools.augment.mode, 'augment-multi');
  assert.equal(config.tools.cursor.mode, 'cursor-multi');
  assert.equal(config.tools.copilot.mode, 'copilot-multi');
  assert.equal(config.tools.codeReviewAgent.mode, 'replace');
  assert.equal(config.tools.agents.mode, 'replace');
  assert.ok(fs.existsSync(path.join(directory, 'CLAUDE.md')));
  assert.ok(
    fs.existsSync(path.join(directory, '.augment/rules/tenets-global.md'))
  );
  assert.ok(
    fs.existsSync(path.join(directory, '.tenets/agents/code-review-agent.md'))
  );
  assert.ok(fs.existsSync(path.join(directory, 'AGENTS.md')));

  const cursorPath = path.join(
    directory,
    '.cursor/rules/tenets-domain.mdc'
  );
  const copilotPath = path.join(
    directory,
    '.github/instructions/tenets-domain.instructions.md'
  );
  const before = [
    fs.readFileSync(cursorPath, 'utf-8'),
    fs.readFileSync(copilotPath, 'utf-8'),
  ];

  const output = runCli(directory, ['update']);
  assert.match(output, /claude.*already up to date/s);
  assert.match(output, /augment.*already up to date/s);
  assert.match(output, /cursor.*already up to date/s);
  assert.match(output, /copilot.*already up to date/s);
  assert.match(output, /codeReviewAgent.*already up to date/s);
  assert.match(output, /agents.*already up to date/s);
  assert.deepEqual(
    [
      fs.readFileSync(cursorPath, 'utf-8'),
      fs.readFileSync(copilotPath, 'utf-8'),
    ],
    before
  );
});

test('update repairs a missing generated integration file', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment']);

  const rulePath = path.join(
    directory,
    '.augment/rules/tenets-domain.md'
  );
  fs.unlinkSync(rulePath);

  const output = runCli(directory, ['update']);
  assert.match(output, /augment.*updated/s);
  assert.ok(fs.existsSync(rulePath));
});

test('update migrates legacy Cursor and Copilot outputs safely', (t) => {
  const directory = temporaryDirectory(t);
  const githubDirectory = path.join(directory, '.github');
  fs.mkdirSync(githubDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, '.cursorrules'),
    `Cursor user rule\n\n${MARKERS.start}\nLegacy Cursor rules\n${MARKERS.end}\n`
  );
  fs.writeFileSync(
    path.join(githubDirectory, 'copilot-instructions.md'),
    `Copilot user rule\n\n${MARKERS.start}\nLegacy Copilot rules\n${MARKERS.end}\n`
  );
  fs.writeFileSync(
    path.join(directory, '.tenets.json'),
    JSON.stringify({
      schemaVersion: 2,
      tools: {
        cursor: {
          targetFile: '.cursorrules',
          contentHash: 'legacy',
          mode: 'replace',
        },
        copilot: {
          targetFile: '.github/copilot-instructions.md',
          contentHash: 'legacy',
          mode: 'replace',
        },
      },
    })
  );

  const output = runCli(directory, ['update']);
  assert.match(output, /cursor.*migrated to scoped rules/s);
  assert.match(output, /copilot.*migrated to scoped instructions/s);
  assert.equal(
    fs.readFileSync(path.join(directory, '.cursorrules'), 'utf-8'),
    'Cursor user rule\n'
  );
  assert.match(
    fs.readFileSync(
      path.join(githubDirectory, 'copilot-instructions.md'),
      'utf-8'
    ),
    /^Copilot user rule/
  );

  const config = readConfig(directory);
  assert.equal(config.schemaVersion, 3);
  assert.equal(config.tools.cursor.mode, 'cursor-multi');
  assert.equal(config.tools.copilot.mode, 'copilot-multi');
});

test('single-file conflicts preserve user content in append mode', (t) => {
  const directory = temporaryDirectory(t);
  const agentsPath = path.join(directory, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Existing agent guidance\n');

  runCli(directory, ['init', '--agents'], '2\n');
  const installed = fs.readFileSync(agentsPath, 'utf-8');
  assert.match(installed, /^# Existing agent guidance/);
  assert.match(installed, new RegExp(MARKERS.start));

  runCli(directory, ['update']);
  const updated = fs.readFileSync(agentsPath, 'utf-8');
  assert.match(updated, /^# Existing agent guidance/);
  assert.equal(updated.split(MARKERS.start).length - 1, 1);
});

test('Spec-Kit installs the bundled preset without network tooling', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.specify'), { recursive: true });

  const output = runCli(
    directory,
    ['init', '--speckit'],
    '',
    { PATH: '' }
  );

  assert.match(output, /Spec-Kit DDD preset installed/);
  assert.ok(
    fs.existsSync(
      path.join(
        directory,
        '.specify/presets/tenets-ddd/templates/spec-template.md'
      )
    )
  );
  assert.ok(
    readConfig(directory).speckit['tenets-ddd']
  );
});
