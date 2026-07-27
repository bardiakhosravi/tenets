---
id: TENETS-EVENT-003
title: Domain events are not external contracts
kind: rule
status: stable
category: events
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-EVENT-001", "TENETS-EVENT-005", "TENETS-CONTEXT-004"]
aliases: []
---
## Rule

Never serialize or publish a domain event directly to external consumers. Map selected domain events to explicit integration events.

## Rationale

Domain events may evolve with the internal model, while external contracts require independently controlled schemas and compatibility.

## Incorrect

```python
broker.publish(asdict(order_submitted_domain_event))
```

## Correct

```python
integration_event = (
    self._order_submitted_integration_event_factory.create(domain_event)
)
self._integration_event_outbox.add(integration_event)
```

## Remediation

Introduce an application-owned integration event and a directional mapping factory.

## Review check

Verify that messaging adapters never accept domain-event types as published contracts.
