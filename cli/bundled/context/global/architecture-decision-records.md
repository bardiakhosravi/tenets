<!-- tenets:generated-source -->
# Architecture Decision Records

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ADR-001: Material architectural choices and exceptions receive an ADR

## Rule

Record a material architectural choice or qualifying exception whose rationale and consequences future maintainers must preserve or revisit.

## Rationale

Code shows what exists but often cannot retain why a consequential trade-off was accepted, what boundaries constrain it, or when it must be reconsidered.

## Incorrect

```text
An undocumented cross-aggregate transaction is introduced because both tables
currently share a database.
```

## Correct

```text
ADR-0012 records the invariant, shared-database constraint, lock-ordering
consequence, and the trigger for revisiting the exception.
```

## Remediation

Create an ADR for material technology changes, reliability or security trade-offs, cross-team decisions, and rule exceptions that explicitly permit ADR-backed deviation.

## Review check

Look for consequential or exceptional choices whose rationale is absent from durable project documentation.

## TENETS-ADR-002: ADRs record context decision status and consequences

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

## TENETS-ADR-003: Superseded decisions preserve history

## Rule

Record a materially changed decision in a new ADR and retain the previous ADR with a status that points to its replacement.

## Rationale

Preserved history explains the assumptions behind existing code and prevents later edits from rewriting the rationale that maintainers originally followed.

## Incorrect

```text
Edit an accepted ADR's Decision section until it describes its replacement.
```

## Correct

```markdown
## Status

Superseded by ADR-0019
```

## Remediation

Restore the historical decision where possible, create a replacement ADR, and link the old and new records.

## Review check

Verify that material decision changes create new records while maintenance edits remain limited to status, links, corrections, references, and clearly marked later context.
