---
id: TENETS-ENTITY-001
title: Stable identity defines entity equality
kind: rule
status: stable
category: entities
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ENTITY-002", "TENETS-VALUE-001"]
aliases: []
---
## Rule

An entity has a stable domain identity, and equality between entities is based on that identity rather than all current attributes.

## Rationale

Entity state changes over its lifecycle while its continuity remains defined by identity.

## Incorrect

```python
@dataclass
class Order:
    id: OrderId
    status: OrderStatus
```

## Correct

```python
@dataclass(eq=False)
class Order:
    id: OrderId
    status: OrderStatus

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Order) and self.id == other.id
```

## Remediation

Introduce a domain ID and implement equality and hashing consistently from that identity.

## Review check

Verify entity equality does not change when mutable business state changes.
