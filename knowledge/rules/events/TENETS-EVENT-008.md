---
id: TENETS-EVENT-008
title: Reliable state-change publication uses a transactional outbox
kind: rule
status: stable
category: events
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-UOW-004", "TENETS-AGGREGATE-008", "TENETS-PATTERN-008"]
aliases: []
---
## Rule

Store publication intent in an outbox in the same local transaction as the state change. Direct publication requires acceptable loss, equivalent atomicity, or an ADR documenting the reliability trade-off.

## Rationale

Publishing inside a database transaction cannot atomically guarantee both database commit and broker acceptance.

## Incorrect

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_publisher.publish(event)
    self._unit_of_work.commit()
```

## Correct

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_outbox.add(event)
    self._unit_of_work.commit()
```

## Remediation

Record a complete outbox message atomically and publish it later through a relay.

## Review check

Verify same-resource atomicity for business state and outbox records and inspect every direct-publication exception.
