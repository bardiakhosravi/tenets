# Tenets

The tenets of writing quality backend code -- starting with Hexagonal Architecture and Domain-Driven Design.

**Tenets** provides opinionated, battle-tested rules that your AI coding agents follow when building backend services. Install them with a single command and your agent immediately knows how to structure domains, ports, adapters, and everything in between.

## Why This Exists

AI coding agents like Claude Code, Cursor, and GitHub Copilot can generate incredible amounts of code quickly. But **code quality still matters**. We're not at the point where we can be completely hands-off -- we constantly review, iterate, and guide these tools toward better implementations.

For effective code review and collaboration with AI agents, we need **predictable design patterns**. This is even more crucial with AI-generated code since these tools can produce entire features at once, making architectural consistency vital for maintainability.

Tenets solves this by giving your coding agents the context and rules they need upfront, so every generated line of code follows the same architectural principles your team agreed on.

### Architecture starts at the spec, not the code

Most teams adopt spec-driven development (SDD) to plan features before building them -- writing specs, data models, and implementation plans that agents then execute. But without architectural guardrails baked into those planning artifacts, you end up with well-specified features that violate domain boundaries, leak infrastructure concerns into business logic, or skip the port/adapter structure entirely.

Tenets bridges this gap by extending SDD frameworks with DDD and Hexagonal Architecture practices at the planning stage. When you spec a feature, you're prompted to define the ubiquitous language, declare the bounded context, identify candidate aggregates and entities, and check against your architecture constitution -- before a single line of code is written. By the time implementation begins, the agent already knows the domain model, the correct layer for each concept, and the boundaries it must not cross.

