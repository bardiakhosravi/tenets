---
id: TENETS-LIFECYCLE-001
title: Creation and hydration are distinct
kind: rule
status: stable
category: lifecycle
severity: error
profiles: ["core"]
related: ["TENETS-APP-004", "TENETS-LIFECYCLE-002", "TENETS-LIFECYCLE-005"]
aliases: []
---
## Rule

Creation establishes a new domain object from the business perspective. Hydration reconstructs an existing object from persisted state. They use semantically distinct entry points.

## Rationale

Creation may generate identity, defaults, and events that must never run while reconstructing existing state.

## Incorrect

```python
return create_order(customer_id=row.customer_id)
```

## Correct

```python
new_order = create_order(customer_id)
existing_order = Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Separate new-object creation from persistence mapping and identify every creation-only side effect.

## Review check

Verify that repositories do not invoke creation entry points and workflows do not directly construct new objects.
