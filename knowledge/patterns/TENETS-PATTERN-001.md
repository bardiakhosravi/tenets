---
id: TENETS-PATTERN-001
title: Use-case-loaded outbound capability
kind: pattern
status: stable
category: ports
severity: guidance
profiles: ["core", "python"]
related: ["TENETS-PORT-005", "TENETS-PORT-006", "TENETS-PORT-011"]
aliases: []
---
## Purpose

Keep outbound capabilities focused by loading all required domain state in the use case.

## Implementation

```python
class SendOrderConfirmationUseCase:
    def __init__(
        self,
        orders: OrderRepository,
        customers: CustomerRepository,
        notifications: OrderNotificationPort,
    ) -> None:
        self._orders = orders
        self._customers = customers
        self._notifications = notifications

    def execute(self, order_id: OrderId) -> None:
        order = self._orders.get(order_id)
        customer = self._customers.get(order.customer_id)
        self._notifications.send_confirmation(order, customer)
```

The notification adapter receives complete domain information. It does not receive repositories or load more state.

## Trade-offs

The use case has explicit orchestration dependencies, but its workflow and test boundary remain visible. If the parameter set becomes incohesive, define a capability-specific domain or application value rather than passing infrastructure access.

## Related rules

See `TENETS-PORT-005`, `TENETS-PORT-006`, and `TENETS-PORT-011`.
