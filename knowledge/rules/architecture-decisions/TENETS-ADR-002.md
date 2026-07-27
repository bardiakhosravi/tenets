---
id: TENETS-ADR-002
title: ADRs record context decision status and consequences
kind: rule
status: stable
category: architecture-decisions
severity: warning
profiles: ["core"]
related: ["TENETS-ADR-001", "TENETS-ADR-003"]
aliases: []
---
## Rule

Every ADR records a title, status, context, decision, and consequences.

## Rationale

These sections provide the minimum durable evidence needed to understand what was chosen, why it was necessary, and which trade-offs it creates.

## Incorrect

```markdown
# Use Postgres

We decided to use Postgres.
```

## Correct

```markdown
# ADR-0012: Permit Atomic Inventory Reservation
## Status
Accepted
## Context
...
## Decision
...
## Consequences
...
```

## Remediation

Add the missing decision context and consequences; link related Tenets rule IDs when they clarify an exception or requirement.

## Review check

Confirm that each ADR can be evaluated without relying on undocumented meeting context.
