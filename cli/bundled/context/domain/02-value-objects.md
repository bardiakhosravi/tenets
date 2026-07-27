<!-- tenets:generated-source -->
# Value Objects

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-VALUE-001: Value objects are immutable and use value equality

## Rule

A value object is immutable and equality is determined by its complete semantic value.

## Rationale

Value objects describe what a value is, not which individual instance it is.

## Incorrect

```python
address.city = "Toronto"
```

## Correct

```python
@dataclass(frozen=True)
class ShippingAddress:
    street: str
    city: str
    postal_code: PostalCode
```

## Remediation

Prevent mutation and replace changed values with newly created value objects.

## Review check

Verify value objects have no identity equality, mutating methods, or externally writable state.

## TENETS-VALUE-002: Value objects represent semantic domain concepts

## Rule

Create a value object when a value has domain meaning, invariants, units, formatting, comparison rules, or behavior beyond its primitive representation.

## Rationale

Named semantic values prevent primitive confusion and centralize behavior belonging to the concept.

## Incorrect

```python
def authorize(amount: int, currency: str) -> None: ...
```

## Correct

```python
def authorize(amount: Money) -> None: ...
```

## Remediation

Replace related primitives with a cohesive domain value that owns their semantics.

## Review check

Challenge repeated primitives representing identity, money, quantity, date ranges, status, or validated text.

## TENETS-VALUE-003: Value invariants apply during creation and hydration

## Rule

Invariants intrinsic to a value object are enforced whenever it is instantiated, including both new creation and persistence hydration.

## Rationale

Persisted data does not become valid merely because it already exists; invalid values must not enter the domain model.

## Incorrect

```python
postal_code = object.__new__(PostalCode)
postal_code.value = row.postal_code
```

## Correct

```python
postal_code = PostalCode(row.postal_code)
```

## Remediation

Put intrinsic validation in the value object's construction path and map corrupted persistence data to an explicit adapter failure.

## Review check

Verify repository mappers cannot bypass value-object invariants.

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
