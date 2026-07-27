---
id: TENETS-TEST-004
title: Integration tests exercise complete workflows through controlled adapters
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-ADAPTER-001", "TENETS-COMPOSE-001", "TENETS-TEST-003"]
aliases: []
---
## Rule

Workflow integration tests connect a real primary adapter, use case, and domain model to selected real or controlled secondary adapters.

## Rationale

This level proves composition and boundary mappings that isolated tests cannot, while controlled external capabilities keep failures deterministic.

## Incorrect

```python
use_case = Mock()
response = submit_order_route(use_case)
assert response.status_code == 200
```

## Correct

```text
Flask test client
  -> SubmitOrderUseCase
  -> Order
  -> SQLiteOrderRepository
  -> FakePaymentGateway
```

## Remediation

Build a test composition root that preserves production port semantics and replaces only the external capabilities outside the workflow's intended scope.

## Review check

Distinguish primary-adapter unit tests from workflow integration tests and verify that critical workflows have the latter.
