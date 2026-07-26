<!-- tenets:generated-source -->
# Semantic Types at Port Boundaries

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-PORT-007: Port contracts reject naked domain primitives

## Rule

Public repository and secondary-port methods do not accept primitive strings, numbers, booleans, dictionaries, or callables when those values carry domain meaning.

## Rationale

Semantic types preserve validation, units, identity, and intent at boundaries where primitive confusion is expensive.

## Incorrect

```python
orders.get("ord-123")
gateway.authorize(1299, "USD", "acct-7")
```

## Correct

```python
orders.get(create_order_id("ord-123"))
gateway.authorize(PaymentAuthorization(amount, billing_account_id))
```

## Remediation

Introduce or reuse a domain value object, named criteria, specification, or immutable capability contract.

## Review check

Inspect public port signatures and challenge each primitive parameter that represents identity, money, quantity, status, date, or business criteria.

## TENETS-PORT-008: Ports use the smallest cohesive semantic type

## Rule

Choose the smallest cohesive type that completely expresses a capability: an aggregate, entity, value object, named criteria, specification, or immutable application-owned contract.

## Rationale

Passing an entire aggregate unnecessarily increases coupling, while exploding it into primitives loses semantics.

## Incorrect

```python
send_receipt(order_id, email, first_name, total_cents, currency)
```

## Correct

```python
send_receipt(ReceiptDelivery(order, customer, payment_confirmation))
```

## Remediation

Model the capability input around what the operation needs, preserving domain objects where their full meaning is required.

## Review check

Verify that the contract is neither an oversized aggregate dependency nor a parameter list that reconstructs a domain concept.

## TENETS-PORT-009: Port contracts exclude external representations

## Rule

Port contracts never expose ORM models, database rows, transport DTOs, vendor SDK objects, serialized records, or adapter-owned types.

## Rationale

External representations make the application depend on replaceable implementation details.

## Incorrect

```python
class OrderRepository(Protocol):
    def save(self, row: SqlAlchemyOrderModel) -> None: ...
```

## Correct

```python
class OrderRepository(Protocol):
    def save(self, order: Order) -> None: ...
```

## Remediation

Move representation mapping into the adapter and expose only inward-owned semantic types.

## Review check

Check port imports and annotations for framework, persistence, transport, or vendor packages.

## TENETS-PORT-010: Identities cross ports as value objects

## Rule

When identity alone is sufficient, pass a domain ID or local cross-context reference ID value object through the port, never its primitive representation.

## Rationale

Typed identity prevents accidental substitution and keeps ownership explicit.

## Incorrect

```python
inventory.get_availability(product_id: str)
```

## Correct

```python
inventory.get_availability(product_id: InventoryProductId)
```

## Remediation

Create the local ID value object at the primary boundary and unwrap it only inside persistence or transport mapping.

## Review check

Find primitive ID annotations on repository and secondary-port methods.

## TENETS-PATTERN-002: Semantic port contract selection

## Purpose

Choose the smallest cohesive semantic type for each inward-facing contract without defaulting to primitives or oversized aggregates.

## Implementation

Use an aggregate or entity when the capability needs its behavior or coherent state:

```python
def save(order: Order) -> None: ...
```

Use a value object for one domain concept:

```python
def get(order_id: OrderId) -> Order | None: ...
```

Use named criteria for a cohesive query:

```python
@dataclass(frozen=True)
class OrderSearchCriteria:
    customer_id: CustomerId | None = None
    status: OrderStatus | None = None

def list_matching(criteria: OrderSearchCriteria) -> Sequence[Order]: ...
```

Use an application-owned capability contract for a projection or integration result:

```python
def quote_shipping(destination: ShippingAddress, parcel: Parcel) -> ShippingQuote: ...
```

## Trade-offs

Semantic types add small definitions but prevent parameter ambiguity and representation leakage. Do not create a wrapper that has no domain or contract meaning merely to avoid every primitive.

## Related rules

See `TENETS-PORT-007` through `TENETS-PORT-010`.
