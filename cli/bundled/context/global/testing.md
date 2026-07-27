<!-- tenets:generated-source -->
# Testing

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-TEST-001: Domain behavior is unit tested without infrastructure

## Rule

Test entities, aggregates, value objects, and domain services with real domain objects and without repositories, adapters, frameworks, databases, or external clients.

## Rationale

Domain tests should prove business behavior, invariants, state transitions, returned values, and recorded domain events rather than mock configuration.

## Incorrect

```python
order = Mock(spec=Order)
order.submit()
order.submit.assert_called_once()
```

## Correct

```python
order = create_order(customer_account_id=account_id, lines=lines)
order.submit()
assert order.status is OrderStatus.SUBMITTED
assert isinstance(order.recorded_events[-1], OrderSubmittedDomainEvent)
```

## Remediation

Replace mocked domain objects with production domain entry points and assert externally observable behavior.

## Review check

Verify that domain tests run without infrastructure and exercise real domain behavior.

## TENETS-TEST-002: Use cases are tested through isolated port dependencies

## Rule

Instantiate the real use case with controlled implementations of its ports and test observable orchestration, outcomes, and transaction behavior.

## Rationale

Use-case tests should prove loading, domain invocation, outbound calls, failure handling, and commit decisions without coupling to private methods or real infrastructure.

## Incorrect

```python
use_case = Mock()
use_case.execute(command)
use_case.execute.assert_called_once_with(command)
```

## Correct

```python
orders = FakeOrderRepository([order])
unit_of_work = SpyUnitOfWork()
result = SubmitOrderUseCase(orders, unit_of_work).execute(command)
assert result is order
assert orders.requested_order_ids == [command.order_id]
assert unit_of_work.commit_count == 1
```

## Remediation

Compose the real use case with small fakes, stubs, spies, or mocks that expose the behavior promised by each port.

## Review check

Confirm that each use case has isolated tests for success, expected absence or failure, and transaction outcomes.

## TENETS-TEST-003: Every secondary adapter proves its port contract

## Rule

Run reusable behavioral contract tests against every material secondary adapter implementation.

## Rationale

All implementations of a port must preserve the same semantic inputs, outputs, absence behavior, failure translation, and transaction guarantees.

## Incorrect

```text
The SQLite repository has hand-written tests.
The Postgres repository is assumed to behave the same.
```

## Correct

```python
class TestSqliteOrderRepository(OrderRepositoryContract): ...
class TestPostgresOrderRepository(OrderRepositoryContract): ...
```

## Remediation

Extract the port's promised behavior into a reusable suite and parameterize adapter setup without putting technology-specific assertions in the shared contract.

## Review check

List each material secondary adapter and verify that it runs its port contract suite plus any technology-specific tests.

## TENETS-TEST-004: Integration tests exercise complete workflows through controlled adapters

## Rule

Workflow integration tests connect a real primary adapter, use case, and domain model to selected real or controlled secondary adapters.

## Rationale

This level proves composition and boundary mappings that isolated tests cannot, while controlled external capabilities keep failures deterministic.

## Incorrect

```python
use_case = Mock()
response = submit_order_route(use_case)
assert response.status_code == 200
```

## Correct

```text
Flask test client
  -> SubmitOrderUseCase
  -> Order
  -> SQLiteOrderRepository
  -> FakePaymentGateway
```

## Remediation

Build a test composition root that preserves production port semantics and replaces only the external capabilities outside the workflow's intended scope.

## Review check

Distinguish primary-adapter unit tests from workflow integration tests and verify that critical workflows have the latter.

## TENETS-TEST-005: Tests distinguish creation from hydration entry points

## Rule

Use production `create_<domain_object>()` functions when tests need new domain objects and explicit constructors or directional repository mappers when tests need persisted state.

## Rationale

Tests that bypass creation or recreate persisted objects through creation functions can hide lifecycle defects and produce events, defaults, or identities at the wrong time.

## Incorrect

```python
loaded_order = create_order(order_id=persisted_id, status=persisted_status)
```

## Correct

```python
new_order = create_order(customer_account_id=account_id, lines=lines)
loaded_order = map_order_row_to_order_domain_object(row)
```

## Remediation

Choose the entry point from the object's lifecycle meaning and make fixtures explicit about whether they create or reconstruct state.

## Review check

Inspect domain and repository tests for creation functions used as hydration shortcuts or constructors used to bypass creation policy.

## TENETS-TEST-006: Port tests assert semantic contract values

## Rule

Tests verify that repositories and secondary ports receive and return the aggregate, entity, value object, named criteria, or capability contract required by the port.

## Rationale

Testing only call count or primitive equality allows naked domain primitives and adapter representations to leak across semantic boundaries unnoticed.

## Incorrect

```python
orders.get.assert_called_once_with("ord_123")
```

## Correct

```python
assert orders.requested_order_ids == [OrderId("ord_123")]
assert all(isinstance(value, OrderId) for value in orders.requested_order_ids)
```

## Remediation

Assert both the semantic value and its contract type at port boundaries.

## Review check

Look for port tests that accept strings, dictionaries, callables, ORM expressions, or vendor models where the contract requires domain semantics.

## TENETS-PATTERN-011: Repository port contract testing

## Purpose

Prove that every repository adapter preserves the same application-owned
contract while allowing each technology to receive additional implementation
tests.

## Implementation

Define one reusable behavioral suite around the repository port:

```python
class OrderRepositoryContract:
    def order_repository(self) -> OrderRepository:
        raise NotImplementedError

    def test_saves_and_gets_complete_aggregate(self) -> None:
        repository = self.order_repository()
        order = create_order(
            customer_account_id=CustomerAccountId("acct_456"),
            lines=[],
        )

        repository.save(order)
        loaded_order = repository.get(order.id)

        assert loaded_order is not None
        assert loaded_order.id == order.id
        assert loaded_order.customer_account_id == order.customer_account_id

    def test_get_returns_none_for_normal_absence(self) -> None:
        repository = self.order_repository()

        assert repository.get(OrderId("ord_missing")) is None
```

Run it against every implementation:

```python
class TestSqliteOrderRepository(OrderRepositoryContract):
    def order_repository(self) -> OrderRepository:
        connection = create_test_connection()
        return SqliteOrderRepository(connection=connection)


class TestPostgresOrderRepository(OrderRepositoryContract):
    def order_repository(self) -> OrderRepository:
        connection = create_postgres_test_connection()
        return PostgresOrderRepository(connection=connection)
```

The shared contract tests only the promises visible through `OrderRepository`:

- Semantic input and output types
- Complete aggregate round trips
- Normal absence
- Replacement or concurrency behavior when declared by the port
- Expected failure translation
- Transaction behavior when declared by the port

Add technology-specific supplements separately:

```python
def test_order_id_has_a_unique_database_constraint(
    connection: sqlite3.Connection,
) -> None:
    constraints = read_order_constraints(connection)

    assert "orders_order_id_unique" in constraints
```

Fixtures must isolate each test and apply the same transaction ownership used by
the adapter in production. Repository contract tests may use a real database,
an ephemeral container, or a compatible embedded database only when that choice
can prove the promised behavior.

## Trade-offs

A shared contract suite reduces behavioral drift but cannot prove
technology-specific constraints, query plans, serialization, or failure modes.
Those require adapter-specific tests. An embedded database is fast, but it does
not replace tests against the production database when dialect behavior matters.

## Related rules

See `TENETS-TEST-003`, `TENETS-TEST-005`, `TENETS-TEST-006`, and
`TENETS-REPO-005`.
