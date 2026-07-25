const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  captureFilesystemChanges,
  formatChangePlan,
} = require('../src/services/change-planner');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-plan-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('planner captures create, update, delete, and mode changes without writing', async (t) => {
  const directory = temporaryDirectory(t);
  const updatedPath = path.join(directory, 'updated.txt');
  const deletedPath = path.join(directory, 'deleted.txt');
  const createdPath = path.join(directory, 'created.txt');
  fs.writeFileSync(updatedPath, 'before\n');
  fs.writeFileSync(deletedPath, 'remove me\n');
  const originalMode = fs.statSync(updatedPath).mode & 0o777;

  const changes = await captureFilesystemChanges(async () => {
    fs.writeFileSync(updatedPath, 'after\n');
    fs.chmodSync(updatedPath, 0o755);
    fs.writeFileSync(createdPath, 'new\n');
    fs.unlinkSync(deletedPath);
  });

  assert.equal(fs.readFileSync(updatedPath, 'utf-8'), 'before\n');
  assert.equal(fs.statSync(updatedPath).mode & 0o777, originalMode);
  assert.equal(fs.existsSync(createdPath), false);
  assert.equal(fs.readFileSync(deletedPath, 'utf-8'), 'remove me\n');

  assert.deepEqual(
    changes.map((change) => change.action),
    ['create', 'delete', 'update']
  );
  const output = formatChangePlan(changes, directory);
  assert.match(output, /CREATE created\.txt/);
  assert.match(output, /DELETE deleted\.txt/);
  assert.match(output, /UPDATE updated\.txt/);
  assert.match(output, /-before/);
  assert.match(output, /\+after/);
  assert.match(output, /new mode 755/);
});

test('planner reports final newline-only changes', async (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'newline.txt');
  fs.writeFileSync(filePath, 'same content');

  const changes = await captureFilesystemChanges(async () => {
    fs.writeFileSync(filePath, 'same content\n');
  });

  const output = formatChangePlan(changes, directory);
  assert.match(output, /-same content\n\\ No newline at end of file/);
  assert.match(output, /\+same content/);
});
