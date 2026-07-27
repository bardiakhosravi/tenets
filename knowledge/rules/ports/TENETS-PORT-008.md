---
id: TENETS-PORT-008
title: Ports use the smallest cohesive semantic type
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-006", "TENETS-PORT-007", "TENETS-PORT-009"]
aliases: []
---
## Rule

Choose the smallest cohesive type that completely expresses a capability: an aggregate, entity, value object, named criteria, specification, or immutable application-owned contract.

## Rationale

Passing an entire aggregate unnecessarily increases coupling, while exploding it into primitives loses semantics.

## Incorrect

```python
send_receipt(order_id, email, first_name, total_cents, currency)
```

## Correct

```python
send_receipt(ReceiptDelivery(order, customer, payment_confirmation))
```

## Remediation

Model the capability input around what the operation needs, preserving domain objects where their full meaning is required.

## Review check

Verify that the contract is neither an oversized aggregate dependency nor a parameter list that reconstructs a domain concept.
