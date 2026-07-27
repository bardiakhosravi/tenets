<!-- tenets:generated-source -->
# Secondary Adapters

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ADAPTER-004: Secondary adapters implement and translate port contracts

## Rule

A secondary adapter implements an inward-facing port and translates between its semantic types and one external technology or published contract.

## Rationale

Explicit translation preserves the port contract while containing external representation changes.

## Incorrect

```python
class StripeClient:
    def post(self, payload: dict) -> StripeResponse: ...
```

## Correct

```python
class StripePaymentGateway(PaymentGateway):
    def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation:
        response = self._client.authorize(_map_authorization_to_stripe(request))
        return _map_stripe_response_to_confirmation(response)
```

## Remediation

Implement the consuming port directly and add directional mapping at the adapter boundary.

## Review check

Verify the adapter's public methods exactly preserve the inward-facing contract.

## TENETS-ADAPTER-005: External models remain inside their adapters

## Rule

Vendor SDK objects, persistence models, transport schemas, serialized payloads, and technology-specific types remain private to the adapter that owns their mapping.

## Rationale

External models change for technical reasons and must not become shared application or domain contracts.

## Incorrect

```python
def authorize(self, request: PaymentAuthorization) -> StripePaymentIntent: ...
```

## Correct

```python
def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Introduce an inward-owned semantic result and map the external object before returning from the adapter.

## Review check

Search inward-facing signatures and imports for ORM, framework, protocol, and vendor-owned types.

## TENETS-ADAPTER-006: Secondary adapters translate expected technical failures

## Rule

A secondary adapter catches specific expected technical failures and translates them into failures declared beside the consuming port contract, preserving the original cause.

## Rationale

Use cases can respond to meaningful capability failures without depending on vendor exception classes.

## Incorrect

```python
payment_gateway.authorize(request)  # StripeConnectionError leaks inward.
```

## Correct

```python
try:
    return self._authorize(request)
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Define a capability-specific expected failure, catch only the corresponding technical failures, and chain the cause.

## Review check

Inspect adapter boundaries for vendor exceptions leaking inward, broad catches, and discarded causes.

## TENETS-ADAPTER-007: Repository adapters reconstruct persisted objects

## Rule

Repository adapters map persistence representations to fully hydrated domain objects through constructors and directional mappers. They never invoke new-object creation entry points.

## Rationale

Repository reads reconstruct existing lifecycle state and must not generate new identities, defaults, or creation events.

## Incorrect

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return create_order(CustomerId(row.customer_id))
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(OrderId(row.id), CustomerId(row.customer_id), OrderStatus(row.status))
```

## Remediation

Replace creation calls with explicit source-to-target mapping that supplies all persisted identity and state.

## Review check

Search repository adapters for `create_*` calls and incomplete constructor mapping.

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

## TENETS-ERROR-004: Expected outbound failures are declared beside their port

## Rule

Declare each expected outbound failure that a use case may handle beside the consuming port contract.

## Rationale

Expected failure semantics are part of the capability contract and must not be invented independently by an adapter implementation.

## Incorrect

```python
except StripeConnectionError:
    raise AdapterException()
```

## Correct

```python
class PaymentGatewayUnavailable(Exception):
    pass

class PaymentGateway(Protocol):
    def authorize(self, request: PaymentAuthorization) -> PaymentAuthorizationResult: ...
```

## Remediation

Name the expected capability failure in application or domain language and document it with the port that consumers depend upon.

## Review check

Confirm that every expected adapter failure handled inward has a precise port-owned contract type.

## TENETS-ERROR-005: Secondary adapters translate specific vendor failures

## Rule

Secondary adapters catch specific expected technical failures, raise the corresponding port-declared failures, and preserve the original cause.

## Rationale

Specific translation prevents vendor types from leaking inward while retaining diagnostic evidence and avoiding accidental conversion of programming defects.

## Incorrect

```python
except Exception:
    raise PaymentGatewayUnavailable()
```

## Correct

```python
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Catch only known vendor failures at the adapter boundary and chain each translated cause.

## Review check

Look for broad catches, swallowed causes, generic adapter failures, and vendor exceptions crossing the port.

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
