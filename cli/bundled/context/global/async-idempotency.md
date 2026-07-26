<!-- tenets:generated-source -->
# Asynchronous Idempotency

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ASYNC-001: Asynchronous consumers define repeated-delivery outcomes

## Rule

For every asynchronous consumer, define how repeated delivery affects each business state change, emitted event, external effect, and operational metric.

## Rationale

Message brokers commonly redeliver. Declaring only that a handler is "idempotent" hides which observable outcomes are actually protected.

## Incorrect

```text
ReserveInventory is idempotent.
```

## Correct

```text
One reservation and one resulting outbox event per consumer operation;
duplicate-delivery metrics may increment; customer email is protected separately.
```

## Remediation

Inventory every observable effect and specify the repeated-delivery outcome for each one.

## Review check

Verify explicit duplicate behavior for local state, emitted messages, external calls, and metrics.

## TENETS-ASYNC-002: Idempotency identity is scoped to consumer and operation

## Rule

Scope asynchronous idempotency identity by logical message identity, consuming capability, and operation.

## Rationale

The same integration event may legitimately produce one independent outcome in each consumer or operation.

## Incorrect

```sql
UNIQUE (message_id)
```

## Correct

```sql
UNIQUE (consumer_name, operation_name, message_id)
```

## Remediation

Expand the receipt key to include stable consumer and operation identities.

## Review check

Verify that unrelated consumers cannot suppress each other's valid work.

## TENETS-ASYNC-003: Idempotency identity is bound to payload

## Rule

Store a canonical payload fingerprint with the idempotency identity. Reuse of the same identity with a different payload is a contract conflict, not a duplicate success.

## Rationale

Identity alone cannot distinguish legitimate redelivery from producer corruption or accidental key reuse.

## Incorrect

```python
if inbox.exists(message.id):
    return AlreadyProcessed()
```

## Correct

```python
receipt = inbox.get(key)
if receipt and receipt.payload_hash != payload_hash:
    raise IdempotencyIdentityConflict(key)
```

## Remediation

Define canonical payload serialization or selected semantic fields and persist their fingerprint with the receipt.

## Review check

Verify that same-identity, different-payload delivery is rejected and observable.

## TENETS-ASYNC-004: Local consumer effects and inbox receipts are atomic

## Rule

Atomically persist the consumer-scoped inbox receipt, local business updates, and resulting outbox records in one local transaction.

## Rationale

Separate commits allow a crash to record completion without business work or repeat business work without a receipt.

## Incorrect

```python
inbox.record(receipt)
unit_of_work.commit()
inventory.reserve(order)
```

## Correct

```python
with unit_of_work:
    inbox.add(receipt)
    inventory.save(reservation)
    outbox.add(inventory_reserved_event)
    unit_of_work.commit()
```

## Remediation

Give the inbox, business repository, outbox, and Unit of Work one shared transaction resource.

## Review check

Verify atomic visibility and rollback of the receipt, local state, and emitted publication intent.

## TENETS-ASYNC-005: Acknowledge asynchronous input after durable completion

## Rule

The primary messaging adapter acknowledges delivery only after the application transaction commits or confirms that an identical message was already completed.

## Rationale

Acknowledging before durability can permanently lose work if the process fails before commit.

## Incorrect

```python
channel.ack(message)
consumer_use_case.execute(event)
```

## Correct

```python
result = consumer_use_case.execute(event)
if result.is_durably_complete:
    channel.ack(message)
```

## Remediation

Move acknowledgement after durable application completion and map retryable, permanent, and conflict failures explicitly.

## Review check

Verify acknowledgement order for success, identical duplicate, validation failure, retryable failure, and identity conflict.

## TENETS-ASYNC-006: External effects require independent idempotency protection

## Rule

Protect each non-transactional external effect with a stable provider-supported idempotency key, reconciliation, compensation, or explicit documentation of duplicate and loss risk.

## Rationale

A local inbox transaction cannot atomically cover an email provider, payment API, or other external system.

## Incorrect

```python
payment_gateway.charge(payment)
inbox.add(receipt)
```

## Correct

```python
payment_gateway.charge(
    payment,
    idempotency_key=PaymentChargeKey.from_operation(operation_id),
)
```

