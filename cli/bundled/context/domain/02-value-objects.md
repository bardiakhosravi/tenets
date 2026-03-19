# Value Object Rules

## Value Object Rules
- Value objects MUST be immutable - use `@dataclass(frozen=True)`
- Equality is based on ALL attributes, not identity
- Should be small, focused, and represent a concept from the domain
- Include validation in `__post_init__` method
- Should have meaningful methods that operate on the value

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
```
