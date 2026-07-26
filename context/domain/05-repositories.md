<!-- tenets:generated-source -->
# Repositories

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-REPO-001: Repositories represent aggregate persistence

## Rule

A repository interface represents the collection and persistence needs of one aggregate root in domain language.

## Rationale

Repositories are domain-owned contracts used by application use cases, not generic database access services.

## Incorrect

```python
class DatabaseRepository(Protocol):
    def execute(self, sql: str) -> list[dict]: ...
```

## Correct

```python
class OrderRepository(Protocol):
    def get(self, order_id: OrderId) -> Order | None: ...
    def save(self, order: Order) -> None: ...
```

## Remediation

Define the contract around aggregate operations required by use cases and move query technology into an adapter.

## Review check

Verify that repository names and methods describe aggregate persistence without database terminology.

## TENETS-REPO-002: Repository writes accept aggregate roots

## Rule

Repository write methods accept complete aggregate roots. Child entities are persisted through their aggregate repository, not separate public repositories.

## Rationale

The aggregate root protects invariants and defines the persistence consistency boundary.

## Incorrect

```python
order_line_repository.save(order.line_items[0])
```

## Correct

```python
order.add_line_item(product_id, quantity, price)
order_repository.save(order)
```

## Remediation

Remove child write repositories and make the aggregate repository map and persist the complete aggregate.

## Review check

Find repositories whose public write methods accept non-root members of an aggregate.

## TENETS-REPO-003: Repository queries use semantic criteria

## Rule

Repository queries accept domain IDs, value objects, named criteria, or domain specifications. They do not accept raw dictionaries, callables, ORM expressions, or naked domain primitives.

## Rationale

Semantic criteria keep persistence mechanics out of use cases and make query intent explicit.

## Incorrect

```python
orders.search({"status": "paid"}, lambda row: row.total > 100)
```

## Correct

```python
orders.search(PaidOrdersForAccount(account_id, minimum_total))
```

## Remediation

Replace implementation-oriented parameters with an immutable named query concept.

## Review check

Inspect query signatures for dictionaries, callbacks, SQL fragments, ORM clauses, and primitive IDs.

## TENETS-REPO-004: Repository names express result semantics

## Rule

Use `get` or `get_by_*` for one result, `list_*` for bounded collections, `search` for criteria-driven collections, and `exists_by_*` for existence. Do not use `find_*`.

## Rationale

These verbs communicate expected cardinality and outcome more precisely than the ambiguous `find` convention.

## Incorrect

```python
find_user_by_email(email)
find_orders(criteria)
```

## Correct

```python
get_by_email(email)
search(criteria)
```

## Remediation

Rename the contract and every adapter implementation according to result semantics.

## Review check

Search repository interfaces and tests for methods beginning with `find`.

## TENETS-REPO-005: Single lookups return normal absence

## Rule

A single-result lookup returns the aggregate or `None`. The use case decides whether absence is an error for its workflow.

## Rationale

Absence is a persistence result; `OrderNotFound` is an application interpretation that varies by use case.

## Incorrect

```python
def get(self, order_id: OrderId) -> Order:
    raise OrderNotFound(order_id)
```

## Correct

```python
order = orders.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

## Remediation

Return `None` from the repository and move not-found handling into the calling use case.

## Review check

Verify that repository adapters do not raise application-level not-found failures.

## TENETS-REPO-006: Repositories return domain models

## Rule

Repositories return fully hydrated aggregate roots, domain read models where explicitly contracted, or absence. They never return ORM models, rows, serialized records, or untyped dictionaries.

## Rationale

Persistence representations belong to adapters and cannot safely carry domain behavior or invariants.

## Incorrect

```python
def get(self, order_id: OrderId) -> OrderRow | None: ...
```

## Correct

```python
def get(self, order_id: OrderId) -> Order | None: ...
```

## Remediation

Add adapter mapping from the persistence representation to the complete domain object.

## Review check

Inspect repository return annotations and use-case code for persistence or mapping concerns.

## TENETS-REPO-007: Repository adapters map without business rules

## Rule

A repository implementation contains persistence operations and explicit source-to-target mapping. It does not make business decisions, invoke creation entry points, or orchestrate workflows.

## Rationale

Adapters reconstruct existing state; domain behavior and application decisions belong inward.

## Incorrect

```python
return create_order(customer_id=row.customer_id)
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(id=OrderId(row.id), customer_id=CustomerId(row.customer_id), status=OrderStatus(row.status))
```

## Remediation

Move business rules inward and replace creation calls with directional mapping that invokes constructors using persisted state.

## Review check

Inspect repository adapters for `create_*` calls, business branching, and ambiguous helpers named `hydrate`.
