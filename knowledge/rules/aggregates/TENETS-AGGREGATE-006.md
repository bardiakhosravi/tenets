---
id: TENETS-AGGREGATE-006
title: Cross-aggregate workflows are coordinated outside aggregates
kind: rule
status: stable
category: aggregates
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-002", "TENETS-AGGREGATE-005", "TENETS-AGGREGATE-008"]
aliases: []
---
## Rule

Use cases, domain-event handlers, process managers, or sagas coordinate workflows involving multiple aggregates. One aggregate does not load or mutate another.

## Rationale

No aggregate owns another aggregate's lifecycle or transaction boundary.

## Incorrect

```python
order.submit_and_decrement_inventory(inventory_repository)
```

## Correct

```python
order.submit()
inventory.reserve(InventoryReservation.from_order(order))
```

## Remediation

Move cross-aggregate sequencing outward and invoke behavior independently on each loaded root.

## Review check

Inspect aggregate methods for repositories, foreign aggregate parameters, and mutation of independently persisted roots.
