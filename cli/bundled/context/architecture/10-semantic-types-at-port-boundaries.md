# Semantic Types at Port Boundaries

## Core Rule

Public methods on repository interfaces and secondary ports MUST NOT accept naked primitives for values that have domain meaning.

A **naked domain primitive** is a `str`, `int`, `float`, `bool`, collection, dictionary, tuple, or callable used directly where the value represents a domain identity, quantity, amount, address, code, status, date range, or other named business concept.

Use the smallest cohesive type that expresses the capability:

1. An aggregate or entity when the capability genuinely requires its cohesive state or behavior.
2. A domain value object when one domain concept is sufficient.
3. An immutable, application-owned capability contract when the port needs a deliberate subset of values.
4. A domain specification or query-criteria value object when a repository needs flexible querying.

## Repository Contract Rules

- Repository write methods accept aggregate roots.
- Repository lookup methods accept domain identity or value-object types such as `UserId` or `Email`.
- Repository query methods accept named domain criteria or specification objects.
- Repository methods MUST NOT accept raw domain-semantic primitives, dictionaries, arbitrary tuples, callables, ORM expressions, database predicates, or adapter DTOs.
- Repository methods return aggregates, entities where explicitly permitted by the aggregate rules, value objects, or absence. They never return persistence rows or untyped dictionaries.

```python
# GOOD
def get(self, user_id: UserId) -> User | None: ...
def get_by_email(self, email: Email) -> User | None: ...
def search(self, criteria: UserSearchCriteria) -> list[User]: ...
def save(self, user: User) -> None: ...

# BAD
def get(self, user_id: str) -> User | None: ...
def search(self, filters: dict[str, object]) -> list[User]: ...
def query_where(self, predicate: Callable[[User], bool]) -> list[User]: ...
def query_by_sql(self, expression: ColumnElement[bool]) -> list[User]: ...
```

Arbitrary callables are especially prohibited in repository contracts. They describe an execution mechanism rather than domain intent and cannot be implemented consistently by SQL, document, HTTP, and in-memory adapters. Model the intent with a named method, domain specification, or query-criteria value object.

## Other Secondary Port Contracts

- Pass a complete aggregate or entity only when the outbound capability genuinely needs that concept's cohesive state.
- Pass a value object when the capability needs one domain concept.
- When the capability needs a deliberate subset of data, define an immutable application-owned contract beside the port.
- Application-owned capability contracts MUST use domain value objects for fields with domain meaning.
- Do not replace a meaningful contract with a parameter list of primitives.
- Do not pass a full aggregate merely to avoid defining a focused capability contract when the capability needs only a small, stable subset.

```python
@dataclass(frozen=True)
class WelcomeEmail:
    recipient: Email
    display_name: str  # Incidental presentation text with no domain behavior.


class EmailNotificationPort(ABC):
    @abstractmethod
    def send_welcome_email(self, message: WelcomeEmail) -> None:
        pass
```

An application-owned capability contract is part of the inward-facing port API. It is not an HTTP request model, persistence model, vendor SDK object, or adapter-specific DTO.

## Identity Rules

- Within a bounded context, identities crossing repository or secondary-port contracts use domain ID value objects.
- A consuming bounded context represents an external entity's identity with its own local reference ID value object.
- Do not import the owning context's ID type into the consuming context.
- Primitive IDs are allowed only in serialized transport, integration-event, persistence, and external-system representations. Adapters convert between those primitives and the local ID value objects.

## Where Primitives Are Allowed

Primitives are expected at the system's outer edges and inside adapter implementation details:

- Primary-adapter request and response DTOs
- Serialized integration events and external API payloads
- Persistence rows, ORM models, and database query parameters
- Adapter configuration and constructor dependencies
- Private adapter mapping helpers
- Genuinely technical values that carry no domain meaning
- Incidental fields inside a named capability contract when introducing a value object would add no semantics, validation, units, or type safety

These exceptions do not permit naked domain primitives in public repository or secondary-port methods.

## Conversion Responsibility

- Primary adapters translate external primitives into application commands.
- The application layer creates any required value objects before invoking repositories or secondary ports.
- Secondary adapters unwrap domain and application contract values into external primitives.
- Repository adapters hydrate domain objects from persisted primitives.
- Public adapter methods exactly implement their port contracts; adapter constructors and private helpers are not subject to domain-method parameter rules.

## Value Object Decision Test

Create a value object when a primitive has one or more of these characteristics:

- Domain-specific meaning or ubiquitous-language name
- Validation or normalization rules
- Units, ranges, formatting, or precision requirements
- Identity semantics
- Risk of being confused with another value of the same primitive type
- Domain behavior or operations

Do not create wrapper types for values that have no domain meaning or behavior solely to eliminate every primitive from the codebase.

## Review Checklist

- Do public repository methods use aggregate roots, domain IDs, value objects, or named query criteria?
- Are arbitrary callables, dictionaries, ORM expressions, and raw domain primitives absent from repository contracts?
- Do repository method names use `get`, `get_by_*`, `list_*`, `search`, or `exists_by_*` according to result semantics, without `find_*`?
- Does each secondary port use the smallest cohesive domain type or capability contract?
- Do application-owned contracts use value objects for domain-semantic fields?
- Are primitive IDs confined to serialization, persistence, or external-system mapping?
- Are adapters responsible for unwrapping and hydrating at external boundaries?
