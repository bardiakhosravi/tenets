---
id: TENETS-PATTERN-009
title: Transactional consumer inbox
kind: pattern
status: stable
category: async-reliability
severity: guidance
minimum_profile: strict
applies_to: ["python"]
related: ["TENETS-EVENT-009", "TENETS-ASYNC-002", "TENETS-ASYNC-003", "TENETS-ASYNC-004", "TENETS-ASYNC-005", "TENETS-UOW-004"]
aliases: []
---
## Purpose

Make a local asynchronous consumer safely repeatable by binding message identity to its payload and committing the receipt with all local effects.

## Implementation

Use a consumer- and operation-scoped key:

```python
@dataclass(frozen=True)
class InboxReceiptKey:
    consumer_name: ConsumerName
    operation_name: OperationName
    message_id: IntegrationEventId
```

The application consumer computes a canonical payload fingerprint and performs
duplicate resolution inside the transaction:

```python
class ReserveInventoryForOrderIntegrationEventHandler:
    def __init__(
        self,
        inbox_receipt_repository: InboxReceiptRepository,
        inventory_reservation_repository: InventoryReservationRepository,
        domain_event_dispatcher: DomainEventDispatcher,
        payload_fingerprint: IntegrationEventPayloadFingerprint,
        clock: Clock,
        unit_of_work: UnitOfWork,
    ) -> None:
        self._inbox_receipt_repository = inbox_receipt_repository
        self._inventory_reservation_repository = (
            inventory_reservation_repository
        )
        self._domain_event_dispatcher = domain_event_dispatcher
        self._payload_fingerprint = payload_fingerprint
        self._clock = clock
        self._unit_of_work = unit_of_work

    def handle(
        self,
        event: OrderSubmittedIntegrationEventV1,
    ) -> ConsumerResult:
        receipt_key = InboxReceiptKey(
            consumer_name=ConsumerName("inventory"),
            operation_name=OperationName("reserve-inventory-for-order"),
            message_id=event.event_id,
        )
        payload_hash = self._payload_fingerprint.calculate(event)

        with self._unit_of_work:
            existing_receipt = (
                self._inbox_receipt_repository.get(receipt_key)
            )
            if existing_receipt is not None:
                if existing_receipt.payload_hash != payload_hash:
                    raise IdempotencyIdentityConflict(receipt_key)
                return ConsumerResult.already_completed()

            reservation = create_inventory_reservation(
                order_id=OrderReferenceId(event.order_id.value),
                requested_at=event.occurred_at,
            )
            self._inventory_reservation_repository.save(reservation)
            for domain_event in reservation.release_domain_events():
                self._domain_event_dispatcher.dispatch(domain_event)
            self._inbox_receipt_repository.add(
                InboxReceipt(
                    key=receipt_key,
                    payload_hash=payload_hash,
                    completed_at=self._clock.now(),
                )
            )
            self._unit_of_work.commit()
            return ConsumerResult.completed()
```

The synchronous domain-event handlers use an outbox adapter sharing this Unit
of Work resource, so the inbox receipt, reservation, and resulting integration
events commit or roll back together.

The database enforces uniqueness on consumer, operation, and message identity.
Concurrent duplicate attempts either observe the existing receipt or translate
the unique conflict into the same duplicate-versus-payload-conflict decision.

The primary messaging adapter acknowledges only durable completion:

```python
def consume(message: BrokerMessage) -> None:
    try:
        event = map_message_to_order_submitted_integration_event_v1(message)
        result = reserve_inventory_for_order_handler.handle(event)
    except InvalidPublishedContract:
        channel.reject(message, requeue=False)
    except IdempotencyIdentityConflict:
        channel.reject(message, requeue=False)
    except RetryableConsumerFailure:
        channel.reject(message, requeue=True)
    else:
        assert result.is_durably_complete
        channel.ack(message)
```

Retain receipts for the supported broker retry, dead-letter replay, and manual
replay window plus operational margin.

## Trade-offs

The inbox adds storage and retention management. It protects local state and
resulting outbox messages, but it cannot atomically protect external providers;
those effects need their own stable identity and recovery policy.

## Related rules

See `TENETS-ASYNC-001` through `TENETS-ASYNC-005`,
`TENETS-ASYNC-007`, and `TENETS-UOW-004`.
