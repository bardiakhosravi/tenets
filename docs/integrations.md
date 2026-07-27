# Agent and Spec-Kit Integrations

Tenets installs versioned repository-local guidance in each supported tool's
native format. Zero-argument initialization detects existing agent
configuration and recommends a setup:

```bash
npx tenets init
```

Use explicit flags when the desired setup is already known:

```bash
npx tenets init --claude
npx tenets init --cursor
npx tenets init --augment
npx tenets init --copilot
npx tenets init --agents
npx tenets init --code-review-agent
npx tenets init --speckit
```

Flags are composable:

```bash
npx tenets init --claude --code-review-agent --speckit
```

## Installed Files

| Tool | Rules and instructions | Architecture review |
| --- | --- | --- |
| Claude Code | `.claude/rules/tenets-*.md`, marked `CLAUDE.md` guidance | `.claude/skills/tenets-review-architecture/TENETS-SKILL.md` |
| Cursor | `.cursor/rules/tenets-*.mdc` | `.cursor/commands/tenets-review-architecture.md` |
| Augment | `.augment/rules/tenets-*.md` | `.augment/commands/tenets-review-architecture.md` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions/tenets-*.instructions.md` | `.github/prompts/tenets-review-architecture.prompt.md` |
| Generic agents | Marked `AGENTS.md` guidance | `.tenets/prompts/tenets-review-architecture.md` |
| Code review agent | `.tenets/agents/code-review-agent.md` | Embedded reviewer workflow |

All architecture-review variants are generated from one canonical checklist and
refreshed by `npx tenets update`.

## Architecture Review

Invoke the native command in tools with slash-command support:

```text
/tenets-review-architecture
/tenets-review-architecture src/ordering
```

The generic prompt can be loaded directly by an agent that follows `AGENTS.md`.
A review should report:

- `pass`, `changes_requested`, or `blocked`
- Exact files and relevant lines
- Finding severity
- Active Tenets rule IDs
- Concrete remediation

Inspect cited guidance locally:

```bash
npx tenets explain TENETS-PORT-005
```

If a tool does not show a newly installed custom command, reopen the repository
or reload its command configuration so it rescans the repository-local command
directory.

## Claude Code

Claude Code receives multiple integration layers:

1. **Context-aware rules:** `.claude/rules/tenets-*.md` files load based on the
   files being edited.
2. **Persistent project guidance:** A concise generated block is added to
   `CLAUDE.md`.
3. **Architecture review:** `/tenets-review-architecture` runs the shared
   review contract.
4. **Optional monitoring hook:** A `PostToolUse` hook can remind Claude of
   relevant boundaries after file edits.

Install the optional monitoring hook:

```bash
npx tenets init --claude --with-hook
```

### Claude Code Review Agent

Install a dedicated code review agent together with the Claude integration:

```bash
npx tenets init --claude --code-review-agent
```

This writes `.claude/agents/code-review-agent.md` and merges a `PostToolUse`
agent hook into `.claude/settings.json`. After Claude edits a file, the reviewer
can return `changes_requested` feedback for Claude to address before continuing.

Confirm installation by running `/agents`, inspecting `.claude/settings.json`,
or starting Claude with `claude --debug`.

## Cursor

Cursor receives an always-on global rule and path-scoped architecture, domain,
and application rules. Tenets-owned legacy content can be migrated from
`.cursorrules` while unrelated user content is preserved.

Run the installed `/tenets-review-architecture` command from Cursor's command
interface.

## Augment

Augment receives repository-local global, architecture, domain, and application
rules. The architecture review is written to
`.augment/commands/tenets-review-architecture.md`.

After initialization, reopen the workspace or use Augment's command settings to
rescan custom commands if `/tenets-review-architecture` does not appear
immediately.

## GitHub Copilot

Copilot receives concise repository-wide instructions plus path-specific
instruction files. Content outside Tenets markers in
`.github/copilot-instructions.md` is preserved.

The architecture review prompt is available at
`.github/prompts/tenets-review-architecture.prompt.md`.

## Generic Agents

The `--agents` integration writes concise guidance into `AGENTS.md`, using
ownership markers when the file already exists. The complete architecture
review prompt remains under `.tenets/prompts/` so any compatible agent can load
it explicitly.

## Standalone Code Review Agent

```bash
npx tenets init --code-review-agent
```

This writes `.tenets/agents/code-review-agent.md`. The reviewer contract embeds
the applicable DDD and Hexagonal Architecture guidance so it can inspect a diff,
classify changed files by layer, and return structured feedback without a
network request.

## Spec-Kit

Tenets can extend an initialized
[Spec-Kit](https://github.com/github/spec-kit) project:

```bash
npx tenets init --speckit
```

The preset participates in Spec-Kit's template priority stack:

```text
.specify/templates/overrides/   # repository customizations take precedence
.specify/presets/tenets-ddd/    # Tenets preset
.specify/extensions/            # other extensions
.specify/templates/             # Spec-Kit core
```

The preset adds:

| Template | DDD and Hexagonal Architecture additions |
| --- | --- |
| `spec-template` | Domain language, bounded-context decisions, and candidate domain concepts |
| `plan-template` | Architecture constitution checks and explicit complexity tracking |
| `tasks-template` | Domain-to-application-to-adapter implementation order and test-first tasks |
| `checklist-template` | Domain, application, adapter, and testing review items |

Repository overrides retain precedence over the Tenets preset.

## Profiles

Select the architecture commitment at initialization:

```bash
npx tenets init --claude --profile core
npx tenets init --claude --profile strict
```

Change it later:

```bash
npx tenets update --profile pragmatic
```

See [Architecture Profiles](architecture-profiles.md) for applicability,
migration behavior, and profile contracts.

## Update And Diagnose

```bash
npx tenets doctor
npx tenets diff
npx tenets update
```

`tenets update` refreshes every configured agent integration and an installed
Spec-Kit preset from the versioned package bundle. `tenets doctor` reports
missing, stale, conflicting, or undiscoverable files.

Tenets preserves unowned content and refuses ambiguous noninteractive changes.
See the main [README](../README.md) for ownership and removal guarantees.
