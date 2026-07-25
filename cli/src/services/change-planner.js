const fs = require('node:fs');
const path = require('node:path');

function asPath(filePath) {
  return path.resolve(filePath.toString());
}

function asBuffer(data, options) {
  if (Buffer.isBuffer(data)) {
    return Buffer.from(data);
  }
  const encoding = typeof options === 'string'
    ? options
    : options?.encoding || 'utf-8';
  return Buffer.from(String(data), encoding);
}

function returnFileData(buffer, options) {
  const encoding = typeof options === 'string'
    ? options
    : options?.encoding;
  return encoding ? buffer.toString(encoding) : Buffer.from(buffer);
}

function parentPaths(filePath) {
  const parents = [];
  let current = path.dirname(filePath);
  while (current !== path.dirname(current)) {
    parents.push(current);
    current = path.dirname(current);
  }
  return parents;
}

async function captureFilesystemChanges(operation) {
  const original = {
    chmodSync: fs.chmodSync,
    copyFileSync: fs.copyFileSync,
    existsSync: fs.existsSync,
    mkdirSync: fs.mkdirSync,
    readFileSync: fs.readFileSync,
    readdirSync: fs.readdirSync,
    rmdirSync: fs.rmdirSync,
    rmSync: fs.rmSync,
    statSync: fs.statSync,
    unlinkSync: fs.unlinkSync,
    writeFileSync: fs.writeFileSync,
  };
  const overlay = new Map();
  const deleted = new Set();
  const virtualDirectories = new Set();
  const touched = new Map();
  const modes = new Map();

  function isDeleted(filePath) {
    for (const deletedPath of deleted) {
      if (
        filePath === deletedPath ||
        filePath.startsWith(`${deletedPath}${path.sep}`)
      ) {
        return true;
      }
    }
    return false;
  }

  function initialState(filePath) {
    if (touched.has(filePath)) {
      return touched.get(filePath);
    }

    const exists = original.existsSync(filePath);
    let state = { exists, content: null, mode: null };
    if (exists) {
      const stats = original.statSync(filePath);
      if (stats.isFile()) {
        state = {
          exists: true,
          content: original.readFileSync(filePath),
          mode: stats.mode & 0o777,
        };
      }
    }
    touched.set(filePath, state);
    return state;
  }

  function markVirtualParents(filePath) {
    for (const parent of parentPaths(filePath)) {
      virtualDirectories.add(parent);
    }
  }

  function virtualExists(filePath) {
    if (overlay.has(filePath)) return true;
    if (isDeleted(filePath)) return false;
    if (virtualDirectories.has(filePath)) return true;
    return original.existsSync(filePath);
  }

  function virtualRead(filePath) {
    if (overlay.has(filePath)) {
      return overlay.get(filePath);
    }
    if (isDeleted(filePath)) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      error.code = 'ENOENT';
      throw error;
    }
    return original.readFileSync(filePath);
  }

  fs.existsSync = (filePath) => virtualExists(asPath(filePath));
  fs.readFileSync = (filePath, options) =>
    returnFileData(virtualRead(asPath(filePath)), options);
  fs.writeFileSync = (filePath, data, options) => {
    const resolvedPath = asPath(filePath);
    initialState(resolvedPath);
    deleted.delete(resolvedPath);
    overlay.set(resolvedPath, asBuffer(data, options));
    markVirtualParents(resolvedPath);
  };
  fs.copyFileSync = (sourcePath, destinationPath) => {
    fs.writeFileSync(destinationPath, virtualRead(asPath(sourcePath)));
  };
  fs.unlinkSync = (filePath) => {
    const resolvedPath = asPath(filePath);
    initialState(resolvedPath);
    overlay.delete(resolvedPath);
    deleted.add(resolvedPath);
  };
  fs.chmodSync = (filePath, mode) => {
    const resolvedPath = asPath(filePath);
    initialState(resolvedPath);
    modes.set(resolvedPath, mode & 0o777);
  };
  fs.mkdirSync = (directoryPath) => {
    const resolvedPath = asPath(directoryPath);
    virtualDirectories.add(resolvedPath);
    markVirtualParents(resolvedPath);
    return resolvedPath;
  };
  fs.rmdirSync = (directoryPath) => {
    virtualDirectories.delete(asPath(directoryPath));
  };
  fs.rmSync = (targetPath, options = {}) => {
    const resolvedPath = asPath(targetPath);
    if (!options.recursive) {
      fs.unlinkSync(resolvedPath);
      return;
    }

    const candidates = new Set([
      ...overlay.keys(),
      ...touched.keys(),
    ]);
    if (original.existsSync(resolvedPath)) {
      const stack = [resolvedPath];
      while (stack.length > 0) {
        const current = stack.pop();
        const stats = original.statSync(current);
        if (stats.isDirectory()) {
          for (const entry of original.readdirSync(current)) {
            stack.push(path.join(current, entry));
          }
        } else {
          candidates.add(current);
        }
      }
    }
    for (const candidate of candidates) {
      if (
        candidate === resolvedPath ||
        candidate.startsWith(`${resolvedPath}${path.sep}`)
      ) {
        fs.unlinkSync(candidate);
      }
    }
  };
  fs.readdirSync = (directoryPath, options) => {
    const resolvedPath = asPath(directoryPath);
    const entries = new Set();
    if (original.existsSync(resolvedPath) && !isDeleted(resolvedPath)) {
      for (const entry of original.readdirSync(resolvedPath)) {
        const childPath = path.join(resolvedPath, entry);
        if (!isDeleted(childPath)) entries.add(entry);
      }
    }
    for (const filePath of overlay.keys()) {
      if (path.dirname(filePath) === resolvedPath) {
        entries.add(path.basename(filePath));
      }
    }
    const names = [...entries].sort();
    if (!options?.withFileTypes) {
      return names;
    }
    return names.map((name) => {
      const childPath = path.join(resolvedPath, name);
      const isDirectory =
        virtualDirectories.has(childPath) ||
        (original.existsSync(childPath) &&
          original.statSync(childPath).isDirectory());
      return {
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      };
    });
  };

  try {
    await operation();
  } finally {
    Object.assign(fs, original);
  }

  const changes = [];
  for (const [filePath, before] of touched) {
    const afterExists = overlay.has(filePath)
      ? true
      : deleted.has(filePath)
        ? false
        : before.exists;
    const afterContent = overlay.has(filePath)
      ? overlay.get(filePath)
      : afterExists && before.content
        ? before.content
        : null;
    const afterMode = modes.has(filePath)
      ? modes.get(filePath)
      : before.mode;
    const contentChanged =
      before.exists !== afterExists ||
      (before.content &&
        afterContent &&
        !before.content.equals(afterContent));
    const modeChanged = before.mode !== afterMode;

    if (!contentChanged && !modeChanged) continue;
    changes.push({
      path: filePath,
      action: !before.exists && afterExists
        ? 'create'
        : before.exists && !afterExists
          ? 'delete'
          : 'update',
      before: before.content,
      after: afterContent,
      beforeMode: before.mode,
      afterMode,
    });
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function splitLines(buffer) {
  if (!buffer) return [];
  const text = buffer.toString('utf-8');
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

function lacksFinalNewline(buffer) {
  return Boolean(buffer?.length) && buffer.at(-1) !== 0x0a;
}

function formatRange(start, count) {
  return count === 1 ? `${start + 1}` : `${start + 1},${count}`;
}

function formatContentDiff(change, relativePath) {
  const beforeLines = splitLines(change.before);
  const afterLines = splitLines(change.after);
  const beforeLacksNewline = lacksFinalNewline(change.before);
  const afterLacksNewline = lacksFinalNewline(change.after);
  const finalNewlineChanged = beforeLacksNewline !== afterLacksNewline;
  let prefix = 0;
  while (
    prefix < beforeLines.length &&
    prefix < afterLines.length &&
    beforeLines[prefix] === afterLines[prefix]
  ) {
    prefix++;
  }
  if (
    prefix === beforeLines.length &&
    prefix === afterLines.length &&
    finalNewlineChanged
  ) {
    prefix = Math.max(0, prefix - 1);
  }

  let suffix = 0;
  while (
    !finalNewlineChanged &&
    suffix < beforeLines.length - prefix &&
    suffix < afterLines.length - prefix &&
    beforeLines[beforeLines.length - suffix - 1] ===
      afterLines[afterLines.length - suffix - 1]
  ) {
    suffix++;
  }

  const contextBefore = Math.min(3, prefix);
  const contextAfter = Math.min(3, suffix);
  const oldStart = prefix - contextBefore;
  const newStart = prefix - contextBefore;
  const oldChangedEnd = beforeLines.length - suffix;
  const newChangedEnd = afterLines.length - suffix;
  const oldEnd = oldChangedEnd + contextAfter;
  const newEnd = newChangedEnd + contextAfter;
  const oldPath = change.before ? `a/${relativePath}` : '/dev/null';
  const newPath = change.after ? `b/${relativePath}` : '/dev/null';
  const lines = [
    `--- ${oldPath}`,
    `+++ ${newPath}`,
    `@@ -${formatRange(oldStart, oldEnd - oldStart)} +${formatRange(newStart, newEnd - newStart)} @@`,
  ];

  for (const line of beforeLines.slice(oldStart, prefix)) {
    lines.push(` ${line}`);
  }
  for (let index = prefix; index < oldChangedEnd; index++) {
    lines.push(`-${beforeLines[index]}`);
    if (index === beforeLines.length - 1 && beforeLacksNewline) {
      lines.push('\\ No newline at end of file');
    }
  }
  for (let index = prefix; index < newChangedEnd; index++) {
    lines.push(`+${afterLines[index]}`);
    if (index === afterLines.length - 1 && afterLacksNewline) {
      lines.push('\\ No newline at end of file');
    }
  }
  for (const line of afterLines.slice(newChangedEnd, newEnd)) {
    lines.push(` ${line}`);
  }
  return lines;
}

function formatChangePlan(changes, projectRoot = process.cwd()) {
  if (changes.length === 0) {
    return 'No filesystem changes.';
  }

  const lines = [];
  for (const change of changes) {
    const relativePath = path.relative(projectRoot, change.path)
      .split(path.sep)
      .join('/');
    lines.push(
      `${change.action.toUpperCase()} ${relativePath}`,
      `diff --tenets a/${relativePath} b/${relativePath}`
    );
    if (change.beforeMode !== change.afterMode) {
      if (change.beforeMode !== null) {
        lines.push(`old mode ${change.beforeMode.toString(8)}`);
      }
      if (change.afterMode !== null) {
        lines.push(`new mode ${change.afterMode.toString(8)}`);
      }
    }
    if (
      change.action !== 'update' ||
      !change.before?.equals(change.after)
    ) {
      lines.push(...formatContentDiff(change, relativePath));
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

module.exports = {
  captureFilesystemChanges,
  formatChangePlan,
};
