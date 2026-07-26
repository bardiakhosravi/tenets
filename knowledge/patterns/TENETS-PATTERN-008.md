---
id: TENETS-PATTERN-008
title: Transactional outbox and relay
kind: pattern
status: stable
category: events
severity: guidance
profiles: ["core", "python", "flask"]
related: ["TENETS-EVENT-007", "TENETS-EVENT-008", "TENETS-UOW-004", "TENETS-UOW-007", "TENETS-ASYNC-008"]
aliases: []
---
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
