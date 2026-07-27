<!-- tenets:generated-source -->
# Entities

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ENTITY-001: Stable identity defines entity equality

## Rule

An entity has a stable domain identity, and equality between entities is based on that identity rather than all current attributes.

## Rationale

Entity state changes over its lifecycle while its continuity remains defined by identity.

## Incorrect

```python
@dataclass
class Order:
    id: OrderId
    status: OrderStatus
```

## Correct

```python
@dataclass(eq=False)
class Order:
    id: OrderId
    status: OrderStatus

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Order) and self.id == other.id
```

## Remediation

Introduce a domain ID and implement equality and hashing consistently from that identity.

## Review check

Verify entity equality does not change when mutable business state changes.

## TENETS-ENTITY-002: Entities own behavior and protect invariants

## Rule

Entities expose business behavior that protects their invariants. Callers do not mutate entity state directly or reconstruct its decisions procedurally.

## Rationale

Keeping behavior with state makes valid transitions consistent across workflows.

## Incorrect

```python
order.status = OrderStatus.SUBMITTED
```

## Correct

```python
order.submit()
```

## Remediation

Make state private or controlled and move transition rules into a domain method.

## Review check

Search callers for direct state assignment and duplicated conditionals governing entity transitions.

## TENETS-LIFECYCLE-001: Creation and hydration are distinct

## Rule

Creation establishes a new domain object from the business perspective. Hydration reconstructs an existing object from persisted state. They use semantically distinct entry points.

## Rationale

Creation may generate identity, defaults, and events that must never run while reconstructing existing state.

## Incorrect

```python
return create_order(customer_id=row.customer_id)
```

## Correct

```python
new_order = create_order(customer_id)
existing_order = Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Separate new-object creation from persistence mapping and identify every creation-only side effect.

## Review check

Verify that repositories do not invoke creation entry points and workflows do not directly construct new objects.

## TENETS-LIFECYCLE-002: Python creation uses module functions

## Rule

In Python, create every new entity, aggregate, and value object through a standalone `create_<domain_object>()` function in that object's module.

## Rationale

A named module function makes creation semantics explicit while leaving the constructor available for controlled reconstruction.

## Incorrect

```python
order = Order(customer_id=customer_id)
order = Order.create(customer_id)
```

## Correct

```python
order = create_order(customer_id)
```

## Remediation

Add a colocated creation function and replace direct workflow construction and class factory calls.

## Review check

Search application and domain workflow code for direct constructors or class factory methods used for new domain objects.

## TENETS-LIFECYCLE-003: Creation receives complete initial state

## Rule

A creation entry point receives every available input that belongs to the object's valid initial state.

## Rationale

Incomplete creation spreads initialization policy across callers and permits invalid intermediate objects.

## Incorrect

```python
order = create_order(customer_id)
order.set_billing_address(command.billing_address)
```

## Correct

```python
order = create_order(customer_id, billing_address)
```

## Remediation

Add already-available creation data to the creation function and construct the valid initial object atomically.

## Review check

Inspect mutations immediately following creation and determine whether their input was already available.

## TENETS-TEST-001: Domain behavior is unit tested without infrastructure

## Rule

Test entities, aggregates, value objects, and domain services with real domain objects and without repositories, adapters, frameworks, databases, or external clients.

## Rationale

Domain tests should prove business behavior, invariants, state transitions, returned values, and recorded domain events rather than mock configuration.

## Incorrect

```python
order = Mock(spec=Order)
order.submit()
order.submit.assert_called_once()
```

## Correct

```python
order = create_order(customer_account_id=account_id, lines=lines)
order.submit()
assert order.status is OrderStatus.SUBMITTED
assert isinstance(order.recorded_events[-1], OrderSubmittedDomainEvent)
```

## Remediation

Replace mocked domain objects with production domain entry points and assert externally observable behavior.

## Review check

Verify that domain tests run without infrastructure and exercise real domain behavior.

## TENETS-VALIDATE-001: Domain objects enforce domain invariants

## Rule

Entities, aggregates, and value objects enforce their own invariants explicitly on every lifecycle path where those invariants apply.

## Rationale

Domain validity must not depend on whether an object entered through HTTP, a use case, a repository mapper, or another adapter.

## Incorrect

```python
if request_body.quantity <= 0:
    raise BadRequest("quantity must be positive")
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()
```

## Remediation

Move business invariants into the domain type and retain only protocol-shape checks at the external boundary.

## Review check

Verify that every applicable creation, mutation, and hydration path passes through the domain invariant.

## TENETS-ERROR-002: Domain failures remain technology agnostic

## Rule

Domain failures express invariant and business-rule violations without framework, protocol, persistence, or vendor concepts.

## Rationale

A domain failure must carry the same ubiquitous meaning whether the workflow is invoked through HTTP, messaging, a command line, or a test.

## Incorrect

```python
raise HTTPConflict("order already submitted")
```

## Correct

```python
class OrderAlreadySubmitted(Exception):
    pass
```

## Remediation

Replace outer-layer exceptions with a domain-specific failure and map it at each primary adapter.

## Review check

Inspect domain exception imports, names, fields, and messages for transport or infrastructure vocabulary.
