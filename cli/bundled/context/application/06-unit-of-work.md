<!-- tenets:generated-source -->
# Unit of Work

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-UOW-001: The application owns the Unit of Work contract

## Rule

Define the Unit of Work as an application-owned port. Persistence adapters implement its transaction mechanics without exposing sessions, connections, cursors, ORMs, or SQL inward.

## Rationale

The use case decides when application work succeeds; infrastructure decides how the technical transaction commits, rolls back, and releases resources.

## Incorrect

```python
from sqlalchemy.orm import Session

class SubmitOrderUseCase:
    def __init__(self, session: Session) -> None: ...
```

## Correct

```python
class UnitOfWork(Protocol):
    def __enter__(self) -> Self: ...
    def commit(self) -> None: ...
    def rollback(self) -> None: ...
    def __exit__(self, exception_type, exception, traceback) -> bool: ...
```

## Remediation

Move the transaction contract into the application layer and keep driver-specific resources inside secondary adapters.

## Review check

Verify that use cases depend on an inward-owned Unit of Work abstraction and never import persistence transaction types.

## TENETS-UOW-002: One Unit of Work instance represents one transaction

## Rule

Treat each Unit of Work instance as a one-shot transaction boundary. Do not enter or reuse it after it exits.

## Rationale

One lifecycle prevents stale sessions, identity maps, and transaction state from crossing application operations.

## Incorrect

```python
with unit_of_work:
    save_order()
    unit_of_work.commit()

with unit_of_work:
    mark_event_published()
    unit_of_work.commit()
```

## Correct

```python
first_unit_of_work = unit_of_work_factory.create()
with first_unit_of_work:
    ...
    first_unit_of_work.commit()

second_unit_of_work = unit_of_work_factory.create()
with second_unit_of_work:
    ...
    second_unit_of_work.commit()
```

## Remediation

Create a fresh Unit of Work for each deliberate transaction and reject adapter reuse explicitly.

## Review check

Trace every Unit of Work instance and verify that it is entered at most once.

## TENETS-UOW-003: Successful writes require explicit commit

## Rule

A writing use case explicitly calls `commit()` after all required domain changes and transactional records succeed. An exception or clean exit without commit rolls back.

## Rationale

Explicit commit makes the application success boundary visible and makes omitted commits and early returns fail closed.

## Incorrect

```python
with self._unit_of_work:
    self._order_repository.save(order)
# Adapter commits automatically.
```

## Correct

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_outbox.add(message)
    self._unit_of_work.commit()
```

## Remediation

Disable clean-exit auto-commit, add an explicit success commit, and roll back every incomplete exit.

## Review check

Verify that every writing Unit of Work path commits exactly once only after all required transactional work.

## TENETS-UOW-004: Transaction participants share one resource without hidden dependencies

## Rule

The composition root gives every repository, outbox, and Unit of Work adapter in one transaction the same transaction-scoped resource while injecting each application port explicitly.

## Rationale

Atomicity requires shared transaction state, while explicit constructor dependencies keep orchestration visible and prevent the Unit of Work from becoming a service locator.

## Incorrect

```python
with self._unit_of_work:
    order = self._unit_of_work.repositories.orders.get(order_id)
```

## Correct

```python
session = session_factory()
SubmitOrderUseCase(
    order_repository=SqlOrderRepository(session),
    integration_event_outbox=SqlOutbox(session),
    unit_of_work=SqlUnitOfWork(session),
)
```

## Remediation

Move resource sharing into the composition root and inject every consumed port by its capability-specific name.

## Review check

Verify both that transaction participants share one resource and that use-case dependencies are not discovered through the Unit of Work.

## TENETS-UOW-005: Unit of Work adapters release transaction resources

## Rule

The Unit of Work adapter rolls back incomplete work and closes or releases its transaction-scoped resource on every exit path.

## Rationale

Commit alone does not release sessions or connections. Deterministic cleanup prevents leaks and transaction state from escaping its application boundary.

## Incorrect

```python
def __exit__(self, *args) -> bool:
    return False