## Remediation

Assign stable effect identity, use the provider's protection where available, and document reconciliation or residual risk.

## Review check

Verify independent protection and failure recovery for every external side effect.

## TENETS-ASYNC-007: Idempotency records cover the supported replay window

## Rule

Retain inbox receipts and external-effect identities for the complete supported retry, redelivery, and manual replay period plus an operational margin.

## Rationale

Deleting an idempotency record while its message can still return makes duplicate effects possible.

## Incorrect

```text
Receipts expire after 24 hours; manual replay is supported for 30 days.
```

## Correct

```text
Receipts are retained for the 30-day replay window plus a 7-day margin.
```

## Remediation

Align retention, broker redelivery, dead-letter replay, provider key windows, and operational replay policy.

## Review check

Compare every identity retention period with all supported paths by which the operation can be repeated.

## TENETS-ASYNC-008: Reliability guarantees are stated per atomic boundary

## Rule

Describe delivery and effect guarantees separately for each atomic mechanism. Do not claim end-to-end exactly-once behavior across systems that do not share one atomic boundary.

## Rationale

Outbox, broker, inbox, and external providers protect different boundaries and leave different duplicate or loss windows.

## Incorrect

```text
The order workflow is exactly once.
```

## Correct

```text
Order state and outbox recording are atomic. Publication is at least once.
Inventory state and its inbox receipt are atomic. Email duplication is governed
by the notification provider's idempotency window.
```

## Remediation

Replace broad reliability labels with guarantees and residual risks for each database, broker, consumer, and external effect.

## Review check

Verify that every reliability claim names its protected boundary and remaining failure windows.

## TENETS-PATTERN-009: Transactional consumer inbox

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

## TENETS-PATTERN-010: External-effect idempotency

## Purpose

Protect non-transactional effects such as charges, email delivery, or external API mutations when local database atomicity cannot cover the provider.

## Implementation

Derive one stable effect identity from the consumer operation rather than from
an individual delivery attempt:

```python
@dataclass(frozen=True)
class PaymentChargeKey:
    value: str

    @classmethod
    def for_order(
        cls,
        order_id: OrderReferenceId,
        payment_account_id: PaymentAccountId,
    ) -> "PaymentChargeKey":
        return cls(
            f"charge-order:{order_id.value}:{payment_account_id.value}"
        )
```

Pass that semantic key through the application-owned port:

```python
class PaymentGateway(Protocol):
    def charge(
        self,
        request: PaymentChargeRequest,
        idempotency_key: PaymentChargeKey,
    ) -> PaymentChargeResult: ...
```

The secondary adapter translates it to the provider mechanism:

```python
class AcmePaymentGateway:
    def charge(
        self,
        request: PaymentChargeRequest,
        idempotency_key: PaymentChargeKey,
    ) -> PaymentChargeResult:
        response = self._acme_payment_client.create_charge(
            amount_minor=request.amount.minor_units,
            currency=request.amount.currency.code,
            idempotency_key=idempotency_key.value,
        )
        return map_acme_charge_to_payment_charge_result(response)
```

Persist enough local operation state to reconcile an uncertain outcome:

```text
pending -> provider accepted but local completion unknown -> reconcile by key
succeeded -> return the previously accepted result
failed permanently -> reject without issuing a new effect
```

If a provider offers no idempotency support, choose and document one of:

- Query or reconcile provider state before repeating.
- Compensate a confirmed duplicate effect.
- Serialize the operation through another durable mechanism.
- Accept and document the duplicate and loss risk.

Retain the local identity for at least the provider's idempotency window and the
full supported application replay period. State guarantees independently:

```text
Billing state and its inbox receipt are atomic.
The payment provider deduplicates PaymentChargeKey for 30 days.
Reconciliation handles unknown provider outcomes during that period.
```

## Trade-offs

Provider idempotency reduces duplicate effects but does not create a distributed
transaction. Reconciliation and compensation add operational work, while
accepting residual risk may be correct only for low-impact effects.

## Related rules

See `TENETS-ASYNC-006`, `TENETS-ASYNC-007`, and `TENETS-ASYNC-008`.
