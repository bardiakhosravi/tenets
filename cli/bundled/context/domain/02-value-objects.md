# Value Object Rules

## Value Object Rules
- Value objects MUST be immutable - use `@dataclass(frozen=True)`
- Equality is based on ALL attributes, not identity
- Should be small, focused, and represent a concept from the domain
- Include validation in `__post_init__` method
- Should have meaningful methods that operate on the value
- New value objects MUST be created through a standalone `create_<value_object>()` function in the value object's module
- Constructors are reserved for hydration and internal reconstruction from already-normalized state
- See **Domain Object Creation and Hydration Rules** for the complete lifecycle distinction
- Create a value object when a primitive has domain-specific meaning, validation, normalization, units, identity semantics, domain behavior, or a meaningful risk of being confused with another value of the same primitive type
- Do not create wrappers for genuinely technical or incidental values that add no domain semantics or type safety

```python
@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self):
        if '@' not in self.value:
            raise ValueError("Invalid email format")

    @property
    def domain(self) -> str:
        return self.value.split('@')[1]


def create_email(raw_value: str) -> Email:
    return Email(value=raw_value.strip().lower())
```
