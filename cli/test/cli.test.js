const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const { MARKERS } = require('../src/constants');
const PACKAGE_VERSION = require('../package.json').version;

const CLI = path.resolve(__dirname, '..', 'bin', 'tenets.js');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-cli-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function spawnCli(directory, args, input = '', environment = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: directory,
    input,
    encoding: 'utf-8',
    env: {
      ...process.env,
      NO_COLOR: '1',
      ...environment,
    },
  });
}

function runCli(directory, args, input = '', environment = {}) {
  const result = spawnCli(directory, args, input, environment);

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
  assert.equal(config.schemaVersion, 4);
  assert.equal(config.profile, 'pragmatic');
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
  for (const scaffoldPath of [
    '.claude/skills/tenets-scaffold/TENETS-SKILL.md',
    '.augment/commands/tenets-scaffold.md',
    '.cursor/commands/tenets-scaffold.md',
    '.github/prompts/tenets-scaffold.prompt.md',
    '.tenets/prompts/tenets-scaffold.md',
  ]) {
    assert.ok(
      fs.existsSync(path.join(directory, scaffoldPath)),
      `Missing scaffold command: ${scaffoldPath}`
    );
  }
  assert.match(
    fs.readFileSync(
      path.join(directory, '.claude/rules/tenets-application.md'),
      'utf-8'
    ),
    /TENETS-UOW-001/
  );
  assert.match(
    fs.readFileSync(
      path.join(directory, '.augment/rules/tenets-application.md'),
      'utf-8'
    ),
    /TENETS-EVENT-008/
  );
  assert.match(
    fs.readFileSync(
      path.join(directory, '.augment/rules/tenets-global.md'),
      'utf-8'
    ),
    /Profile: `pragmatic`/
  );
  assert.doesNotMatch(
    fs.readFileSync(
      path.join(directory, '.augment/rules/tenets-global.md'),
      'utf-8'
    ),
    /TENETS-ASYNC-008/
  );
  assert.match(
    fs.readFileSync(
      path.join(directory, '.augment/rules/tenets-global.md'),
      'utf-8'
    ),
    /TENETS-ERROR-008/
  );
  assert.match(
    fs.readFileSync(
      path.join(directory, '.cursor/rules/tenets-global.mdc'),
      'utf-8'
    ),
    /TENETS-ERROR-008/
  );
  assert.doesNotMatch(
    fs.readFileSync(
      path.join(directory, '.cursor/rules/tenets-global.mdc'),
      'utf-8'
    ),
    /TENETS-ADR-003/
  );
  assert.match(
    fs.readFileSync(path.join(directory, 'AGENTS.md'), 'utf-8'),
    /TENETS-UOW-001/
  );

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

test('explain resolves canonical rules in text and JSON modes', (t) => {
  const directory = temporaryDirectory(t);

  const textOutput = runCli(directory, ['explain', 'tenets-port-005']);
  assert.match(textOutput, /TENETS-PORT-005: Secondary capabilities never receive repositories/);
  assert.match(textOutput, /## Rule/);

  const result = spawnCli(directory, ['explain', 'TENETS-PORT-005', '--json']);
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
  assert.equal(output.result.id, 'TENETS-PORT-005');
  assert.equal(output.result.kind, 'rule');
});

test('explain suggests nearby IDs for an unknown rule', (t) => {
  const directory = temporaryDirectory(t);
  const result = spawnCli(directory, ['explain', 'TENETS-PORT-015']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown Tenets rule ID: TENETS-PORT-015/);
  assert.match(result.stderr, /Did you mean TENETS-PORT-/);
});

test('zero-argument init detects agents and accepts recommended setup', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.cursor'));
  fs.mkdirSync(path.join(directory, '.augment'));
  fs.writeFileSync(
    path.join(directory, 'pyproject.toml'),
    '[project]\ndependencies = ["fastapi"]\n'
  );

  const output = runCli(directory, ['init'], '\n');

  assert.match(output, /Detected repository:/);
  assert.match(output, /Agents: Cursor, Augment/);
  assert.match(output, /Stack:\s+Python, FastAPI/);
  assert.match(output, /\[x\] Cursor/);
  assert.match(output, /\[x\] Augment/);
  assert.match(output, /Post-install verification:/);
  assert.match(output, /Cursor: rules and agent commands found/);
  assert.match(output, /Augment: rules and agent commands found/);
  assert.match(output, /Installation verified/);
  assert.match(output, /Next action:/);
  assert.match(
    output,
    /Use `\/tenets-review-architecture <changed-path-or-workflow>` on the next bounded change/
  );

  const config = readConfig(directory);
  assert.ok(config.tools.cursor);
  assert.ok(config.tools.augment);
  assert.equal(config.tools.claude, undefined);
  assert.equal(config.tools.agents, undefined);
});

test('zero-argument init allows a subset of the recommended tools', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.claude'));
  fs.mkdirSync(path.join(directory, '.cursor'));

  const output = runCli(directory, ['init'], '2\n');

  assert.match(output, /\[x\] Claude Code/);
  assert.match(output, /\[x\] Cursor/);
  assert.match(output, /Cursor: rules and agent commands found/);
  const config = readConfig(directory);
  assert.deepEqual(Object.keys(config.tools), ['cursor']);
  assert.equal(fs.existsSync(path.join(directory, 'CLAUDE.md')), false);
});

