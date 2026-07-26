---
id: TENETS-EVENT-005
title: Integration events are explicit versioned contracts
kind: rule
status: stable
category: events
severity: error
profiles: ["core"]
related: ["TENETS-EVENT-003", "TENETS-CONTEXT-004"]
aliases: []
---
## Rule

An integration event has an explicit boundary name, stable schema, and visible version. It contains published contract values, not aggregates, ORM models, or database records.

## Rationale

Versioned contracts let producers and consumers evolve independently without exposing internal domain or persistence representation.

## Incorrect

```python
publisher.publish(order)
```

## Correct

```python
@dataclass(frozen=True)
class OrderSubmittedIntegrationEventV1:
    event_id: IntegrationEventId
    order_id: PublishedOrderId
    occurred_at: datetime
```

## Remediation

Define a versioned integration-event type and map only the stable values external consumers need.

## Review check

Verify explicit `IntegrationEventV<n>` naming, schema ownership, and absence of internal aggregate or persistence types.
