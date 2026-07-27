---
id: TENETS-APP-002
title: Use cases orchestrate domain behavior
kind: rule
status: stable
category: application
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-001", "TENETS-PORT-011"]
aliases: []
---
## Rule

Use cases load state, coordinate dependencies and transactions, invoke domain behavior, and interpret workflow outcomes. Domain invariants and business calculations remain in domain objects or domain services.

## Rationale

Application orchestration changes for workflow reasons; domain rules change for business reasons.

## Incorrect

```python
if order.total.amount > Decimal("1000"):
    order.discount = Decimal("0.10")
```

## Correct

```python
order.apply_eligible_discount(customer_tier)
```

## Remediation

Move the business decision into the domain concept that owns the invariant and leave only coordination in the use case.

## Review check

Look for calculations, state assignments, and business conditionals in use cases.
