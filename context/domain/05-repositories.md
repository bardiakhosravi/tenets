# Repository Rules

## Repository Interface Rules
- Define repository interfaces in the domain layer using ABC - they represent domain concepts
- Repositories should work with Aggregate Roots only
- Use domain-specific query methods, not generic CRUD
- Return domain objects, never DTOs or database models
- Should throw domain exceptions, not infrastructure exceptions
- Query methods (`find_by_id`, `find_by_email`, etc.) return `None` when the entity is not found — absence is a normal query outcome, not an exception. The **use case** decides whether absence is an error and raises the appropriate domain exception (e.g., `UserNotFoundError`). Repositories never raise "not found" exceptions.

```python
# Domain Layer - domain/repositories/user_repository.py
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    def find_by_email(self, email: Email) -> Optional[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> None:
        pass

    @abstractmethod
    def find_active_users_in_department(self, department_id: DepartmentId) -> list[User]:
        pass

    @abstractmethod
    def find_by_id(self, user_id: UserId) -> Optional[User]:
        pass
```

## Repository Implementation Rules
- Implement repositories in the infrastructure layer
- Use the Unit of Work pattern for transaction management
- Map between domain objects and persistence models
- Handle optimistic concurrency using version fields
- Repository should not contain business logic
