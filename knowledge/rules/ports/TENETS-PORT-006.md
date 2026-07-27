---
id: TENETS-PORT-006
title: Use cases provide complete capability input
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-003", "TENETS-PORT-005", "TENETS-PORT-008"]
aliases: []
---
## Rule

A use case supplies all domain information an outbound capability needs. The secondary port does not load, discover, or derive missing domain state from persistence.

## Rationale

Complete input keeps orchestration visible and makes the port independently testable.

## Incorrect

```python
payment_gateway.capture(order.id)  # Adapter must load amount and account.
```

## Correct

```python
payment_gateway.capture(create_payment_capture(order, billing_account))
```

## Remediation

Identify missing state, load it in the use case, and add an appropriate semantic input to the port contract.

## Review check

Trace each port call and verify that its implementation can complete without querying application persistence.
