---
id: TENETS-APP-003
title: Use cases load outbound capability state
kind: rule
status: stable
category: application
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-005", "TENETS-PORT-006"]
aliases: []
---
## Rule

The use case loads every aggregate, entity, or value required by a secondary capability before invoking that port.

## Rationale

Loading is workflow orchestration. Keeping it in the use case prevents hidden persistence access in secondary adapters.

## Incorrect

```python
receipt_sender.send(order.id)
```

## Correct

```python
customer = customers.get(order.customer_id)
payment = payments.get_by_order(order.id)
receipt_sender.send(ReceiptDelivery(order, customer, payment))
```

## Remediation

Move adapter-side lookups into the use case and provide complete semantic input.

## Review check

Trace outbound calls and verify that adapters receive no identifiers that they use to load additional domain state.
