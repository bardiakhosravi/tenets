<!-- tenets:generated-source -->
# Secondary Port Data Flow

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-PORT-005: Secondary capabilities never receive repositories

## Rule

Never pass a repository to a secondary port or adapter. A non-repository secondary adapter must not construct, inject, or call repositories internally.

## Rationale

Repositories are application orchestration dependencies. Giving one to another outbound capability creates hidden loading and mixes persistence with infrastructure execution.

## Incorrect

```python
self._email_port.send_invoice(invoice, self._customer_repository)
```

## Correct

```python
customer = self._customers.get(invoice.customer_id)
self._email_port.send_invoice(customer, invoice)
```

## Remediation

Move every required load into the use case and change the port contract to accept the resulting semantic objects.

## Review check

Search secondary adapter constructors and public methods for repository parameters, imports, lookups, or service-locator access.

## TENETS-PORT-006: Use cases provide complete capability input

## Rule

A use case supplies all domain information an outbound capability needs. The secondary port does not load, discover, or derive missing domain state from persistence.

## Rationale

Complete input keeps orchestration visible and makes the port independently testable.

## Incorrect

```python
payment_gateway.capture(order.id)  # Adapter must load amount and account.
```

## Correct

```python
payment_gateway.capture(create_payment_capture(order, billing_account))
```

## Remediation

Identify missing state, load it in the use case, and add an appropriate semantic input to the port contract.

## Review check

Trace each port call and verify that its implementation can complete without querying application persistence.

## TENETS-PORT-011: Secondary ports execute rather than orchestrate

## Rule

A secondary port executes one outbound capability. It does not coordinate repositories, multiple business steps, domain transitions, or other secondary ports.

## Rationale

Workflow orchestration belongs in use cases where dependencies and transaction boundaries remain visible.

## Incorrect

```python
fulfillment.process_order(order_id)  # Loads, charges, reserves, and publishes.
```

## Correct

```python
reservation = inventory.reserve(create_inventory_reservation(order))
```

## Remediation

Move the workflow into an application use case and split infrastructure interactions into focused capability ports.

## Review check

Inspect adapters for multi-step business workflows, repository calls, or calls to unrelated adapters.

## TENETS-PATTERN-001: Use-case-loaded outbound capability

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
