#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
FIXTURE_ROOT="${REPO_ROOT}/examples/architecture-review-demo"
CAPTURE_ROOT="${SCRIPT_DIR}/captured"
WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/tenets-demo.XXXXXX")"

cleanup() {
  rm -rf "${WORK_ROOT}"
}
trap cleanup EXIT

mkdir -p "${CAPTURE_ROOT}"
cp -R "${FIXTURE_ROOT}/." "${WORK_ROOT}/"

strip_ansi() {
  perl -pe 's/\e\[[0-9;]*[[:alpha:]]//g'
}

(
  cd "${WORK_ROOT}"
  printf '\n' | NO_COLOR=1 node "${REPO_ROOT}/cli/bin/tenets.js" init
) | strip_ansi > "${CAPTURE_ROOT}/init.txt"

(
  cd "${WORK_ROOT}"
  NO_COLOR=1 node "${REPO_ROOT}/cli/bin/tenets.js" \
    explain TENETS-PORT-005
) | strip_ansi > "${CAPTURE_ROOT}/explain.txt"

node - "${WORK_ROOT}/.tenets.json" "${CAPTURE_ROOT}/tenets-config.json" <<'NODE'
const fs = require('node:fs');
const [sourcePath, targetPath] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
for (const tool of Object.values(config.tools || {})) {
  delete tool.installedAt;
  delete tool.updatedAt;
}
fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
NODE

printf 'Captured demo output in %s\n' "${CAPTURE_ROOT}"
