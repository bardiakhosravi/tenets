# Validation and Error Handling Rules
- Domain validation should happen in domain objects (entities, value objects)
- Validation should be explicit and fail fast
- Input validation in application services should be minimal
- Use factory methods for complex validation scenarios
- Use **two exception hierarchies** defined in the shared kernel:
  - `DomainException` — raised by entities, value objects, and use cases for business rule violations (e.g., invalid email, entity not found, constraint violated)
  - `AdapterException` — raised by infrastructure adapters when external systems fail (e.g., database unreachable, HTTP call failed). Adapters MUST wrap infrastructure-specific errors (e.g., `asyncpg.PostgresError`) in an `AdapterException` — the domain layer should never see infrastructure error types.
- Primary adapters (controllers) should catch both hierarchies and map to appropriate responses (e.g., `DomainException` → 400/404/409, `AdapterException` → 502)

```python
class DomainException(Exception):
    """Base for all domain/business rule violations."""
    pass

class AdapterException(Exception):
    """Base for all infrastructure/adapter failures."""
    pass

class InvalidEmailError(DomainException):
    pass

class PersistenceError(AdapterException):
    pass

@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self):
        if not self._is_valid_email(self.value):
            raise InvalidEmailError(f"Invalid email: {self.value}")
```