test('noninteractive zero-argument init returns detection and verification JSON', (t) => {
  const directory = temporaryDirectory(t);
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ dependencies: { express: '^5.0.0' } })
  );

  const result = spawnCli(directory, ['init', '--yes', '--json']);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
  assert.deepEqual(output.result.requestedTools, ['agents']);
  assert.deepEqual(
    output.result.detection.languages.map((language) => language.id),
    ['javascript']
  );
  assert.deepEqual(
    output.result.detection.frameworks.map((framework) => framework.id),
    ['express']
  );
  assert.equal(output.result.verification.healthy, true);
  assert.equal(output.result.verification.tools[0].tool, 'agents');
  assert.equal(output.result.nextAction.type, 'scoped_adoption');
  assert.equal(
    output.result.nextAction.command,
    '/tenets-review-architecture <changed-path-or-workflow>'
  );
});

test('zero-argument init recommends an initialized Spec-Kit project', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.specify'));

  const output = runCli(directory, ['init'], '\n', { PATH: '' });

  assert.match(output, /\[x\] Spec-Kit DDD preset/);
  assert.match(output, /Spec-Kit tenets-ddd: preset found/);
  const config = readConfig(directory);
  assert.ok(config.tools.agents);
  assert.ok(config.speckit['tenets-ddd']);
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

test('update repairs a missing scaffold command', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment']);

  const scaffoldPath = path.join(
    directory,
    '.augment/commands/tenets-scaffold.md'
  );
  fs.unlinkSync(scaffoldPath);

  const output = runCli(directory, ['update']);
  assert.match(output, /augment.*updated/s);
  assert.ok(fs.existsSync(scaffoldPath));
});

test('update changes the active profile and regenerates review enforcement', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment', '--profile', 'strict']);

  const rulesPath = path.join(
    directory,
    '.augment/rules/tenets-global.md'
  );
  const commandPath = path.join(
    directory,
    '.augment/commands/tenets-review-architecture.md'
  );
  assert.match(fs.readFileSync(rulesPath, 'utf-8'), /TENETS-ADR-001/);

  runCli(directory, ['update', '--profile', 'core']);

  const config = readConfig(directory);
  assert.equal(config.profile, 'core');
  assert.doesNotMatch(fs.readFileSync(rulesPath, 'utf-8'), /TENETS-ADR-001/);
  const command = fs.readFileSync(commandPath, 'utf-8');
  const allowlist = command.match(
    /The following rule IDs[\s\S]*?Do not report/
  )?.[0];
  assert.ok(allowlist);
  assert.match(allowlist, /TENETS-PORT-005/);
  assert.doesNotMatch(allowlist, /TENETS-ADR-001/);
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
  assert.equal(config.schemaVersion, 4);
  assert.equal(config.profile, 'strict');
  assert.deepEqual(config.appliesTo, []);
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

test('update refuses an unowned target and init can replace it explicitly', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment']);
  const targetPath = path.join(
    directory,
    '.augment/rules/tenets-domain.md'
  );
  fs.writeFileSync(targetPath, 'User-authored domain guidance\n');

  const updateResult = spawnCli(directory, ['update']);
  assert.equal(updateResult.status, 1);
  assert.match(
    updateResult.stderr,
    /Refusing to overwrite files that are not owned by Tenets/
  );
  assert.equal(
    fs.readFileSync(targetPath, 'utf-8'),
    'User-authored domain guidance\n'
  );

  const initOutput = runCli(directory, ['init', '--augment'], 'y\n');
  assert.match(initOutput, /not marked as Tenets-owned/);
  assert.match(initOutput, /\.augment\/rules\/tenets-domain\.md/);
  assert.match(
    fs.readFileSync(targetPath, 'utf-8'),
    new RegExp(MARKERS.start)
  );
});

