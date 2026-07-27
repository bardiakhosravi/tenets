---
id: TENETS-PORT-007
title: Port contracts reject naked domain primitives
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-005", "TENETS-PORT-008", "TENETS-PORT-010"]
aliases: []
---
## Rule

Public repository and secondary-port methods do not accept primitive strings, numbers, booleans, dictionaries, or callables when those values carry domain meaning.

## Rationale

Semantic types preserve validation, units, identity, and intent at boundaries where primitive confusion is expensive.

## Incorrect

```python
orders.get("ord-123")
gateway.authorize(1299, "USD", "acct-7")
```

## Correct

```python
orders.get(create_order_id("ord-123"))
gateway.authorize(PaymentAuthorization(amount, billing_account_id))
```

## Remediation

Introduce or reuse a domain value object, named criteria, specification, or immutable capability contract.

## Review check

Inspect public port signatures and challenge each primitive parameter that represents identity, money, quantity, status, date, or business criteria.
