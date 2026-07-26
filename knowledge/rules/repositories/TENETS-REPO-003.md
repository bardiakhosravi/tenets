---
id: TENETS-REPO-003
title: Repository queries use semantic criteria
kind: rule
status: stable
category: repositories
severity: error
profiles: ["core"]
related: ["TENETS-PORT-007", "TENETS-PORT-010", "TENETS-REPO-004"]
aliases: []
---
## Rule

Repository queries accept domain IDs, value objects, named criteria, or domain specifications. They do not accept raw dictionaries, callables, ORM expressions, or naked domain primitives.

## Rationale

Semantic criteria keep persistence mechanics out of use cases and make query intent explicit.

## Incorrect

```python
orders.search({"status": "paid"}, lambda row: row.total > 100)
```

## Correct

```python
orders.search(PaidOrdersForAccount(account_id, minimum_total))
```

## Remediation

Replace implementation-oriented parameters with an immutable named query concept.

## Review check

Inspect query signatures for dictionaries, callbacks, SQL fragments, ORM clauses, and primitive IDs.
