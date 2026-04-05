# Entity Rules

## Entity Rules
- Entities MUST have a unique identity that persists throughout their lifecycle
- Use `@dataclass(eq=False)` for mutable entities — the `eq=False` prevents Python from generating `__eq__` and `__hash__` based on all fields, which would override the identity-based equality that entities require
- Identity should be immutable once set (use `field(init=False)` for auto-generated IDs)
- Implement `__eq__` and `__hash__` based solely on identity, not attributes
- Entities MUST contain business logic as methods, not just data
- Avoid anemic domain models - entities should have behavior

```python
@dataclass(eq=False)
class User:
    id: UserId = field(init=False)
    email: Email
    name: str

    def __post_init__(self):
        if not hasattr(self, 'id'):
            self.id = UserId.generate()

    def change_email(self, new_email: Email) -> None:
        # Business logic here
        self.email = new_email
```
