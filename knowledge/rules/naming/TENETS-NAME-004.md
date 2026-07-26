---
id: TENETS-NAME-004
title: Event handler names identify their event boundary
kind: rule
status: stable
category: naming
severity: warning
profiles: ["core"]
related: ["TENETS-EVENT-004", "TENETS-EVENT-009"]
aliases: []
---
## Rule

End application domain-event handler classes with `DomainEventHandler` and external integration-event consumer handler classes with `IntegrationEventHandler`.

## Rationale

Explicit suffixes prevent ambiguity when internal domain events and published integration events appear in the same codebase.

## Incorrect

```python
class RecordOrderSubmitted:
    ...
```

## Correct

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    ...

class ReserveInventoryForOrderIntegrationEventHandler:
    ...
```

## Remediation

Rename handlers to include both their capability and event-boundary suffix.

## Review check

Verify that event handlers are distinguishable by name without relying on package placement.
