<!-- tenets:generated-source -->
# Aggregates

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-AGGREGATE-001: Every aggregate has one root

## Rule

Every aggregate has exactly one aggregate root that is the external entry point to its internal entities and values.

## Rationale

One root gives callers a single authority for preserving aggregate-wide consistency.

## Incorrect

```python
order.lines.append(OrderLine(...))
```

## Correct

```python
order.add_line(product_id, quantity, unit_price)
```

## Remediation

Select the entity owning the aggregate lifecycle as root and route internal access and mutation through it.

## Review check

Verify callers cannot obtain and mutate aggregate members independently of the root.

## TENETS-AGGREGATE-002: Aggregate boundaries define transactional invariants

## Rule

Place state in one aggregate when its invariants must be immediately consistent within the same transaction. Do not group concepts only for navigation or persistence convenience.

## Rationale

Aggregate boundaries are consistency boundaries; oversized aggregates increase contention while undersized aggregates cannot enforce required invariants.

## Incorrect

```text
Customer, every Order, and every Invoice form one aggregate because the UI shows them together.
```

## Correct

```text
Order and OrderLine share immediate total and quantity invariants; Customer is referenced by CustomerId.
```

## Remediation

Define the invariant and transaction that require the boundary, then separate merely related concepts.

## Review check

Ask which invariant requires every member to change atomically with the root.

## TENETS-AGGREGATE-003: Aggregate roots enforce internal invariants

## Rule

The aggregate root validates and performs every operation that can affect invariants spanning its internal members.

## Rationale

Individual children cannot reliably protect rules involving the aggregate as a whole.

## Incorrect

```python
order.lines.append(line)  # Bypasses duplicate-product and total rules.
```

## Correct

```python
order.add_line(product_id, quantity, unit_price)
```

## Remediation

Encapsulate internal collections and expose root behavior that enforces all affected invariants.

## Review check

Trace mutations of aggregate children and verify each originates from root behavior.

## TENETS-AGGREGATE-004: One repository persists the complete aggregate

## Rule

The aggregate root has one repository contract that persists and hydrates the complete aggregate. Internal members do not have independently callable repositories.

## Rationale

Persistence must preserve the same consistency boundary enforced by the aggregate.

## Incorrect

```python
order_repository.save(order)
order_line_repository.save_all(order.lines)
```

## Correct

```python
order_repository.save(order)
```

## Remediation

Move child mapping into the aggregate repository adapter and remove public child repositories.

## Review check

Verify one repository operation reconstructs and persists all state required by the aggregate.

## TENETS-AGGREGATE-005: Aggregates reference other aggregates by identity

## Rule

An aggregate stores references to other aggregates as domain identity value objects, not as nested aggregate instances.

## Rationale

Identity references preserve separate consistency boundaries and prevent accidental cross-aggregate mutation.

## Incorrect

```python
order.customer = customer
```

## Correct

```python
order.customer_id = CustomerReferenceId(customer.id)
```

## Remediation

Replace nested external aggregate objects with typed identities and load required state in the use case.

## Review check

Inspect aggregate fields for entities that have independent repositories or lifecycles.

## TENETS-AGGREGATE-006: Cross-aggregate workflows are coordinated outside aggregates

## Rule

Use cases, domain-event handlers, process managers, or sagas coordinate workflows involving multiple aggregates. One aggregate does not load or mutate another.

## Rationale

No aggregate owns another aggregate's lifecycle or transaction boundary.

## Incorrect

```python
order.submit_and_decrement_inventory(inventory_repository)
```

## Correct

```python
order.submit()
inventory.reserve(InventoryReservation.from_order(order))
```

## Remediation

Move cross-aggregate sequencing outward and invoke behavior independently on each loaded root.

## Review check

Inspect aggregate methods for repositories, foreign aggregate parameters, and mutation of independently persisted roots.

## TENETS-AGGREGATE-007: Concurrent aggregate writes use an explicit conflict strategy

## Rule

Where concurrent writes are possible, define an explicit strategy such as optimistic versioning, locking, a commutative operation, serialization, or conflict reconciliation.

## Rationale

Aggregate methods protect in-memory invariants but cannot by themselves prevent lost updates across concurrent transactions.

## Incorrect

```python
order = orders.get(order_id)
order.add_line(...)
orders.save(order)  # Silently overwrites a concurrent update.
```

## Correct

```python
orders.save(order, expected_version=order.version)
```

## Remediation

Identify the conflict boundary and implement and test the chosen strategy in the repository contract and adapter.

## Review check

Verify mutable aggregates with concurrent writers cannot silently overwrite committed state.

## TENETS-AGGREGATE-008: One modified aggregate per transaction is the default

## Rule

Modify one aggregate instance per transaction by default. Outbox, audit, and idempotency records do not count as additional aggregates. A same-context, same-resource exception requires an ADR documenting the invariant, alternatives, concurrency, and failure behavior. Cross-context or distributed multi-aggregate transactions are prohibited.

## Rationale

Small transaction boundaries reduce coupling and contention while making partial failure explicit.

## Incorrect

```python
with unit_of_work:
    order.submit()
    inventory.decrement(order.lines)
    customer.add_loyalty_points(order.total)
```

## Correct

```python
with unit_of_work:
    order.submit()
    outbox.add(OrderSubmitted.from_order(order))
# Separate consumers update Inventory and Customer Accounts.
```

## Remediation

Prefer events, reservations, process managers, or compensation. If immediate atomic consistency is genuinely required within one context and resource, record the exception in an ADR.

## Review check

Count modified aggregate instances in each transaction and require either separation or a qualifying ADR.

## TENETS-ENTITY-003: Entities and aggregates exclude infrastructure concepts

## Rule

An entity or aggregate never contains an infrastructure concept. Its name, attributes, properties, and methods do not refer to storage systems, databases, queues, cloud services, vendors, or how they address data, such as `s3_prefix`, `bucket`, `table_name`, `topic_arn`, or `redis_key`.

## Rationale

These terms pass import checks because they are plain strings, yet they tie the business model to a replaceable technology. Changing storage should not change an entity or require migrating its state.

## Incorrect

```python
@dataclass(eq=False)
class Invoice:
    id: InvoiceId
    customer_account_id: CustomerAccountId
    s3_prefix: str
```

Renaming the attribute to `storage_prefix` hides the word but keeps the same concept.

## Correct

```python
# billing/domain/invoice.py
@dataclass(eq=False)
class Invoice:
    id: InvoiceId
    customer_account_id: CustomerAccountId
    document: InvoiceDocument

# billing/adapters/secondary/s3_invoice_archive.py
def _map_invoice_document_to_s3_key(self, document: InvoiceDocument) -> str:
    return f"{self._prefix}/{document.invoice_id.value}/{document.file_name.value}"
```

## Remediation

Remove the attribute and let the secondary adapter derive the location from domain values and its configuration. If the location cannot be derived, the adapter stores its own record of it, keyed by domain identity.

## Review check

Search entities and aggregates for attributes and methods containing terms such as `s3`, `bucket`, `prefix`, `object_key`, `blob`, `table`, `topic`, `queue`, `arn`, `sql`, `redis`, or a vendor name, and challenge renamed equivalents such as `storage_path`.
