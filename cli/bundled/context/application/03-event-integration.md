<!-- tenets:generated-source -->
# Event Integration

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-EVENT-004: Application handlers select publishable occurrences

## Rule

An application domain-event handler decides whether a domain occurrence becomes an externally publishable integration event.

## Rationale

Publication is an application policy: aggregates should not know external consumers, and adapters should not decide business significance.

## Incorrect

```python
class Order:
    def submit(self):
        self._publisher.publish(OrderSubmittedIntegrationEventV1(...))
```

## Correct

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    def handle(self, event: OrderSubmittedDomainEvent) -> None:
        self._integration_event_outbox.add(
            self._order_submitted_integration_event_factory.create(event)
        )
```

## Remediation

Move publication selection into an explicitly named application domain-event handler.

## Review check

Verify that publication policy lives in the application layer and is triggered synchronously inside the owning use case transaction.

## TENETS-EVENT-005: Integration events are explicit versioned contracts

## Rule

An integration event has an explicit boundary name, stable schema, and visible version. It contains published contract values, not aggregates, ORM models, or database records.

## Rationale

Versioned contracts let producers and consumers evolve independently without exposing internal domain or persistence representation.

## Incorrect

```python
publisher.publish(order)
```

## Correct

```python
@dataclass(frozen=True)
class OrderSubmittedIntegrationEventV1:
    event_id: IntegrationEventId
    order_id: PublishedOrderId
    occurred_at: datetime
```

## Remediation

Define a versioned integration-event type and map only the stable values external consumers need.

## Review check

Verify explicit `IntegrationEventV<n>` naming, schema ownership, and absence of internal aggregate or persistence types.

## TENETS-EVENT-006: Integration-event factories own event creation

## Rule

An application-owned, event-specific factory creates each integration event, generates its identity through an explicit dependency, and preserves the source domain event's occurrence time.

## Rationale

The factory centralizes complete contract creation without forcing use cases to assemble identifiers, timestamps, or fields manually.

## Incorrect

```python
event = OrderSubmittedIntegrationEventV1(
    event_id=uuid4(),
    occurred_at=datetime.now(),
    order_id=domain_event.order_id,
)
```

## Correct

```python
event = self._order_submitted_integration_event_factory.create(domain_event)
```

## Remediation

Introduce a capability-specific integration-event factory with an injected ID generator and copy `occurred_at` from the domain event.

## Review check

Verify event-specific factory naming, complete construction, injected identity generation, and occurrence-time preservation.

## TENETS-EVENT-007: Publisher ports receive complete integration events

## Rule

An application-owned publisher port receives a complete integration event. Its messaging adapter serializes and routes that event without loading repositories or deriving missing domain state.

## Rationale

Complete semantic input keeps orchestration in the application and messaging infrastructure focused on publication.

## Incorrect

```python
publisher.publish_order_submitted(order_id)
```

## Correct

```python
class IntegrationEventPublisher(Protocol):
    def publish(
        self, event: OrderSubmittedIntegrationEventV1
    ) -> None: ...
```

## Remediation

Add missing data to the integration-event contract and remove repository access from the messaging adapter.

## Review check

Verify that publisher methods receive complete events and adapters perform no domain loading.

## TENETS-EVENT-008: Reliable state-change publication uses a transactional outbox

## Rule

Store publication intent in an outbox in the same local transaction as the state change. Direct publication requires acceptable loss, equivalent atomicity, or an ADR documenting the reliability trade-off.

## Rationale

Publishing inside a database transaction cannot atomically guarantee both database commit and broker acceptance.

## Incorrect

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_publisher.publish(event)
    self._unit_of_work.commit()
```

## Correct

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_outbox.add(event)
    self._unit_of_work.commit()
```

## Remediation

Record a complete outbox message atomically and publish it later through a relay.

## Review check

Verify same-resource atomicity for business state and outbox records and inspect every direct-publication exception.

## TENETS-EVENT-009: External events enter through primary messaging adapters

## Rule

A primary messaging adapter validates the broker envelope, deserializes the published contract, maps it to local application input, invokes one consumer capability, and acknowledges according to the durable outcome.

## Rationale

Broker types and acknowledgement mechanics are transport concerns, while business handling belongs to the application and domain.

## Incorrect

```python
def handle(message: BrokerMessage) -> None:
    inventory.reserve(message.payload["sku"])
```

## Correct

```python
event = map_message_to_order_submitted_integration_event_v1(message)
reserve_inventory_for_order_use_case.execute(event)
channel.ack(message)
```

## Remediation

Move envelope validation and acknowledgement into a primary adapter and map to a semantic application input.

## Review check

Verify that application consumers never receive broker message types and that acknowledgements follow durable outcomes.

## TENETS-NAME-004: Event handler names identify their event boundary

## Rule

End application domain-event handler classes with `DomainEventHandler` and external integration-event consumer handler classes with `IntegrationEventHandler`.

## Rationale

Explicit suffixes prevent ambiguity when internal domain events and published integration events appear in the same codebase.

## Incorrect

```python
class RecordOrderSubmitted:
    ...
```

## Correct

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    ...

class ReserveInventoryForOrderIntegrationEventHandler:
    ...
```

## Remediation

Rename handlers to include both their capability and event-boundary suffix.

## Review check

Verify that event handlers are distinguishable by name without relying on package placement.

## TENETS-NAME-005: Dependency names identify the capability they provide

## Rule

Name injected dependencies and stored fields after their specific capability or contract. Avoid ambiguous names such as `factory`, `repository`, `client`, `handler`, or `publisher`.

