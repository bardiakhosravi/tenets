---
id: TENETS-PATTERN-002
title: Semantic port contract selection
kind: pattern
status: stable
category: ports
severity: guidance
profiles: ["core"]
related: ["TENETS-PORT-007", "TENETS-PORT-008", "TENETS-PORT-009", "TENETS-PORT-010"]
aliases: []
---
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