```

## Correct

```python
def __exit__(self, exception_type, exception, traceback) -> bool:
    try:
        if exception is not None or not self._committed:
            self._session.rollback()
    finally:
        self._session.close()
    return False
```

## Remediation

Add rollback-on-incomplete-exit and unconditional resource cleanup, then test success and failure paths.

## Review check

Verify that commit, application failure, commit failure, and early return all release the transaction resource.

## TENETS-UOW-006: Units of Work do not orchestrate workflows

## Rule

A Unit of Work owns transaction mechanics only. It does not load aggregates, apply business rules, dispatch handlers, publish events, construct adapters, read configuration, or coordinate workflows.

## Rationale

Putting application behavior inside transaction infrastructure hides dependencies and mixes orchestration with persistence mechanics.

## Incorrect

```python
unit_of_work.submit_order_and_publish(order_id)
```

## Correct

```python
with self._unit_of_work:
    order = self._order_repository.get(command.order_id)
    order.submit(command.submitted_at)
    self._order_repository.save(order)
    self._unit_of_work.commit()
```

## Remediation

Move workflow decisions into the use case and leave only begin, commit, rollback, and cleanup in the Unit of Work adapter.

## Review check

Inspect Unit of Work methods for repository access, domain behavior, publication, handlers, construction, or configuration.

## TENETS-UOW-007: Multi-transaction workflows create fresh scoped transactions

## Rule

A workflow that deliberately crosses multiple transaction boundaries obtains a fresh Unit of Work and matching adapters for each boundary through a capability-specific factory.

## Rationale

Relays and similar workflows must not reuse closed transaction resources or hold database transactions open during external calls.

## Incorrect

```python
with self._unit_of_work:
    messages = self._outbox.claim_pending(batch_size)
with self._unit_of_work:
    self._outbox.mark_published(message.id)
```

## Correct

```python
claim_transaction = self._integration_event_relay_transaction_factory.create()
mark_transaction = self._integration_event_relay_transaction_factory.create()
```

## Remediation

Replace reusable Unit of Work instances with a narrowly named transaction factory that creates correctly shared transaction-scoped dependencies.

## Review check

Verify that every transaction in a multi-transaction workflow receives a distinct Unit of Work and resource.

## TENETS-UOW-008: Units of Work do not retry business workflows

## Rule

A Unit of Work never silently retries the complete application workflow. The use case or primary worker policy decides whether replaying business behavior is safe.

## Rationale

Transaction retries may repeat domain behavior, clocks, identifier generation, external calls, and event creation.

## Incorrect

```python
@retry_on_serialization_failure
def execute_inside_unit_of_work(callback):
    callback()
```

## Correct

```python
try:
    submit_order_use_case.execute(command)
except OrderVersionConflict:
    retry_policy.handle(command)
```

## Remediation

Remove hidden callback replay from transaction infrastructure and place explicit retry policy where the complete workflow is understood.

## Review check

Search Unit of Work adapters for retry loops, callback execution, or decorators that can replay application behavior.

## TENETS-UOW-009: Nested Units of Work are prohibited by default

## Rule

Do not nest Units of Work. Application handlers invoked inside a transaction participate through their injected ports and do not create or commit another Unit of Work.

## Rationale

Implicit nesting makes commit ownership ambiguous, and database `BEGIN` transactions generally do not provide portable nesting semantics.

## Incorrect

```python
with outer_unit_of_work:
    handler.handle(event)  # Handler opens another Unit of Work.
```

## Correct

```python
with self._unit_of_work:
    self._domain_event_dispatcher.dispatch(event)
    self._unit_of_work.commit()
```

## Remediation

Reuse transaction-participating ports in synchronous handlers. Model required savepoints as an explicit specialized capability and document the decision.

## Review check

Trace synchronous call paths inside a Unit of Work and verify that none opens or commits another Unit of Work.

## TENETS-UOW-010: Rollback failures do not mask primary failures

## Rule

When rollback fails during another application or commit failure, preserve the original failure and report the rollback failure through transaction observability. When rollback is the only failure, raise a precise inward-owned rollback failure with the driver cause.

## Rationale

Replacing the primary failure destroys the reason the transaction was abandoned, while ignoring cleanup failure hides uncertain resource state.

## Incorrect

```python
except Exception:
    session.rollback()  # A rollback error replaces the active failure.
    raise
