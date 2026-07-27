---
id: TENETS-SERVICE-001
title: Domain services hold ownerless domain behavior
kind: rule
status: stable
category: services
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-SERVICE-002", "TENETS-ENTITY-002", "TENETS-APP-002"]
aliases: []
---
## Rule

Use a domain service only for domain behavior that requires multiple concepts and does not naturally belong to one entity or value object.

## Rationale

Premature services produce procedural models, while forcing ownerless behavior onto an entity creates artificial coupling.

## Incorrect

```python
class OrderService:
    def submit(self, order: Order) -> None:
        order.status = OrderStatus.SUBMITTED
```

## Correct

```python
class PricingPolicy:
    def calculate(self, order: Order, customer_tier: CustomerTier) -> Money: ...
```

## Remediation

Move behavior to its natural entity or value object, retaining a service only when no single domain owner exists.

## Review check

For every domain service method, ask why the behavior cannot belong to one supplied domain object.
