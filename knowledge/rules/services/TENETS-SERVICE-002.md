---
id: TENETS-SERVICE-002
title: Domain services are pure and stateless
kind: rule
status: stable
category: services
severity: error
profiles: ["core"]
related: ["TENETS-SERVICE-001", "TENETS-APP-003", "TENETS-DEPEND-001"]
aliases: []
---
## Rule

Domain services operate only on supplied semantic domain data. They retain no workflow state and perform no persistence, network access, messaging, configuration lookup, or orchestration.

## Rationale

Use cases own loading and external coordination; domain services express deterministic business behavior.

## Incorrect

```python
class PricingPolicy:
    def calculate(self, order_id: OrderId) -> Money:
        order = self._orders.get(order_id)
```

## Correct

```python
class PricingPolicy:
    def calculate(self, order: Order, tier: CustomerTier) -> Money: ...
```

## Remediation

Move I/O and loading into the use case and pass the required domain objects into the service.

## Review check

Inspect domain-service constructors and methods for repositories, ports, mutable state, and external calls.