```

## Correct

```python
try:
    session.rollback()
except Exception as rollback_error:
    transaction_observer.report_rollback_failure(
        rollback_error=rollback_error,
        primary_error=primary_error,
    )
```

## Remediation

Implement and test separate rollback paths for an active primary failure and a standalone rollback failure.

## Review check

Verify exception precedence, cause chaining, and observability when rollback itself fails.

## TENETS-UOW-011: Read resources have explicit cleanup scope

## Rule

Use an explicit Unit of Work for reads requiring a consistent multi-query snapshot. A single-operation query adapter may own and release its own short-lived resource.

## Rationale

Read-only code still consumes sessions or connections, but command-style transaction ceremony is unnecessary when one self-contained query operation can guarantee cleanup.

## Incorrect

```python
session = session_factory()
repository = SqlOrderRepository(session)
return repository.get(order_id)  # Session ownership is abandoned.
```

## Correct

```python
def get(self, order_id: OrderId) -> Order:
    with self._session_factory() as session:
        return map_order_row_to_order(session.get(OrderRow, order_id.value))
```

## Remediation

Choose either a transactionally consistent Unit of Work or a self-contained query adapter and make resource cleanup deterministic.

## Review check

Verify that every read-created session or connection has a visible owner and bounded cleanup path.

## TENETS-PATTERN-006: Python Unit of Work with SQLAlchemy or SQLite

## Purpose

Give Python use cases one explicit transaction contract while allowing SQLAlchemy or framework-free SQLite adapters to implement the same lifecycle.

## Implementation

The application owns the contract:

```python
from types import TracebackType
from typing import Protocol, Self


class UnitOfWork(Protocol):
    def __enter__(self) -> Self: ...
    def commit(self) -> None: ...
    def rollback(self) -> None: ...

    def __exit__(
        self,
        exception_type: type[BaseException] | None,
        exception: BaseException | None,
        traceback: TracebackType | None,
    ) -> bool: ...
```

Expected Unit of Work failures such as `PersistenceConstraintViolation` and
`PersistenceRollbackFailed` live beside this application port. A
`TransactionObserver` is an inward-owned observability capability used only to
report cleanup failure without replacing an active primary failure.

A use case declares repositories and the Unit of Work separately:

```python
class SubmitOrderUseCase:
    def __init__(
        self,
        order_repository: OrderRepository,
        domain_event_dispatcher: DomainEventDispatcher,
        unit_of_work: UnitOfWork,
    ) -> None:
        self._order_repository = order_repository
        self._domain_event_dispatcher = domain_event_dispatcher
        self._unit_of_work = unit_of_work

    def execute(self, command: SubmitOrderCommand) -> Order:
        with self._unit_of_work:
            order = self._order_repository.get(command.order_id)
            order.submit(command.submitted_at)
            self._order_repository.save(order)

            for event in order.release_domain_events():
                self._domain_event_dispatcher.dispatch(event)

            self._unit_of_work.commit()
            return order
```

An SQLAlchemy adapter owns the session mechanics:

```python
class SqlAlchemyUnitOfWork:
    def __init__(
        self,
        session: Session,
        transaction_observer: TransactionObserver,
    ) -> None:
        self._session = session
        self._transaction_observer = transaction_observer
        self._entered = False
        self._committed = False

    def __enter__(self) -> Self:
        if self._entered:
            raise RuntimeError("Unit of Work instances cannot be reused")
        try:
            self._session.begin()
        except Exception:
            self._session.close()
            raise
        self._entered = True
        return self

    def commit(self) -> None:
        if not self._entered or self._committed:
            raise RuntimeError("Invalid Unit of Work commit")
        try:
            self._session.commit()
        except IntegrityError as error:
            self._rollback_preserving(error)
            raise PersistenceConstraintViolation() from error
        self._committed = True

    def rollback(self) -> None:
        if not self._entered:
            raise RuntimeError("Unit of Work has not been entered")
        try:
            self._session.rollback()
        except SQLAlchemyError as error:
            raise PersistenceRollbackFailed() from error

    def _rollback_preserving(self, primary_error: BaseException) -> None:
        try:
            self._session.rollback()
        except Exception as rollback_error:
            self._transaction_observer.report_rollback_failure(
                rollback_error=rollback_error,
                primary_error=primary_error,
            )

    def __exit__(
        self,
        exception_type,
        exception,
        traceback,
    ) -> bool:
        try:
            if exception is not None:
                self._rollback_preserving(exception)
            elif not self._committed:
                self.rollback()
        finally:
            self._session.close()
        return False