## Rationale

Capability-specific names keep constructors and orchestration readable when several dependencies share the same technical role.

## Incorrect

```python
self._factory = factory
self._publisher = publisher
```

## Correct

```python
self._order_submitted_integration_event_factory = (
    order_submitted_integration_event_factory
)
self._integration_event_publisher = integration_event_publisher
```

## Remediation

Rename parameters and fields to the narrow capability they implement.

## Review check

Inspect dependency variables and verify that each name remains clear without reading its type annotation.

## TENETS-PATTERN-007: Domain-to-integration event mapping

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

## TENETS-PATTERN-008: Transactional outbox and relay

## Purpose

Commit business state and publication intent atomically, then publish through bounded relay transactions without holding a database transaction open during broker calls.

## Implementation

The use case saves the aggregate and synchronously dispatches its domain events.
The publication handler writes the resulting integration event through the
outbox adapter sharing the same transaction:

```python
with self._unit_of_work:
    order = self._order_repository.get(command.order_id)
    order.submit(command.submitted_at)
    self._order_repository.save(order)

    for event in order.release_domain_events():
        self._domain_event_dispatcher.dispatch(event)

    self._unit_of_work.commit()
```

A claim-and-lease relay needs several short transactions, so it receives a
capability-specific transaction factory:

```python
@dataclass(frozen=True)
class IntegrationEventRelayTransaction:
    integration_event_outbox: IntegrationEventOutbox
    unit_of_work: UnitOfWork


class IntegrationEventRelayTransactionFactory(Protocol):
    def create(self) -> IntegrationEventRelayTransaction: ...
```

The relay commits claims, publishes outside database transactions, and marks
each accepted message through a fresh transaction:

```python
class RelayPendingIntegrationEventsUseCase:
    def __init__(
        self,
        integration_event_relay_transaction_factory:
            IntegrationEventRelayTransactionFactory,
        integration_event_publisher: IntegrationEventPublisher,
        clock: Clock,
        claim_duration: OutboxClaimDuration,
    ) -> None:
        self._integration_event_relay_transaction_factory = (
            integration_event_relay_transaction_factory
        )
        self._integration_event_publisher = integration_event_publisher
        self._clock = clock
        self._claim_duration = claim_duration

    def execute(self, batch_size: BatchSize) -> None:
        claim_transaction = (
            self._integration_event_relay_transaction_factory.create()
        )
        with claim_transaction.unit_of_work:
            messages = (
                claim_transaction.integration_event_outbox.claim_pending(
                    batch_size=batch_size,
                    claimed_until=(
                        self._clock.now() + self._claim_duration
                    ),
                )
            )
            claim_transaction.unit_of_work.commit()

        for message in messages:
            try:
                self._integration_event_publisher.publish(message.event)
            except IntegrationEventPublicationFailed as failure:
                mark_failed_transaction = (
                    self._integration_event_relay_transaction_factory.create()
                )
                with mark_failed_transaction.unit_of_work:
                    (
                        mark_failed_transaction.integration_event_outbox
                        .mark_failed(
                            message.id,
                            failed_at=self._clock.now(),
                            failure=PublicationFailure.from_exception(failure),
                        )
                    )
                    mark_failed_transaction.unit_of_work.commit()
                continue

            mark_published_transaction = (
                self._integration_event_relay_transaction_factory.create()
            )
            with mark_published_transaction.unit_of_work:
                (
                    mark_published_transaction.integration_event_outbox
                    .mark_published(
                        message.id,
                        published_at=self._clock.now(),
                    )
                )
                mark_published_transaction.unit_of_work.commit()
```

The composition root guarantees shared resources inside each transaction:

```python
class SqlAlchemyIntegrationEventRelayTransactionFactory:
    def create(self) -> IntegrationEventRelayTransaction:
        session = self._session_factory()
        return IntegrationEventRelayTransaction(
            integration_event_outbox=SqlAlchemyIntegrationEventOutbox(session),
            unit_of_work=SqlAlchemyUnitOfWork(
                session,
                self._transaction_observer,
            ),
        )
```

For modest latency and throughput, run one bounded relay batch from a Flask CLI
command under a platform scheduler:

```python
@app.cli.command("relay-integration-events")
def relay_integration_events() -> None:
    use_case = current_app.extensions[
        "container"
    ].create_relay_pending_integration_events_use_case()
    use_case.execute(BatchSize(100))
```

Use a Kubernetes `CronJob` for this scheduled form. When continuous processing
or parallel replicas are required, use a dedicated `Deployment`, durable
claims or leases, graceful shutdown, and a fresh use case per polling batch.
Never run both forms concurrently unless they share a correct claim mechanism.

The relay provides at-least-once publication. A crash after broker acceptance
but before `mark_published` causes duplicate publication. Message identity
remains stable across retries so consumers can deduplicate.

Claims record attempts and expire through a durable lease. `mark_failed`
records an observable retryable outcome without pretending that broker
acceptance is known. The next eligible claim uses the same message identity.

Direct publication is an exception only when loss is acceptable, selected
technology provides equivalent atomicity, or an ADR documents the accepted
failure behavior.

## Trade-offs

The outbox adds storage, polling, cleanup, and duplicate-delivery handling but
removes the database-versus-broker atomicity gap. A scheduled single-instance
relay is simpler; claims, leases, and parallel workers add operational
complexity only when throughput and latency justify them.

## Related rules

See `TENETS-EVENT-008`, `TENETS-UOW-002`, `TENETS-UOW-004`,
`TENETS-UOW-007`, and `TENETS-ASYNC-008`.
