const fs = require('node:fs');
const path = require('node:path');
const { MARKERS } = require('../constants');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content, mode) {
  ensureDir(filePath);

  if (mode === 'append') {
    const existing = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : '';
    const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n\n' : '\n';
    fs.writeFileSync(filePath, existing + separator + content, 'utf-8');
  } else {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

function replaceMarkedContent(filePath, newContent) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const existing = fs.readFileSync(filePath, 'utf-8');
  const startIdx = existing.indexOf(MARKERS.start);
  const endIdx = existing.indexOf(MARKERS.end);

  if (startIdx === -1 || endIdx === -1) {
    return false;
  }

  const before = existing.substring(0, startIdx);
  const after = existing.substring(endIdx + MARKERS.end.length);

  fs.writeFileSync(filePath, before + newContent.trimEnd() + after, 'utf-8');
  return true;
}

module.exports = { writeFile, replaceMarkedContent };
