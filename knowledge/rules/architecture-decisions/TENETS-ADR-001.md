---
id: TENETS-ADR-001
title: Material architectural choices and exceptions receive an ADR
kind: rule
status: stable
category: architecture-decisions
severity: warning
profiles: ["core"]
related: ["TENETS-ADR-002", "TENETS-AGGREGATE-008"]
aliases: []
---
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
