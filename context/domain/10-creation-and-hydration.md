<!-- tenets:generated-source -->
# Creation and Hydration

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

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

## TENETS-LIFECYCLE-004: Creation owns creation-specific behavior

## Rule

Creation entry points own creation-time normalization, identity generation, valid defaults, initial state selection, and creation-event recording.

## Rationale

Centralizing these decisions produces consistent new objects regardless of the calling workflow.

## Incorrect

```python
order = Order(id=OrderId.generate(), status=OrderStatus.DRAFT)
order.record(OrderCreated(order.id))
```

## Correct

```python
order = create_order(customer_id, billing_address)
```

## Remediation

Move creation-only decisions from callers and constructors into the named creation entry point.

## Review check

Search use cases for identity generation, initial defaults, and creation-event construction.

## TENETS-LIFECYCLE-005: Constructors hydrate persisted state

## Rule

Repository adapters reconstruct objects by mapping persistence representations to constructors with explicit persisted identity and state. Hydration does not generate identity, apply new-object defaults, or record creation events.

## Rationale

Persisted state represents an existing lifecycle and must be reconstructed faithfully.

## Incorrect

```python
def hydrate_order(row):
    return create_order(CustomerId(row.customer_id))
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Replace creation calls and `hydrate_*` helpers with explicit `_map_<source>_to_<target>` mapping functions.

## Review check

Verify persisted identity and state are passed explicitly and mapping helpers name their direction.

## TENETS-LIFECYCLE-006: Mutation does not finish creation

## Rule

Do not create an incomplete object and immediately invoke mutation methods to apply creation data that was already available. Mutation remains valid for later business transitions or newly available information.

## Rationale

The issue is incomplete creation, not mutation itself. Domain methods should represent actual transitions after a valid object exists.

## Incorrect

```python
order = create_order(customer_id)
order.change_shipping_address(command.initial_shipping_address)
```

## Correct

```python
order = create_order(customer_id, command.initial_shipping_address)
# Later:
order.change_shipping_address(new_address)
```

## Remediation

Move initial data into the creation entry point while retaining the mutation method for later transitions.

## Review check

Review the first operations after creation and compare their inputs with the creation command.

## TENETS-PATTERN-003: Python creation and hydration entry points

## Purpose

Make first-time creation and persistence hydration visibly different operations.

## Implementation

```python
# ordering/domain/order.py
def create_order(
    order_id: OrderId,
    customer_id: CustomerId,
    shipping_address: ShippingAddress,
) -> Order:
    order = Order(
        id=order_id,
        customer_id=customer_id,
        shipping_address=shipping_address,
        status=OrderStatus.DRAFT,
    )
    order.record(OrderCreated(order_id))
    return order

# ordering/adapters/repositories/sql_order_repository.py
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(
        id=OrderId(row.id),
        customer_id=CustomerId(row.customer_id),
        shipping_address=_map_json_to_shipping_address(row.shipping_address),
        status=OrderStatus(row.status),
    )
```

Creation functions receive all available required initial data. Directional mapper helpers reconstruct persisted state through constructors without creation events or defaults.

## Trade-offs

This creates two explicit entry paths, but removes ambiguity about identity, defaults, validation, and side effects. Other languages may use named constructors or factories instead.

## Related rules

See `TENETS-LIFECYCLE-001` through `TENETS-LIFECYCLE-006`.
