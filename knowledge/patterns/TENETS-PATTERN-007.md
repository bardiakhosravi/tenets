---
id: TENETS-PATTERN-007
title: Domain-to-integration event mapping
kind: pattern
status: stable
category: events
severity: guidance
minimum_profile: strict
applies_to: ["python"]
related: ["TENETS-EVENT-001", "TENETS-EVENT-003", "TENETS-EVENT-004", "TENETS-EVENT-005", "TENETS-EVENT-006", "TENETS-NAME-004", "TENETS-NAME-005"]
aliases: []
---
## Purpose

Keep internal domain occurrences distinct from versioned external contracts while centralizing complete integration-event creation.

## Implementation

The aggregate records an immutable domain event:

```python
@dataclass(frozen=True)
class OrderSubmittedDomainEvent:
    order_id: OrderId
    tenant_id: TenantId
    customer_id: CustomerId
    occurred_at: datetime


class Order:
    def submit(self, submitted_at: datetime) -> None:
        if self._status is not OrderStatus.DRAFT:
            raise OrderCannotBeSubmitted(self.id)
        self._status = OrderStatus.SUBMITTED
        self._submitted_at = submitted_at
        self._domain_events.append(
            OrderSubmittedDomainEvent(
                order_id=self.id,
                tenant_id=self.tenant_id,
                customer_id=self.customer_id,
                occurred_at=submitted_at,
            )
        )
```

The application owns a distinct versioned contract:

```python
@dataclass(frozen=True)
class OrderSubmittedIntegrationEventV1:
    event_id: IntegrationEventId
    order_id: PublishedOrderId
    tenant_id: PublishedTenantId
    customer_id: PublishedCustomerId
    occurred_at: datetime
```

An event-specific factory generates technical identity and preserves business
occurrence time:

```python
class OrderSubmittedIntegrationEventV1Factory:
    def __init__(
        self,
        integration_event_id_generator: IntegrationEventIdGenerator,
    ) -> None:
        self._integration_event_id_generator = (
            integration_event_id_generator
        )

    def create(
        self,
        event: OrderSubmittedDomainEvent,
    ) -> OrderSubmittedIntegrationEventV1:
        return OrderSubmittedIntegrationEventV1(
            event_id=self._integration_event_id_generator.next_id(),
            order_id=PublishedOrderId(event.order_id.value),
            tenant_id=PublishedTenantId(event.tenant_id.value),
            customer_id=PublishedCustomerId(event.customer_id.value),
            occurred_at=event.occurred_at,
        )
```

An application handler selects the occurrence for publication and records the
complete integration event through the outbox port:

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    def __init__(
        self,
        order_submitted_integration_event_factory:
            OrderSubmittedIntegrationEventV1Factory,
        integration_event_outbox: IntegrationEventOutbox,
    ) -> None:
        self._order_submitted_integration_event_factory = (
            order_submitted_integration_event_factory
        )
        self._integration_event_outbox = integration_event_outbox

    def handle(self, event: OrderSubmittedDomainEvent) -> None:
        integration_event = (
            self._order_submitted_integration_event_factory.create(event)
        )
        self._integration_event_outbox.add(integration_event)
```

The handler runs synchronously inside the use case's transaction. It does not
commit, publish to a broker, load repositories, or choose wire serialization.

Use explicit wire names such as:

```text
ordering.order-submitted.v1
inventory.inventory-reserved.v1
billing.payment-authorized.v2
```

## Trade-offs

Separate event types and mapping add code, but preserve bounded-context
autonomy and allow external contracts to evolve independently. Event factories
avoid parameter assembly in use cases while adding a small application service.

## Related rules

See `TENETS-EVENT-001` through `TENETS-EVENT-007`,
`TENETS-NAME-004`, and `TENETS-NAME-005`.
