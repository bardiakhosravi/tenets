---
id: TENETS-TEST-001
title: Domain behavior is unit tested without infrastructure
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-001", "TENETS-LIFECYCLE-002", "TENETS-EVENT-002"]
aliases: []
---
## Rule

Test entities, aggregates, value objects, and domain services with real domain objects and without repositories, adapters, frameworks, databases, or external clients.

## Rationale

Domain tests should prove business behavior, invariants, state transitions, returned values, and recorded domain events rather than mock configuration.

## Incorrect

```python
order = Mock(spec=Order)
order.submit()
order.submit.assert_called_once()
```

## Correct

```python
order = create_order(customer_account_id=account_id, lines=lines)
order.submit()
assert order.status is OrderStatus.SUBMITTED
assert isinstance(order.recorded_events[-1], OrderSubmittedDomainEvent)
```

## Remediation

Replace mocked domain objects with production domain entry points and assert externally observable behavior.

## Review check

Verify that domain tests run without infrastructure and exercise real domain behavior.
