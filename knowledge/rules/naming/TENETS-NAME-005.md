---
id: TENETS-NAME-005
title: Dependency names identify the capability they provide
kind: rule
status: stable
category: naming
severity: warning
profiles: ["core"]
related: ["TENETS-NAME-001", "TENETS-COMPOSE-001"]
aliases: []
---
## Rule

Name injected dependencies and stored fields after their specific capability or contract. Avoid ambiguous names such as `factory`, `repository`, `client`, `handler`, or `publisher`.

## Rationale

Capability-specific names keep constructors and orchestration readable when several dependencies share the same technical role.

## Incorrect

```python
self._factory = factory
self._publisher = publisher
```

## Correct

```python
self._order_submitted_integration_event_factory = (
    order_submitted_integration_event_factory
)
self._integration_event_publisher = integration_event_publisher
```

## Remediation

Rename parameters and fields to the narrow capability they implement.

## Review check

Inspect dependency variables and verify that each name remains clear without reading its type annotation.