```

A framework-free SQLite adapter uses explicit transaction statements. Setting
`isolation_level=None` disables `sqlite3` implicit transaction management:

```python
def create_sqlite_connection(
    database_path: Path,
) -> sqlite3.Connection:
    connection = sqlite3.connect(
        database_path,
        isolation_level=None,
    )
    connection.row_factory = sqlite3.Row
    return connection


class SqliteUnitOfWork:
    def __init__(
        self,
        connection: sqlite3.Connection,
        transaction_observer: TransactionObserver,
    ) -> None:
        self._connection = connection
        self._transaction_observer = transaction_observer
        self._entered = False
        self._committed = False

    def __enter__(self) -> Self:
        if self._entered:
            raise RuntimeError("Unit of Work instances cannot be reused")
        try:
            self._connection.execute("BEGIN")
        except Exception:
            self._connection.close()
            raise
        self._entered = True
        return self

    def commit(self) -> None:
        if not self._entered or self._committed:
            raise RuntimeError("Invalid Unit of Work commit")
        try:
            self._connection.execute("COMMIT")
        except sqlite3.IntegrityError as error:
            self._rollback_preserving(error)
            raise PersistenceConstraintViolation() from error
        self._committed = True

    def rollback(self) -> None:
        if not self._entered:
            raise RuntimeError("Unit of Work has not been entered")
        try:
            self._rollback_if_active()
        except sqlite3.Error as error:
            raise PersistenceRollbackFailed() from error

    def _rollback_if_active(self) -> None:
        if self._connection.in_transaction:
            self._connection.execute("ROLLBACK")

    def _rollback_preserving(self, primary_error: BaseException) -> None:
        try:
            self._rollback_if_active()
        except Exception as rollback_error:
            self._transaction_observer.report_rollback_failure(
                rollback_error=rollback_error,
                primary_error=primary_error,
            )

    def __exit__(
        self,
        exception_type,
        exception,
        traceback,
    ) -> bool:
        try:
            if exception is not None:
                self._rollback_preserving(exception)
            elif not self._committed:
                self.rollback()
        finally:
            self._connection.close()
        return False
```

SQLite repositories hydrate domain objects through directional mappers and
convert semantic values only inside the adapter:

```python
class SqliteOrderRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def get(self, order_id: OrderId) -> Order:
        row = self._connection.execute(
            """
            SELECT id, tenant_id, customer_id, status, submitted_at, version
            FROM orders
            WHERE id = ?
            """,
            (order_id.value,),
        ).fetchone()
        if row is None:
            raise OrderNotFound(order_id)
        return map_order_row_to_order(row)

    def save(self, order: Order) -> None:
        previous_version = order.version.previous()
        cursor = self._connection.execute(
            """
            UPDATE orders
            SET status = ?, submitted_at = ?, version = ?
            WHERE id = ? AND version = ?
            """,
            (
                order.status.value,
                order.submitted_at.isoformat(),
                order.version.value,
                order.id.value,
                previous_version.value,
            ),
        )
        if cursor.rowcount != 1:
            raise OrderVersionConflict(order.id)
```

The mapper reconstructs an existing object through its hydration constructor,
not its creation function:

```python
def map_order_row_to_order(row: sqlite3.Row) -> Order:
    submitted_at = (
        datetime.fromisoformat(row["submitted_at"])
        if row["submitted_at"] is not None
        else None
    )
    return Order(
        order_id=OrderId(row["id"]),
        tenant_id=TenantId(row["tenant_id"]),
        customer_id=CustomerId(row["customer_id"]),
        status=OrderStatus(row["status"]),
        submitted_at=submitted_at,
        version=OrderVersion(row["version"]),
    )
