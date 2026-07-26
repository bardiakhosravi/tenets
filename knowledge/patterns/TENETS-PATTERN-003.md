---
id: TENETS-PATTERN-003
title: Python creation and hydration entry points
kind: pattern
status: stable
category: lifecycle
severity: guidance
profiles: ["python"]
related: ["TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-002", "TENETS-LIFECYCLE-003", "TENETS-LIFECYCLE-005"]
aliases: []
---
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
