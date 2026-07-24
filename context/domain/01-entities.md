# Entity Rules

## Entity Rules
- Entities MUST have a unique identity that persists throughout their lifecycle
- Use `@dataclass(eq=False)` for mutable entities — the `eq=False` prevents Python from generating `__eq__` and `__hash__` based on all fields, which would override the identity-based equality that entities require
- Identity should be immutable once set
- Implement `__eq__` and `__hash__` based solely on identity, not attributes
- Entities MUST contain business logic as methods, not just data
- Avoid anemic domain models - entities should have behavior
- New entities MUST be created through a standalone `create_<entity>()` function in the entity's module
- Constructors accept explicit identity and state so repository adapters can hydrate existing entities without triggering creation behavior
- See **Domain Object Creation and Hydration Rules** for the complete lifecycle distinction

```python
@dataclass(eq=False)
class User:
    id: UserId
    email: Email
    name: str

    def change_email(self, new_email: Email) -> None:
        # Business logic here
        self.email = new_email


def create_user(email: Email, name: str) -> User:
    return User(
        id=UserId.generate(),
        email=email,
        name=name,
    )
```
