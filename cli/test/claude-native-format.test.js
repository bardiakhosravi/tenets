// Contract tests for files Tenets generates for Claude Code.
//
// Claude Code silently ignores filenames, frontmatter fields, and hook output
// it does not read, so these tests pin generated files to the documented
// formats (code.claude.com/docs: memory, skills, hooks, sub-agents).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const CLI = path.resolve(__dirname, '..', 'bin', 'tenets.js');

function installClaude(t, extraArgs = []) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-claude-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const result = spawnSync(
    process.execPath,
    [CLI, 'init', '--claude', '--with-hook', ...extraArgs],
    { cwd: directory, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } }
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return directory;
}

function frontmatterKeys(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'missing frontmatter');
  return match[1]
    .split('\n')
    .filter((line) => /^[A-Za-z][\w-]*:/.test(line))
    .map((line) => line.slice(0, line.indexOf(':')));
}

test('rules are path-scoped with the only frontmatter field Claude Code reads', (t) => {
  const directory = installClaude(t);
  const rulesDirectory = path.join(directory, '.claude/rules');
  const ruleFiles = fs.readdirSync(rulesDirectory);
  assert.ok(ruleFiles.length > 0);

  for (const ruleFile of ruleFiles) {
    const content = fs.readFileSync(path.join(rulesDirectory, ruleFile), 'utf-8');
    assert.deepEqual(frontmatterKeys(content), ['paths'], ruleFile);
    assert.match(content, /^---\npaths:\n( {2}- "[^"]+"\n)+---\n/, ruleFile);
  }

  const domainRule = fs.readFileSync(
    path.join(rulesDirectory, 'tenets-domain.md'),
    'utf-8'
  );
  assert.match(domainRule, /^---\npaths:\n {2}- "\*\*\/domain\/\*\*"\n---\n/);
});

test('skills are discoverable as SKILL.md with name and description', (t) => {
  const directory = installClaude(t);
  const skillsDirectory = path.join(directory, '.claude/skills');

  for (const skillName of fs.readdirSync(skillsDirectory)) {
    const files = fs.readdirSync(path.join(skillsDirectory, skillName));
    assert.ok(files.includes('SKILL.md'), `${skillName} has no SKILL.md`);
    const keys = frontmatterKeys(
      fs.readFileSync(path.join(skillsDirectory, skillName, 'SKILL.md'), 'utf-8')
    );
    assert.ok(keys.includes('name'), skillName);
    assert.ok(keys.includes('description'), skillName);
  }
});

test('PostToolUse hook reaches Claude through additionalContext', (t) => {
  const directory = installClaude(t);
  const hookPath = path.join(directory, '.claude/hooks/check-architecture.js');
  const runHook = (filePath) =>
    spawnSync(process.execPath, [hookPath], {
      input: JSON.stringify({
        hook_event_name: 'PostToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: filePath },
      }),
      encoding: 'utf-8',
    });

  for (const filePath of [
    '/repo/src/orders/domain/order.py',
    'C:\\repo\\src\\orders\\domain\\order.py',
  ]) {
    const result = runHook(filePath);
    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
    assert.match(output.hookSpecificOutput.additionalContext, /domain layer/);
  }

  const unrelated = runHook('/repo/README.md');
  assert.equal(unrelated.status, 0);
  assert.equal(unrelated.stdout, '');
});
