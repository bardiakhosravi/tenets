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

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return false;
  }

  const before = existing.substring(0, startIdx);
  const after = existing.substring(endIdx + MARKERS.end.length);

  fs.writeFileSync(filePath, before + newContent.trimEnd() + after, 'utf-8');
  return true;
}

function upsertMarkedContent(filePath, markedContent, initialHeading = '') {
  ensureDir(filePath);

  if (replaceMarkedContent(filePath, markedContent)) {
    return 'replaced';
  }

  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf-8');
    const separator = existing.length === 0
      ? ''
      : existing.endsWith('\n')
        ? '\n'
        : '\n\n';
    fs.writeFileSync(filePath, existing + separator + markedContent.trimEnd() + '\n', 'utf-8');
    return 'appended';
  }

  const prefix = initialHeading ? `${initialHeading.trimEnd()}\n\n` : '';
  fs.writeFileSync(filePath, prefix + markedContent.trimEnd() + '\n', 'utf-8');
  return 'created';
}

function removeMarkedContent(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const existing = fs.readFileSync(filePath, 'utf-8');
  const startIdx = existing.indexOf(MARKERS.start);
  const endIdx = existing.indexOf(MARKERS.end);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return false;
  }

  const before = existing.substring(0, startIdx).trimEnd();
  const after = existing.substring(endIdx + MARKERS.end.length).trimStart();
  const remaining = [before, after].filter(Boolean).join('\n\n');

  if (remaining.length === 0) {
    fs.unlinkSync(filePath);
  } else {
    fs.writeFileSync(filePath, remaining.trimEnd() + '\n', 'utf-8');
  }
  return true;
}

module.exports = {
  writeFile,
  replaceMarkedContent,
  upsertMarkedContent,
  removeMarkedContent,
};
