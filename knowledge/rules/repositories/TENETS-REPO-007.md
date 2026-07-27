---
id: TENETS-REPO-007
title: Repository adapters map without business rules
kind: rule
status: stable
category: repositories
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-LIFECYCLE-005", "TENETS-REPO-001", "TENETS-REPO-006"]
aliases: []
---
## Rule

A repository implementation contains persistence operations and explicit source-to-target mapping. It does not make business decisions, invoke creation entry points, or orchestrate workflows.

## Rationale

Adapters reconstruct existing state; domain behavior and application decisions belong inward.

## Incorrect

```python
return create_order(customer_id=row.customer_id)
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Move business rules inward and replace creation calls with directional mapping that invokes constructors using persisted state.

## Review check

Inspect repository adapters for `create_*` calls, business branching, and ambiguous helpers named `hydrate`.
