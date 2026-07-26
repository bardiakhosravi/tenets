---
id: TENETS-EVENT-004
title: Application handlers select publishable occurrences
kind: rule
status: stable
category: events
severity: error
profiles: ["core"]
related: ["TENETS-EVENT-003", "TENETS-EVENT-006", "TENETS-NAME-004"]
aliases: []
---
## Rule

An application domain-event handler decides whether a domain occurrence becomes an externally publishable integration event.

## Rationale

Publication is an application policy: aggregates should not know external consumers, and adapters should not decide business significance.

## Incorrect

```python
class Order:
    def submit(self):
        self._publisher.publish(OrderSubmittedIntegrationEventV1(...))
```

## Correct

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    def handle(self, event: OrderSubmittedDomainEvent) -> None:
        self._integration_event_outbox.add(
            self._order_submitted_integration_event_factory.create(event)
        )
```

## Remediation

Move publication selection into an explicitly named application domain-event handler.

## Review check

Verify that publication policy lives in the application layer and is triggered synchronously inside the owning use case transaction.
