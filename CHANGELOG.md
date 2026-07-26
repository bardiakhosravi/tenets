# Changelog

All notable changes to Tenets are documented here.

## Unreleased

## [0.12.0] - 2026-07-26

### Added

- Canonical atomic rule and pattern catalog with stable IDs, schema validation,
  generated compatibility views, aliases, and deprecation support.
- Offline `tenets explain <rule-id>` output in text and JSON formats with
  close-ID suggestions.
- Stable rules for secondary-port data flow, semantic port types,
  repositories, use cases, creation and hydration, and cross-context
  communication.
- Stable rules for dependency direction, composition roots, primary and
  secondary adapters, external dependency access, and API boundaries.
- Stable rules for entities, value objects, aggregates, domain services,
  bounded-context ownership, and ubiquitous language.
- Stable Unit of Work rules covering application ownership, one-shot
  transactions, explicit commit, rollback and cleanup, shared resources,
  multi-transaction factories, retry ownership, nesting, and read scope.
- Stable event and reliability rules covering domain and integration events,
  transactional outbox and inbox workflows, acknowledgement, payload-bound
  idempotency, external effects, retention, and precise guarantees.
- SQLAlchemy and framework-free SQLite Unit of Work patterns plus event mapping,
  outbox relay, consumer inbox, and external-effect idempotency examples.

### Changed

- Architecture review findings must cite an existing stable Tenets rule ID.
- Generated agent guidance now includes canonical Unit of Work, event
  integration, domain-event, and asynchronous-idempotency views.
- Architecture-review and code-review agents now check transaction lifecycle,
  outbox and inbox atomicity, acknowledgement timing, and external-effect
  idempotency using stable rule IDs.

## [0.11.0] - 2026-07-25

### Added

- Repository detection for coding agents, stack manifests, frameworks, project
  layout, existing agent files, and initialized Spec-Kit projects.
- Recommended multi-select setup when `tenets init` is run without integration
  flags.
- Automatic scoped post-install verification for generated rules, review
  commands, and Spec-Kit presets.
- Detection and verification details in noninteractive
  `tenets init --yes --json` results.

## [0.10.1] - 2026-07-25

### Fixed

- Preview and JSON change paths now use stable forward slashes on Windows.

## [0.10.0] - 2026-07-25

### Added

- `tenets diff` to preview the exact filesystem changes produced by an update.
- `--dry-run` support for initialization, updates, and uninstall.
- `tenets doctor` diagnostics for missing, stale, conflicting, legacy, and
  untracked integrations.
- `tenets uninstall` with selective integration flags and ownership-safe removal.
- `tenets --version` and machine-readable `--json` command results.

### Changed

- Generated files now carry explicit Tenets ownership markers.
- Shared instruction files are modified only within Tenets marker blocks.
- Claude settings are merged structurally and malformed shared JSON is preserved.

### Migration

- Run `npx tenets@latest update` after upgrading.
- Existing generated files from earlier releases are recognized through legacy
  Tenets signatures.
- If a generated target path contains an unowned file, update now stops instead
  of replacing it. Run `tenets doctor`, review the conflict, and use an explicit
  `tenets init ... --yes` only when replacement is intended.
- See [Migration Notes](docs/migrations.md) for integration-specific details.

## [0.9.7] - 2026-07-25

- Added deterministic bundled rules, current Cursor and Copilot formats,
  cross-platform tests, safe migrations, and Spec-Kit source correction.

## [0.9.6] - 2026-07-24

- Added semantic repository lookup naming guidance and refreshed agent outputs.
