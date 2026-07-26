---
id: TENETS-LIFECYCLE-004
title: Creation owns creation-specific behavior
kind: rule
status: stable
category: lifecycle
severity: error
profiles: ["core"]
related: ["TENETS-LIFECYCLE-002", "TENETS-LIFECYCLE-003", "TENETS-LIFECYCLE-005"]
aliases: []
---
## Rule

Creation entry points own creation-time normalization, identity generation, valid defaults, initial state selection, and creation-event recording.

## Rationale

Centralizing these decisions produces consistent new objects regardless of the calling workflow.

## Incorrect

```python
order = Order(id=OrderId.generate(), status=OrderStatus.DRAFT)
order.record(OrderCreated(order.id))
```

## Correct

```python
order = create_order(customer_id, billing_address)
```

## Remediation

Move creation-only decisions from callers and constructors into the named creation entry point.

## Review check

Search use cases for identity generation, initial defaults, and creation-event construction.
