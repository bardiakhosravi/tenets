---
id: TENETS-APP-004
title: Use cases distinguish creation from hydration
kind: rule
status: stable
category: application
severity: error
minimum_profile: core
applies_to: ["python"]
related: ["TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-002", "TENETS-LIFECYCLE-005"]
aliases: []
---
## Rule

Use cases call the domain creation entry point for new objects and treat repository results as already hydrated existing objects.

## Rationale

Recreating a loaded object can generate a new identity, reset persisted state, and emit false creation events.

## Incorrect

```python
loaded = orders.get(command.order_id)
order = create_order(loaded.customer_id)
```

## Correct

```python
order = orders.get(command.order_id)
order.submit()
```

## Remediation

Remove recreation of repository results and invoke behavior directly on the hydrated aggregate.

## Review check

Find creation-function calls whose inputs come from objects just returned by repositories.
