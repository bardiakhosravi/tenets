# Repository Rules

## Repository Interface Rules
- Define repository interfaces in the domain layer using ABC - they represent domain concepts
- Repositories should work with Aggregate Roots only
- Use domain-specific query methods, not generic CRUD
- Return domain objects, never DTOs or database models
- Repository write methods accept aggregate roots; lookup methods accept domain IDs or value objects; flexible queries accept named domain criteria or specifications
- Repository contracts MUST NOT accept raw domain-semantic primitives, dictionaries, arbitrary tuples, callables, ORM expressions, database predicates, or adapter DTOs
- Use `get` for lookup by canonical identity, `get_by_<unique_attribute>` for lookup by another unique domain value, `list_<intent>` for collection queries, `search` for named criteria, and `exists_by_<attribute>` for existence checks
- Do not use `find_*`; deterministic repository retrieval is a lookup, not a discovery operation
- Should throw domain exceptions, not infrastructure exceptions
- Single-result lookup methods (`get`, `get_by_email`, etc.) return `None` when the aggregate is not found — absence is a normal lookup outcome, not an exception. The **use case** decides whether absence is an error and raises the appropriate domain exception (e.g., `UserNotFoundError`). Repositories never raise "not found" exceptions.
- Repository adapters hydrate existing domain objects with constructors and persisted state; they MUST NOT call domain creation functions

```python
# Domain Layer - domain/repositories/user_repository.py
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    def get(self, user_id: UserId) -> Optional[User]:
        pass

    @abstractmethod
    def get_by_email(self, email: Email) -> Optional[User]:
        pass

    @abstractmethod
    def list_active_in_department(self, department_id: DepartmentId) -> list[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> None:
        pass
```

## Repository Implementation Rules
- Implement repositories in the infrastructure layer
- Use the Unit of Work pattern for transaction management
- Map between domain objects and persistence models
- Hydrate entities, aggregates, and value objects by supplying their persisted identity and state directly to constructors
- Never generate new identities, apply creation defaults, or emit creation events while loading persisted objects
- Handle optimistic concurrency using version fields
- Repository should not contain business logic

```python
# BAD: implementation-oriented and not portable across repository adapters.
def query_where(self, predicate: Callable[[User], bool]) -> list[User]:
    ...

def search(self, filters: dict[str, object]) -> list[User]:
    ...

# GOOD: named domain intent.
def search(self, criteria: UserSearchCriteria) -> list[User]:
    ...
```

```python
class SqlUserRepository(UserRepository):
    def _hydrate(self, row: UserRow) -> User:
        return User(
            id=UserId(row.id),
            email=Email(row.email),
            name=row.name,
        )
```
