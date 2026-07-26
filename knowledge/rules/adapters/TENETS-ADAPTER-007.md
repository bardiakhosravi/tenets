---
id: TENETS-ADAPTER-007
title: Repository adapters reconstruct persisted objects
kind: rule
status: stable
category: adapters
severity: error
profiles: ["core", "python"]
related: ["TENETS-REPO-007", "TENETS-LIFECYCLE-005", "TENETS-ADAPTER-004"]
aliases: []
---
## Rule

Repository adapters map persistence representations to fully hydrated domain objects through constructors and directional mappers. They never invoke new-object creation entry points.

## Rationale

Repository reads reconstruct existing lifecycle state and must not generate new identities, defaults, or creation events.

## Incorrect

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return create_order(CustomerId(row.customer_id))
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(OrderId(row.id), CustomerId(row.customer_id), OrderStatus(row.status))
```

## Remediation

Replace creation calls with explicit source-to-target mapping that supplies all persisted identity and state.

## Review check

Search repository adapters for `create_*` calls and incomplete constructor mapping.
