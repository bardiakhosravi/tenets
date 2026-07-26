---
id: TENETS-AGGREGATE-007
title: Concurrent aggregate writes use an explicit conflict strategy
kind: rule
status: stable
category: aggregates
severity: error
profiles: ["core"]
related: ["TENETS-AGGREGATE-002", "TENETS-APP-006"]
aliases: []
---
## Rule

Where concurrent writes are possible, define an explicit strategy such as optimistic versioning, locking, a commutative operation, serialization, or conflict reconciliation.

## Rationale

Aggregate methods protect in-memory invariants but cannot by themselves prevent lost updates across concurrent transactions.

## Incorrect

```python
order = orders.get(order_id)
order.add_line(...)
orders.save(order)  # Silently overwrites a concurrent update.
```

## Correct

```python
orders.save(order, expected_version=order.version)
```

## Remediation

Identify the conflict boundary and implement and test the chosen strategy in the repository contract and adapter.

## Review check

Verify mutable aggregates with concurrent writers cannot silently overwrite committed state.