test('review command conflicts are detected before shared rules change', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--agents']);
  const agentsPath = path.join(directory, 'AGENTS.md');
  const commandPath = path.join(
    directory,
    '.tenets/prompts/tenets-review-architecture.md'
  );
  const agentsBefore = fs.readFileSync(agentsPath, 'utf-8');
  fs.writeFileSync(commandPath, 'User-authored review workflow\n');

  const result = spawnCli(directory, ['update']);
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(agentsPath, 'utf-8'), agentsBefore);
  assert.equal(
    fs.readFileSync(commandPath, 'utf-8'),
    'User-authored review workflow\n'
  );
});

test('scaffold command conflicts are detected before shared rules change', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--agents']);
  const agentsPath = path.join(directory, 'AGENTS.md');
  const commandPath = path.join(
    directory,
    '.tenets/prompts/tenets-scaffold.md'
  );
  const agentsBefore = fs.readFileSync(agentsPath, 'utf-8');
  fs.writeFileSync(commandPath, 'User-authored scaffold workflow\n');

  const result = spawnCli(directory, ['update']);
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(agentsPath, 'utf-8'), agentsBefore);
  assert.equal(
    fs.readFileSync(commandPath, 'utf-8'),
    'User-authored scaffold workflow\n'
  );
});

test('init dry-run prints exact creates and writes nothing', (t) => {
  const directory = temporaryDirectory(t);

  const output = runCli(directory, ['init', '--cursor', '--dry-run']);
  assert.match(output, /CREATE \.cursor\/rules\/tenets-global\.mdc/);
  assert.match(output, /CREATE \.cursor\/commands\/tenets-scaffold\.md/);
  assert.match(output, /CREATE \.tenets\.json/);
  assert.match(output, /No changes were applied/);
  assert.deepEqual(fs.readdirSync(directory), []);
});

test('diff previews a missing-file repair without applying it', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment']);
  const rulePath = path.join(directory, '.augment/rules/tenets-domain.md');
  fs.unlinkSync(rulePath);

  const output = runCli(directory, ['diff']);
  assert.match(output, /CREATE \.augment\/rules\/tenets-domain\.md/);
  assert.equal(fs.existsSync(rulePath), false);
});

test('doctor reports healthy and conflicting integrations in JSON', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--cursor']);

  const healthy = spawnCli(directory, ['doctor', '--json']);
  assert.equal(healthy.status, 0);
  const healthyResult = JSON.parse(healthy.stdout);
  assert.equal(healthyResult.ok, true);
  assert.equal(healthyResult.result.healthy, true);
  assert.equal(healthyResult.result.tools[0].tool, 'cursor');

  const rulePath = path.join(directory, '.cursor/rules/tenets-domain.mdc');
  fs.writeFileSync(rulePath, 'User-authored collision\n');
  const broken = spawnCli(directory, ['doctor', '--json']);
  assert.equal(broken.status, 1);
  const brokenResult = JSON.parse(broken.stdout);
  assert.equal(brokenResult.ok, false);
  assert.ok(
    brokenResult.result.tools[0].findings.some(
      (item) => item.code === 'ownership_conflict'
    )
  );
});

