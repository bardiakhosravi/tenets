---
id: TENETS-VALIDATE-001
title: Domain objects enforce domain invariants
kind: rule
status: stable
category: validation
severity: error
profiles: ["core"]
related: ["TENETS-ENTITY-002", "TENETS-VALUE-002", "TENETS-LIFECYCLE-001"]
aliases: []
---
## Rule

Entities, aggregates, and value objects enforce their own invariants explicitly on every lifecycle path where those invariants apply.

## Rationale

Domain validity must not depend on whether an object entered through HTTP, a use case, a repository mapper, or another adapter.

## Incorrect

```python
if request_body.quantity <= 0:
    raise BadRequest("quantity must be positive")
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()
```

## Remediation

Move business invariants into the domain type and retain only protocol-shape checks at the external boundary.

## Review check

Verify that every applicable creation, mutation, and hydration path passes through the domain invariant.
