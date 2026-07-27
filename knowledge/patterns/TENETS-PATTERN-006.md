---
id: TENETS-PATTERN-006
title: Python Unit of Work with SQLAlchemy or SQLite
kind: pattern
status: stable
category: unit-of-work
severity: guidance
minimum_profile: pragmatic
applies_to: ["python"]
related: ["TENETS-UOW-001", "TENETS-UOW-002", "TENETS-UOW-003", "TENETS-UOW-004", "TENETS-UOW-005", "TENETS-UOW-010", "TENETS-UOW-011"]
aliases: []
---
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