test('doctor reports a missing scaffold command', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--cursor']);
  const scaffoldPath = path.join(
    directory,
    '.cursor/commands/tenets-scaffold.md'
  );
  fs.unlinkSync(scaffoldPath);

  const result = spawnCli(directory, ['doctor', '--json']);
  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  const missing = output.result.tools[0].findings.find(
    (item) =>
      item.code === 'missing_file' &&
      path.normalize(item.path).endsWith(
        path.join('.cursor', 'commands', 'tenets-scaffold.md')
      )
  );
  assert.ok(missing);
});

test('doctor treats the optional Claude monitoring hook as optional', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--claude'], 'n\n');

  const result = spawnCli(directory, ['doctor', '--json']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).result.tools[0].status, 'healthy');
});

test('scoped installation inspection reports a requested missing integration', async (t) => {
  const directory = temporaryDirectory(t);
  const {
    inspectInstallation,
  } = require('../src/services/installation-inspector');

  const result = await inspectInstallation({
    projectRoot: directory,
    toolKeys: ['cursor'],
  });

  assert.equal(result.healthy, false);
  assert.equal(result.tools[0].tool, 'cursor');
  assert.ok(
    result.tools[0].findings.some(
      (item) => item.code === 'integration_not_configured'
    )
  );
});

test('uninstall dry-run is non-destructive and uninstall preserves shared content', (t) => {
  const directory = temporaryDirectory(t);
  const agentsPath = path.join(directory, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Team guidance\n');
  runCli(directory, ['init', '--agents'], '2\n');

  const preview = runCli(directory, ['uninstall', '--dry-run']);
  assert.match(preview, /DELETE \.tenets\/prompts\/tenets-review-architecture\.md/);
  assert.match(preview, /DELETE \.tenets\/prompts\/tenets-scaffold\.md/);
  assert.ok(fs.existsSync(path.join(directory, '.tenets.json')));
  assert.match(fs.readFileSync(agentsPath, 'utf-8'), /tenets:start/);

  runCli(directory, ['uninstall', '--yes']);
  assert.equal(fs.readFileSync(agentsPath, 'utf-8'), '# Team guidance\n');
  assert.equal(fs.existsSync(path.join(directory, '.tenets.json')), false);
  assert.equal(
    fs.existsSync(
      path.join(directory, '.tenets/prompts/tenets-review-architecture.md')
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(directory, '.tenets/prompts/tenets-scaffold.md')
    ),
    false
  );
});

test('version supports human and machine-readable output', (t) => {
  const directory = temporaryDirectory(t);
  assert.equal(runCli(directory, ['--version']).trim(), PACKAGE_VERSION);

  const result = spawnCli(directory, ['--json', '--version']);
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
  assert.equal(output.result.version, PACKAGE_VERSION);
});

test('help and command errors remain valid JSON', (t) => {
  const directory = temporaryDirectory(t);
  const help = spawnCli(directory, ['--help', '--json']);
  assert.equal(help.status, 0);
  assert.match(
    JSON.parse(help.stdout).messages[0].message,
    /Usage: tenets/
  );

  const unknown = spawnCli(directory, ['unknown', '--json']);
  assert.equal(unknown.status, 1);
  const output = JSON.parse(unknown.stdout);
  assert.equal(output.ok, false);
  assert.match(output.messages[0].message, /Unknown command/);
});

test('JSON init and update return parseable command results', (t) => {
  const directory = temporaryDirectory(t);
  const initResult = spawnCli(directory, [
    '--json',
    'init',
    '--cursor',
    '--yes',
  ]);
  assert.equal(initResult.status, 0);
  const initialized = JSON.parse(initResult.stdout);
  assert.equal(initialized.ok, true);
  assert.deepEqual(initialized.result.requestedTools, ['cursor']);

  const updateResult = spawnCli(directory, ['update', '--json']);
  assert.equal(updateResult.status, 0);
  const updated = JSON.parse(updateResult.stdout);
  assert.equal(updated.ok, true);
  assert.equal(updated.result.updatedCount, 0);
});

test('doctor detects stale and untracked integrations', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--augment']);
  const configPath = path.join(directory, '.tenets.json');
  const config = readConfig(directory);
  config.tools.augment.contentHash = 'stale';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const staleResult = spawnCli(directory, ['doctor', '--json']);
  assert.equal(staleResult.status, 1);
  assert.ok(
    JSON.parse(staleResult.stdout).result.tools[0].findings.some(
      (item) => item.code === 'stale_content'
    )
  );

  fs.unlinkSync(configPath);
  const untrackedResult = spawnCli(directory, ['doctor', '--json']);
  const untracked = JSON.parse(untrackedResult.stdout);
  assert.ok(
    untracked.result.tools[0].findings.some(
      (item) => item.code === 'untracked_integration'
    )
  );
});

