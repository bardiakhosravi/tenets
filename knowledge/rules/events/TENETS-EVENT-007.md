---
id: TENETS-EVENT-007
title: Publisher ports receive complete integration events
kind: rule
status: stable
category: events
severity: error
profiles: ["core"]
related: ["TENETS-EVENT-005", "TENETS-PORT-005", "TENETS-PORT-006"]
aliases: []
---
## Rule

An application-owned publisher port receives a complete integration event. Its messaging adapter serializes and routes that event without loading repositories or deriving missing domain state.

## Rationale

Complete semantic input keeps orchestration in the application and messaging infrastructure focused on publication.

## Incorrect

```python
publisher.publish_order_submitted(order_id)
```

## Correct

```python
class IntegrationEventPublisher(Protocol):
    def publish(
        self, event: OrderSubmittedIntegrationEventV1
    ) -> None: ...
```

## Remediation

Add missing data to the integration-event contract and remove repository access from the messaging adapter.

## Review check

Verify that publisher methods receive complete events and adapters perform no domain loading.