We currently provide a [Spec-Kit](https://github.com/github/spec-kit) preset, with support for other spec-driven frameworks to follow. The goal is the same regardless of the tool: **make DDD and Hexagonal Architecture the default, not an afterthought.**

## Quick Start

### Install with the CLI

```bash
npx tenets init --claude
```

### Pick Your Tool

```bash
npx tenets init --claude        # Claude Code (multi-layer integration)
npx tenets init --cursor        # writes to .cursorrules
npx tenets init --copilot       # writes to .github/copilot-instructions.md
npx tenets init --agents        # writes to AGENTS.md
```

| Flag | Tool | What it writes |
|------|------|----------------|
| `--claude` | Claude Code | Rules, skill, hook, CLAUDE.md snippet (see below) |
| `--cursor` | Cursor | `.cursorrules` |
| `--copilot` | GitHub Copilot | `.github/copilot-instructions.md` |
| `--agents` | AGENTS.md | `AGENTS.md` |

Flags are composable — install multiple integrations in one step:

```bash
npx tenets init --claude --speckit
```

### Keeping Up to Date

```bash
npx tenets update
```

This pulls the latest rules and updates all previously installed files — including the Spec-Kit preset if you installed it. If you're upgrading from an older version, the CLI will detect this and walk you through the migration.

---

## Using Tenets with Spec-Kit

If you use [Spec-Kit](https://github.com/github/spec-kit) for spec-driven development, Tenets can extend your planning templates with DDD and Hexagonal Architecture sections — without overwriting your existing customizations.

### How It Works

Spec-Kit resolves templates through a priority stack. Tenets installs a **preset** at layer 2, below your own overrides:

```
.specify/templates/overrides/   ← your customizations (always wins)
.specify/presets/tenets-ddd/    ← Tenets DDD preset (layer 2)
.specify/extensions/.../        ← other extensions
.specify/templates/             ← Spec-Kit core templates
```

Your files are never touched. If you have custom templates in `.specify/templates/overrides/`, they take priority over everything.

### Setup

**Prerequisites**: Spec-Kit must already be initialized in your project (`specify init`).

```bash
npx tenets init --speckit
```

Or combine with your AI tool in one step:

```bash
npx tenets init --claude --speckit
```

### What Gets Added

| Template | DDD additions |
|----------|--------------|
| `spec-template` | **Domain Language** glossary table, **Bounded Context** decision with relationship mapping, **Candidate Domain Concepts** section |
| `plan-template` | **Constitution Check** gate (hexagonal architecture compliance), **Complexity Tracking** table for justified violations |
| `tasks-template` | DDD-aware phase structure (domain model → use cases → adapters), **BDD test-first** mandate, parallel execution `[P]` markers |
| `checklist-template` | DDD/hexagonal checklist items covering domain model, application layer, adapters, and testing |

### Keeping the Preset Up to Date

```bash
npx tenets update
```

This updates both your AI tool rules and the Spec-Kit preset in one command.

---

## Claude Code Integration

Claude Code gets a four-layer integration that goes beyond a single file dump:

### Layer 1: Context-Aware Rules (`.claude/rules/tenets-*.md`)

Rule files with glob frontmatter that **auto-load based on what you're editing**:

- Editing `domain/` files? Domain rules (entities, VOs, aggregates) load automatically
- Editing `adapters/` or `infrastructure/` files? Port and adapter rules load
- Editing `application/` files? Use case and orchestration rules load
- Editing anything in `src/`? Cross-cutting rules (structure, testing, naming) load

No manual referencing needed. The right rules appear at the right time.

### Layer 2: CLAUDE.md Snippet

A concise block appended to your project's `CLAUDE.md` with the 8 non-negotiable principles. Always in context, every conversation.

### Layer 3: `/tenets-review-architecture` Skill

An on-demand architecture review command. Run `/tenets-review-architecture` (or `/tenets-review-architecture src/domain/`) and the agent reads all tenets rules, analyzes your codebase, and reports violations grouped by severity:

- **Critical**: Dependency direction violations, domain layer impurity
- **Major**: Business logic in wrong layer, missing port abstractions
- **Minor**: Naming conventions, file organization

### Layer 4: Continuous Monitoring Hook (opt-in)

A `PostToolUse` hook that fires after every file edit. It detects which architectural layer was modified and injects a brief reminder about the relevant rules into the agent's context.

Install with the hook:

```bash
npx tenets init --claude --with-hook
```

Or skip and add it later by re-running `init`.

## What's Inside

30 rule files organized into four sections:

### Architecture (9 files)
Hexagonal primer, components, ports, primary adapters, secondary adapters, adapter configuration, integration flow, infrastructure replaceability, API boundaries.

### Domain (8 files)
Entities, value objects, aggregates, domain services, repositories, domain events, bounded contexts, ubiquitous language.

### Application (4 files)
Use cases, DDD + hexagonal synergy, event integration, cross-context communication.

### Global (8 files)
Project structure, cross-cutting concerns, validation and error handling, naming conventions, dependency rules, testing, async idempotency, architecture decision records.

## Language Support

Tenets currently focuses on Python implementations, providing concrete examples and patterns optimized for Python's language features and ecosystem.

We'd love to collaborate with experts in other languages to expand coverage. If you're experienced with Java, C#, Go, TypeScript, or other languages, contributions that translate these architectural rules into language-specific implementations are welcome.

## Contributing

This is a living set of tenets based on real-world experience, and there's always room for improvement.

### How to Contribute

1. **Open an Issue** -- Propose new tenets, improvements, or discuss existing ones
2. **Submit a PR** -- Add new patterns, fix examples, or improve clarity
3. **Share Examples** -- Real-world implementations that follow Tenets rules
4. **Language Adaptations** -- Help translate tenets to other languages

### What We're Looking For

- **Uncovered Scenarios** -- Backend development situations not yet addressed by the current tenets
- **Missing Design Patterns** -- Additional patterns that complement DDD and Hexagonal Architecture
- **Implementation Strategies** -- Better approaches for distributed systems, event sourcing, or CQRS
- **Advanced Testing Patterns** -- Testing strategies for complex domain logic and integration scenarios
- **Real-World Examples** -- Case studies showing Tenets rules applied in production systems

## Philosophy

> "I think of AI coding agents as another developer on my team -- I expect them to follow the same best practices."

These tenets ensure that:

- **Code is reviewable** -- Predictable patterns make AI-generated code easier to understand
- **Architecture is consistent** -- Clear tenets prevent architectural drift across features and services
- **Teams can collaborate** -- Shared tenets improve team efficiency, whether the author is human or AI
- **Systems remain maintainable** -- Good architecture scales with your codebase

## Additional Resources

- [Domain-Driven Design by Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture by Robert Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

## License

MIT License -- see [LICENSE](LICENSE) file for details.

---

*Tenets for better backend services -- one rule at a time.*