test('selective uninstall retains other integrations', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--cursor', '--augment']);

  runCli(directory, ['uninstall', '--cursor', '--yes']);
  const config = readConfig(directory);
  assert.equal(config.tools.cursor, undefined);
  assert.ok(config.tools.augment);
  assert.equal(fs.existsSync(path.join(directory, '.cursor/rules')), false);
  assert.ok(fs.existsSync(path.join(directory, '.augment/rules')));
});

test('uninstall preserves conflicts and keeps their configuration', (t) => {
  const directory = temporaryDirectory(t);
  runCli(directory, ['init', '--cursor']);
  const conflictPath = path.join(
    directory,
    '.cursor/rules/tenets-domain.mdc'
  );
  fs.writeFileSync(conflictPath, 'User-authored rules\n');

  const result = spawnCli(directory, ['uninstall', '--yes', '--json']);
  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.result.incompleteIntegrations, ['cursor']);
  assert.equal(
    fs.readFileSync(conflictPath, 'utf-8'),
    'User-authored rules\n'
  );
  assert.ok(readConfig(directory).tools.cursor);
});

test('selective Spec-Kit uninstall leaves agent integrations configured', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.specify'), { recursive: true });
  runCli(directory, ['init', '--speckit'], '', { PATH: '' });
  runCli(directory, ['init', '--cursor']);

  runCli(directory, ['uninstall', '--speckit', '--yes']);
  const config = readConfig(directory);
  assert.ok(config.tools.cursor);
  assert.deepEqual(config.speckit, {});
  assert.equal(
    fs.existsSync(
      path.join(directory, '.specify/presets/tenets-ddd/preset.yml')
    ),
    false
  );
});

test('uninstall preserves modified Spec-Kit files and unrelated Claude hooks', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.specify'), { recursive: true });
  runCli(directory, ['init', '--speckit'], '', { PATH: '' });
  const presetPath = path.join(
    directory,
    '.specify/presets/tenets-ddd/preset.yml'
  );
  fs.appendFileSync(presetPath, '# Local customization\n');

  const speckitResult = spawnCli(directory, [
    'uninstall',
    '--speckit',
    '--yes',
    '--json',
  ]);
  assert.equal(speckitResult.status, 1);
  assert.match(
    JSON.parse(speckitResult.stdout).result.conflicts[0],
    /modified preset file/
  );
  assert.ok(fs.existsSync(presetPath));
  assert.ok(readConfig(directory).speckit['tenets-ddd']);

  runCli(directory, ['init', '--claude', '--with-hook']);
  const settingsPath = path.join(directory, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  settings.hooks.PostToolUse[0].hooks.push({
    type: 'command',
    command: 'node user-hook.js',
  });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  runCli(directory, ['uninstall', '--claude', '--yes']);
  const retained = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  assert.deepEqual(retained.hooks.PostToolUse[0].hooks, [{
    type: 'command',
    command: 'node user-hook.js',
  }]);
});

test('interactive commands reject ambiguous JSON mode', (t) => {
  const directory = temporaryDirectory(t);
  const initResult = spawnCli(directory, ['init', '--cursor', '--json']);
  assert.equal(initResult.status, 1);
  assert.match(JSON.parse(initResult.stdout).error, /requires `--yes`/);

  runCli(directory, ['init', '--cursor']);
  const uninstallResult = spawnCli(directory, ['uninstall', '--json']);
  assert.equal(uninstallResult.status, 1);
  assert.match(
    JSON.parse(uninstallResult.stdout).error,
    /requires `--yes`/
  );
});
