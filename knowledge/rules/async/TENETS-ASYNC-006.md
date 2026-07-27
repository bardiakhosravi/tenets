---
id: TENETS-ASYNC-006
title: External effects require independent idempotency protection
kind: rule
status: stable
category: async-reliability
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-ASYNC-001", "TENETS-PATTERN-010"]
aliases: []
---
## Rule

Protect each non-transactional external effect with a stable provider-supported idempotency key, reconciliation, compensation, or explicit documentation of duplicate and loss risk.

## Rationale

A local inbox transaction cannot atomically cover an email provider, payment API, or other external system.

## Incorrect

```python
payment_gateway.charge(payment)
inbox.add(receipt)
```

## Correct

```python
payment_gateway.charge(
    payment,
    idempotency_key=PaymentChargeKey.from_operation(operation_id),
)
```

## Remediation

Assign stable effect identity, use the provider's protection where available, and document reconciliation or residual risk.

## Review check

Verify independent protection and failure recovery for every external side effect.
