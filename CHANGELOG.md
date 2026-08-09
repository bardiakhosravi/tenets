# Changelog

All notable changes to Tenets are documented here.

## Unreleased

## [0.15.1] - 2026-08-09

### Fixed

- `tenets init --speckit` now installs only the Tenets preset into an already
  initialized Spec-Kit project and never silently selects or bootstraps a
  coding-agent integration.
- Spec-Kit preset initialization now fails before writing Tenets configuration
  when `.specify/` is absent.

### Changed

- Documented the single command for adding the Tenets preset to an existing
  Spec-Kit project and clarified that it works independently of Cursor, Claude
  Code, or any other Spec-Kit integration.

## [0.15.0] - 2026-08-06

### Added

- Reproducible 60-second installation and architecture-review demo backed by a
  purpose-built FastAPI fixture, real CLI captures, and deterministic video
  rendering.
- Activation-focused README organized around the architecture problem,
  reproducible proof, quick start, and repository-appropriate next actions,
  with detailed agent and Spec-Kit setup moved into a dedicated integration
  guide.
- Unified `/tenets-scaffold` agent workflow for greenfield Flask repositories
  and enterprise service starters, installed for Claude Code, Cursor, Augment,
  GitHub Copilot, and generic agents with plan approval and non-destructive
  enterprise safeguards.
- Repository-aware post-install next actions in human and JSON `tenets init`
  output, with scoped adoption guidance for established services.

### Changed

- Removed the installation demo video embed and showcase block from the README.

## [0.14.0] - 2026-07-27

### Added

- Cumulative `core`, `pragmatic`, and `strict` architecture profiles, with
  `pragmatic` as the default for fresh installations.
- Profile and technology-applicability metadata for every canonical knowledge
  entry.
- Profile-aware architecture review allowlists and activation details in
  `tenets explain` and `tenets doctor`.

### Changed

- Agent rule files are generated from only the knowledge entries active for the
  repository's profile and detected technology.
- Existing installations without profile metadata migrate to unrestricted
  `strict` behavior to preserve their current rule set.

### Migration

- Run `npx tenets@latest update` to preserve existing installations on
  `strict`, or pass `--profile core|pragmatic|strict` to choose a different
  enforcement level.

## [0.13.0] - 2026-07-26

### Added

- Stable testing rules for domain behavior, use-case orchestration, secondary
  adapter contracts, workflow integration, lifecycle-aware fixtures, and
  semantic port assertions.
- Stable validation and error-handling rules covering invariant ownership,
  external shape validation, failure ownership, vendor translation,
  protocol mapping, and unexpected-error boundaries.
- Stable ADR rules for material decisions, minimum record content, and
  superseded decision history.
- Repository contract testing, layered Flask error handling, and Python
  bounded-context project-structure patterns.

### Changed

- Architecture-review and code-review agents now cite the new testing,
  validation, error, ADR, and project-structure rule families.
- Generated testing, validation, error-handling, ADR, and project-structure
  guides now come from canonical knowledge entries.
- Spec-Kit templates now use bounded-context-first examples, layered test
  planning, and precise port-owned failure translation.
- Removed the previous global `DomainException` and `AdapterException`
  hierarchy requirement and rigid path-based project-structure checks.

### Migration

- Run `npx tenets@latest update` to regenerate agent rules and architecture
  review commands with the new quality and governance guidance.

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
