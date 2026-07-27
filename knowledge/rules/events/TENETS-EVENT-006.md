---
id: TENETS-EVENT-006
title: Integration-event factories own event creation
kind: rule
status: stable
category: events
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-EVENT-004", "TENETS-LIFECYCLE-002", "TENETS-NAME-005"]
aliases: []
---
## Rule

An application-owned, event-specific factory creates each integration event, generates its identity through an explicit dependency, and preserves the source domain event's occurrence time.

## Rationale

The factory centralizes complete contract creation without forcing use cases to assemble identifiers, timestamps, or fields manually.

## Incorrect

```python
event = OrderSubmittedIntegrationEventV1(
    event_id=uuid4(),
    occurred_at=datetime.now(),
    order_id=domain_event.order_id,
)
```

## Correct

```python
event = self._order_submitted_integration_event_factory.create(domain_event)
```

## Remediation

Introduce a capability-specific integration-event factory with an injected ID generator and copy `occurred_at` from the domain event.

## Review check

Verify event-specific factory naming, complete construction, injected identity generation, and occurrence-time preservation.
