const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { MARKERS } = require('../src/constants');
const {
  replaceMarkedContent,
  upsertMarkedContent,
  removeMarkedContent,
} = require('../src/services/file-writer');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-writer-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('marked content is replaced without changing user-owned content', (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'instructions.md');
  fs.writeFileSync(
    filePath,
    `User before\n\n${MARKERS.start}\nOld rules\n${MARKERS.end}\n\nUser after\n`
  );

  const replacement = `${MARKERS.start}\nNew rules\n${MARKERS.end}`;
  assert.equal(replaceMarkedContent(filePath, replacement), true);
  assert.equal(
    fs.readFileSync(filePath, 'utf-8'),
    `User before\n\n${replacement}\n\nUser after\n`
  );
});

test('upsert appends to an existing unowned file and is idempotent', (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'instructions.md');
  fs.writeFileSync(filePath, 'User instructions\n');
  const block = `${MARKERS.start}\nGenerated rules\n${MARKERS.end}`;

  assert.equal(upsertMarkedContent(filePath, block), 'appended');
  assert.equal(upsertMarkedContent(filePath, block), 'replaced');

  const result = fs.readFileSync(filePath, 'utf-8');
  assert.match(result, /^User instructions/);
  assert.equal(result.split(MARKERS.start).length - 1, 1);
});

test('remove deletes only the generated block and rejects malformed markers', (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'rules.md');
  fs.writeFileSync(
    filePath,
    `User content\n\n${MARKERS.start}\nGenerated\n${MARKERS.end}\n`
  );

  assert.equal(removeMarkedContent(filePath), true);
  assert.equal(fs.readFileSync(filePath, 'utf-8'), 'User content\n');

  fs.writeFileSync(filePath, `${MARKERS.end}\nUser content\n${MARKERS.start}\n`);
  assert.equal(removeMarkedContent(filePath), false);
  assert.equal(replaceMarkedContent(filePath, 'replacement'), false);
});
