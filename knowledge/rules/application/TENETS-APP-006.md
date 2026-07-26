---
id: TENETS-APP-006
title: Use cases own transaction coordination
kind: rule
status: stable
category: application
severity: error
profiles: ["core"]
related: ["TENETS-APP-002", "TENETS-PORT-011"]
aliases: []
---
## Rule

Application use cases define transaction scope and coordinate domain-event handling, outbox writes, and outbound capability timing. Domain objects and adapters do not own the business transaction.

## Rationale

The application layer knows the workflow boundary and can coordinate persistence without coupling domain behavior to infrastructure.

## Incorrect

```python
class SqlOrderRepository:
    def save_and_publish_and_charge(self, order): ...
```

## Correct

```python
with unit_of_work:
    orders.save(order)
    outbox.add_from(order.domain_events)
```

## Remediation

Move transaction and workflow coordination into the use case or application handler.

## Review check

Locate commits, event publication, and multi-capability sequencing and verify that the application owns them.
