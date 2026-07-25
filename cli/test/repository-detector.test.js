const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectRepository,
} = require('../src/services/repository-detector');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-detect-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('detects agents, Python framework, and layered repository layout', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.claude'));
  fs.mkdirSync(path.join(directory, '.cursor'));
  fs.mkdirSync(path.join(directory, 'src/domain'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'src/application'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'src/adapters'), { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'pyproject.toml'),
    '[project]\ndependencies = ["fastapi"]\n'
  );

  const result = detectRepository(directory);

  assert.deepEqual(
    result.agents.map((agent) => agent.tool),
    ['claude', 'cursor']
  );
  assert.deepEqual(result.languages.map((language) => language.id), ['python']);
  assert.deepEqual(result.frameworks.map((framework) => framework.id), [
    'fastapi',
  ]);
  assert.equal(result.layout.kind, 'layered');
  assert.deepEqual(result.layout.architectureDirectories, [
    'src/adapters',
    'src/application',
    'src/domain',
  ]);
  assert.deepEqual(result.recommendations.tools, ['claude', 'cursor']);
});

test('detects TypeScript monorepo and Spec-Kit', (t) => {
  const directory = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, '.augment'));
  fs.mkdirSync(path.join(directory, '.specify'));
  fs.mkdirSync(path.join(directory, 'packages/api'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'packages/api/tsconfig.json'), '{}\n');
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ workspaces: ['packages/*'] })
  );
  fs.writeFileSync(
    path.join(directory, 'packages/api/package.json'),
    JSON.stringify({
      dependencies: { '@nestjs/core': '^11.0.0' },
    })
  );

  const result = detectRepository(directory);

  assert.deepEqual(result.languages.map((language) => language.id), [
    'typescript',
  ]);
  assert.deepEqual(result.frameworks.map((framework) => framework.id), [
    'nestjs',
  ]);
  assert.deepEqual(result.frameworks[0].evidence, [
    'packages/api/package.json',
  ]);
  assert.equal(result.layout.kind, 'monorepo');
  assert.equal(result.speckit.initialized, true);
  assert.equal(result.recommendations.speckit, true);
});

test('recommends portable AGENTS.md when no coding agent is detected', (t) => {
  const directory = temporaryDirectory(t);

  const result = detectRepository(directory);

  assert.deepEqual(result.agents, []);
  assert.deepEqual(result.recommendations.tools, ['agents']);
  assert.equal(result.recommendations.speckit, false);
});
