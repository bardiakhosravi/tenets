---
id: TENETS-PATTERN-011
title: Repository port contract testing
kind: pattern
status: stable
category: testing
severity: guidance
minimum_profile: pragmatic
applies_to: ["python"]
related: ["TENETS-TEST-003", "TENETS-TEST-005", "TENETS-TEST-006", "TENETS-REPO-005"]
aliases: []
---
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
