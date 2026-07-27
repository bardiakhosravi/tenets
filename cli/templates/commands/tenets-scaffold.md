You are initializing the architecture foundation for the Flask service in the
current repository. This workflow supports one service only. It does not
generate individual bounded contexts, workflows, features, or resources.

## Step 1: Load the rules

{{RULES_INSTRUCTION}}

Read the project-structure, dependency, composition, adapter, use-case, testing,
validation, error-handling, and naming guidance before proposing a structure.
Repository rules take precedence over general framework conventions.

## Step 2: Inspect before deciding

Inspect the repository without modifying it. Use code and configuration
evidence rather than filenames alone. Identify:

- Python package and source roots
- Flask application creation and startup flow
- Dependency composition or provider construction
- HTTP route registration
- Configuration and environment loading
- Persistence initialization
- Test layout and existing verification commands
- CI, deployment, authentication, logging, telemetry, and other
  enterprise-owned infrastructure that must remain intact
- Existing business workflows, domain behavior, use cases, or persistence code

Do not infer that a file is a composition root, application factory, adapter, or
domain module merely because it is named `container.py`, `app.py`,
`dependencies.py`, `services.py`, or another conventional name. Cite the code,
configuration, imports, or call flow supporting each architectural conclusion.

Inspect the working tree when version-control information is available. Preserve
all pre-existing user changes and do not include unrelated files in the plan.

## Step 3: Classify the repository

Choose exactly one state and report the evidence:

### `greenfield`

Use when the repository has no meaningful application implementation. Agent
configuration, Tenets files, documentation, version-control metadata, and an
otherwise empty Python project do not make a repository active.

### `enterprise_starter`

Use when the repository contains a Flask and enterprise platform foundation but
does not yet contain material business workflows that require architectural
migration. Existing application creation, dependency injection, authentication,
configuration, observability, persistence setup, deployment, and CI may all be
present.

### `active_service`

Use when meaningful business workflows or domain behavior already exist, files
would need to be moved or deleted, or safe classification is uncertain.

For `active_service`, stop without editing. Explain that service scaffolding is
not a modernization workflow and recommend a scoped architecture assessment.
Do not attempt to reorganize the repository.

## Step 4: Propose the complete plan

Do not write files before the user explicitly approves the plan.

Report:

1. Repository classification and supporting evidence
2. Detected or proposed service and Python package names
3. Existing conventions that will be preserved
4. Every directory and file to create
5. Every existing file to edit, with the exact symbol or section and reason
6. Files and enterprise capabilities that will remain untouched
7. Dependency changes
8. Tests and verification commands to run
9. Assumptions, conflicts, and decisions requiring confirmation

If an intended path contains a user-owned file, do not overwrite it, silently
rename the generated artifact, or create numbered alternatives. Either reuse it
only when code evidence establishes a compatible responsibility, adapt the plan
with explicit user approval, or report a blocking conflict.

## Step 5: Greenfield baseline

For `greenfield`, propose a minimal runnable Flask service using a `src/`
layout and one service package:

```text
pyproject.toml
src/
  <service_package>/
    __init__.py
    app.py
    domain/
      __init__.py
    application/
      __init__.py
      ports/
        __init__.py
      use_cases/
        __init__.py
    adapters/
      __init__.py
      primary/
        __init__.py
        flask/
          __init__.py
          health.py
      secondary/
        __init__.py
    configuration/
      __init__.py
tests/
  conftest.py
  test_health.py
```

The baseline is an architecture foundation, not a fake business domain:

- Use an application factory in `app.py`.
- Put the operational health endpoint in the Flask primary adapter.
- Do not invent entities, value objects, repositories, use cases, database
  models, or outbound adapters before a real business workflow requires them.
- Keep `__init__.py` files limited to package declarations or intentional
  re-exports.
- Include only dependencies needed to run and test the generated service.
- Use the repository name as a package-name candidate, normalize it for Python,
  and confirm it with the user before implementation.

If an equivalent project file or test configuration already exists, preserve it
and propose a structured addition instead of replacement.

## Step 6: Enterprise-starter adaptation

For `enterprise_starter`, preserve the existing platform foundation and adapt
the architecture plan to observed conventions:

- Do not impose the greenfield filenames on existing responsibilities.
- Add only missing architecture packages and minimal wiring required to make
  the foundation usable.
- Prefer existing application-factory, routing, dependency-composition,
  configuration, and test patterns when they preserve inward dependency
  direction.
- Identify every proposed edit to existing code before approval.
- Do not replace enterprise authentication, logging, telemetry, deployment,
  persistence setup, CI, or dependency-injection infrastructure.
- Do not move, rename, or delete existing files.
- When safe integration cannot be established from code evidence, stop and
  provide a manual integration decision instead of guessing.

Run the existing test suite before editing when a runnable test command is
available. Record pre-existing failures so they are not attributed to the
scaffold.

## Step 7: Implement after approval

After explicit approval:

- Apply only the approved operations.
- Preserve unrelated working-tree changes.
- Treat scaffolded application files as user-owned source code. Do not add
  Tenets ownership markers to them.
- Keep dependencies flowing adapters -> application -> domain.
- Keep Flask and other framework imports outside domain and application code.
- Use the existing structured parser or configuration mechanism for supported
  shared-file edits; do not perform brittle text substitutions.
- Add or update tests for application creation and the health endpoint.
- Do not add placeholder business abstractions solely to populate directories.

If new information invalidates the approved plan, stop and present a revised
plan for approval before continuing.

## Step 8: Verify and report

Run:

1. The relevant formatter or static checks when configured
2. The complete test suite, including generated smoke tests
3. `/tenets-review-architecture` over the created or changed service code

Then report:

- Final repository classification
- Files created
- Existing files edited
- Preserved enterprise integration points
- Commands run and their results
- Architecture-review outcome
- Remaining manual wiring, assumptions, or risks

Do not claim completion when the service cannot start, tests fail because of the
scaffold, architecture review reports unresolved blocking findings, or required
integration remains ambiguous.
