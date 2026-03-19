# Domain Event Rules

## Domain Event Rules
- Domain events should be immutable value objects
- Events should represent something that happened in the past (use past tense)
- Events should contain all necessary data to handle the event
- Use `@dataclass(frozen=True)` for events
- Events should be raised by aggregates, not external code
- Domain event names MUST use ubiquitous language from the business domain only — no technology-specific or external-system terms (e.g., no vendor names like "Auth0", "Clerk", "Stripe"; no infrastructure terms like "SQL", "SQS", "Lambda", "DynamoDB"). The event name should be meaningful to a domain expert who knows nothing about the implementation. For example: `UserCreated` is correct, `Auth0UserCreated` is wrong; `PaymentProcessed` is correct, `StripePaymentProcessed` is wrong.
- **Inheritance caveat**: When using a `DomainEvent` base class with a default field (e.g., `occurred_at: datetime = field(default_factory=...)`), all subclass fields MUST also have defaults. Python dataclass inheritance does not allow non-default fields to follow default fields from a parent class. Use empty-value defaults (e.g., `user_id: str = ""`) or make the base class field non-default and always pass it explicitly.

```python
@dataclass(frozen=True)
class DomainEvent:
    """Base class — has a default field."""
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

@dataclass(frozen=True)
class UserEmailChanged(DomainEvent):
    """Subclass fields MUST have defaults because parent has occurred_at with a default."""
    user_id: str = ""
    old_email: str = ""
    new_email: str = ""
```

## Event Handling Rules
- Domain event handlers should be in the application layer
- Handlers should be idempotent
- Use dependency injection for handler dependencies
- Handlers should not directly modify other aggregates
- Consider eventual consistency for cross-aggregate operations

## Event Naming and Structure Convention Rules
- Event names MUST use past tense to indicate something that already happened
- Follow the pattern: `{AggregateRoot}{WhatHappened}` (e.g., `OrderSubmitted`, `UserEmailChanged`)
- Events MUST be immutable (`@dataclass(frozen=True)`)
- Events MUST include: the aggregate ID, all relevant data needed by handlers, and a timestamp
- Events SHOULD include a unique event ID for deduplication and traceability
- Events MUST NOT contain domain objects — use primitive types or value object values only
- Version events when their schema changes (e.g., `UserCreatedV2`)

```python
@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""
    event_id: EventId
    occurred_at: datetime

@dataclass(frozen=True)
class OrderSubmitted(DomainEvent):
    order_id: str          # Primitive, not OrderId — events cross context boundaries
    customer_id: str
    total_amount_cents: int
    line_item_count: int

@dataclass(frozen=True)
class ChildEnrolledInProgram(DomainEvent):
    child_id: str
    program_id: str
    enrollment_date: str   # ISO 8601 string, not date object
    guardian_id: str

# BAD event names
class ProcessOrder(DomainEvent): ...     # Imperative — sounds like a command
class OrderEvent(DomainEvent): ...       # Too vague
class OrderData(DomainEvent): ...        # Not an event name
```