```

The framework-free outbox adapter shares the connection and converts semantic
values only at the persistence boundary:

```python
class SqliteIntegrationEventOutbox:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def add(self, message: IntegrationEventOutboxMessage) -> None:
        self._connection.execute(
            """
            INSERT INTO integration_event_outbox (
                id,
                event_name,
                occurred_at,
                payload
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                message.id.value,
                message.event_name.value,
                message.occurred_at.isoformat(),
                message.payload.to_json(),
            ),
        )
```

The composition root provides one resource to every transaction participant:

```python
class Container:
    def create_submit_order_use_case(self) -> SubmitOrderUseCase:
        session = self._session_factory()
        integration_event_outbox = SqlAlchemyIntegrationEventOutbox(session)
        order_submitted_domain_event_handler = (
            RecordOrderSubmittedForPublicationDomainEventHandler(
                order_submitted_integration_event_factory=(
                    self._order_submitted_integration_event_factory
                ),
                integration_event_outbox=integration_event_outbox,
            )
        )
        domain_event_dispatcher = DomainEventDispatcher(
            {
                OrderSubmittedDomainEvent: [
                    order_submitted_domain_event_handler
                ],
            }
        )
        return SubmitOrderUseCase(
            order_repository=SqlAlchemyOrderRepository(session),
            domain_event_dispatcher=domain_event_dispatcher,
            unit_of_work=SqlAlchemyUnitOfWork(
                session,
                self._transaction_observer,
            ),
        )
```

The same composition works without an ORM:

```python
def create_sqlite_submit_order_use_case(
    database_path: Path,
    order_submitted_integration_event_factory:
        OrderSubmittedIntegrationEventV1Factory,
    transaction_observer: TransactionObserver,
) -> SubmitOrderUseCase:
    connection = create_sqlite_connection(database_path)
    integration_event_outbox = SqliteIntegrationEventOutbox(connection)
    domain_event_dispatcher = DomainEventDispatcher(
        {
            OrderSubmittedDomainEvent: [
                RecordOrderSubmittedForPublicationDomainEventHandler(
                    order_submitted_integration_event_factory=(
                        order_submitted_integration_event_factory
                    ),
                    integration_event_outbox=integration_event_outbox,
                )
            ],
        }
    )
    return SubmitOrderUseCase(
        order_repository=SqliteOrderRepository(connection),
        domain_event_dispatcher=domain_event_dispatcher,
        unit_of_work=SqliteUnitOfWork(
            connection,
            transaction_observer,
        ),
    )
```

The event dispatcher and handlers are transaction-scoped because their outbox
adapter must share the same session or connection. Stateless factories, ID
generators, configuration, and clients may remain long-lived container
dependencies.

The Flask handler asks for a fresh use case per request. It maps transport input
and output but does not own commit:

```python
@orders_blueprint.post("/orders/<order_id>/submit")
def submit_order(order_id: str) -> tuple[dict[str, object], int]:
    command = map_request_to_submit_order_command(
        order_id=order_id,
        payload=request.get_json(),
    )
    use_case = current_app.extensions[
        "container"
    ].create_submit_order_use_case()
    order = use_case.execute(command)
    return map_order_to_response(order), 200
```

A fake Unit of Work verifies orchestration order. Adapter integration tests use
a real database and prove commit, rollback, shared-resource atomicity, cleanup,
non-reuse, and failure translation.

## Trade-offs

Explicit Unit of Work injection adds ceremony but makes transaction ownership,
failure behavior, and tests visible. SQLAlchemy reduces SQL mapping code;
`sqlite3` demonstrates the same architecture without an ORM. A one-shot Unit of
Work requires a specialized factory for workflows that intentionally use
several transactions.

## Related rules

See `TENETS-UOW-001` through `TENETS-UOW-011`, `TENETS-EVENT-008`, and
`TENETS-PATTERN-008`.
