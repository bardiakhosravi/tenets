---
id: TENETS-EVENT-002
title: Domain behavior records domain events
kind: rule
status: stable
category: events
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-EVENT-001", "TENETS-AGGREGATE-003"]
aliases: []
---
## Rule

The aggregate or domain behavior that completes a state transition records its domain event only after the transition succeeds. Repositories and adapters do not infer events from persistence changes.

## Rationale

Only domain behavior knows whether the business occurrence actually happened and which semantics it carries.

## Incorrect

```python
if order_row.status == "submitted":
    publish(OrderSubmittedDomainEvent(...))
```

## Correct

```python
def submit(self, submitted_at: datetime) -> None:
    self._status = OrderStatus.SUBMITTED
    self._domain_events.append(
        OrderSubmittedDomainEvent(self.id, submitted_at)
    )
```

## Remediation

Move event recording into the successful domain behavior and remove adapter-side inference.

## Review check

Trace each domain event to the domain state transition that records it.
