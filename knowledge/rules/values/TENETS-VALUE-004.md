---
id: TENETS-VALUE-004
title: Value objects are instantiated directly
kind: rule
status: stable
category: values
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-VALUE-003", "TENETS-VALIDATE-001", "TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-002"]
aliases: []
---
## Rule

A value object has one entry point: its constructor. Callers instantiate it directly, and it has no separate creation function or class factory. In Python, all validation and normalization live in `__post_init__`.

## Rationale

Creation functions separate creation-only behavior such as identity generation, defaults, and events from hydration. A value object has none of that behavior, so creating and hydrating it are the same operation. A second entry point adds indirection, and any validation placed in it is skipped when the constructor is used directly.

## Incorrect

```python
@dataclass(frozen=True)
class Quantity:
    value: int

def create_quantity(value: int) -> Quantity:
    if value <= 0:
        raise InvalidQuantity()
    return Quantity(value)

quantity = create_quantity(command.quantity)
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()

quantity = Quantity(command.quantity)
```

Normalization also belongs in `__post_init__`. It must be idempotent because hydration runs it too:

```python
@dataclass(frozen=True)
class CustomerEmail:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if "@" not in normalized:
            raise InvalidCustomerEmail()
        object.__setattr__(self, "value", normalized)
```

## Remediation

Move validation and normalization from the creation function into `__post_init__`, replace its calls with the constructor, and delete the function.

## Review check

Search value-object modules for `create_<value_object>()` functions and class factories, and verify that validation does not live outside the constructor path.
