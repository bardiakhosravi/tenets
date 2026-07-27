---
id: TENETS-TEST-006
title: Port tests assert semantic contract values
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-PORT-007", "TENETS-PORT-008", "TENETS-PORT-009", "TENETS-REPO-003"]
aliases: []
---
## Rule

Tests verify that repositories and secondary ports receive and return the aggregate, entity, value object, named criteria, or capability contract required by the port.

## Rationale

Testing only call count or primitive equality allows naked domain primitives and adapter representations to leak across semantic boundaries unnoticed.

## Incorrect

```python
orders.get.assert_called_once_with("ord_123")
```

## Correct

```python
assert orders.requested_order_ids == [OrderId("ord_123")]
assert all(isinstance(value, OrderId) for value in orders.requested_order_ids)
```

## Remediation

Assert both the semantic value and its contract type at port boundaries.

## Review check

Look for port tests that accept strings, dictionaries, callables, ORM expressions, or vendor models where the contract requires domain semantics.
