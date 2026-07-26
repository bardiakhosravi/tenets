---
id: TENETS-AGGREGATE-002
title: Aggregate boundaries define transactional invariants
kind: rule
status: stable
category: aggregates
severity: error
profiles: ["core"]
related: ["TENETS-AGGREGATE-001", "TENETS-AGGREGATE-003", "TENETS-AGGREGATE-008"]
aliases: []
---
## Rule

Place state in one aggregate when its invariants must be immediately consistent within the same transaction. Do not group concepts only for navigation or persistence convenience.

## Rationale

Aggregate boundaries are consistency boundaries; oversized aggregates increase contention while undersized aggregates cannot enforce required invariants.

## Incorrect

```text
Customer, every Order, and every Invoice form one aggregate because the UI shows them together.
```

## Correct

```text
Order and OrderLine share immediate total and quantity invariants; Customer is referenced by CustomerId.
```

## Remediation

Define the invariant and transaction that require the boundary, then separate merely related concepts.

## Review check

Ask which invariant requires every member to change atomically with the root.
