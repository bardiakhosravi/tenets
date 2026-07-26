---
id: TENETS-LIFECYCLE-005
title: Constructors hydrate persisted state
kind: rule
status: stable
category: lifecycle
severity: error
profiles: ["core", "python"]
related: ["TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-004", "TENETS-REPO-007"]
aliases: []
---
## Rule

Repository adapters reconstruct objects by mapping persistence representations to constructors with explicit persisted identity and state. Hydration does not generate identity, apply new-object defaults, or record creation events.

## Rationale

Persisted state represents an existing lifecycle and must be reconstructed faithfully.

## Incorrect

```python
def hydrate_order(row):
    return create_order(CustomerId(row.customer_id))
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Replace creation calls and `hydrate_*` helpers with explicit `_map_<source>_to_<target>` mapping functions.

## Review check

Verify persisted identity and state are passed explicitly and mapping helpers name their direction.
