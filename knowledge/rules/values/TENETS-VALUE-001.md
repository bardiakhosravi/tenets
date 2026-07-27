---
id: TENETS-VALUE-001
title: Value objects are immutable and use value equality
kind: rule
status: stable
category: values
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-VALUE-002", "TENETS-ENTITY-001"]
aliases: []
---
## Rule

A value object is immutable and equality is determined by its complete semantic value.

## Rationale

Value objects describe what a value is, not which individual instance it is.

## Incorrect

```python
address.city = "Toronto"
```

## Correct

```python
@dataclass(frozen=True)
class ShippingAddress:
    street: str
    city: str
    postal_code: PostalCode
```

## Remediation

Prevent mutation and replace changed values with newly created value objects.

## Review check

Verify value objects have no identity equality, mutating methods, or externally writable state.
