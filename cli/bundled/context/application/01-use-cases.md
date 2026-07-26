<!-- tenets:generated-source -->
# Use Cases

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-PORT-001: Use cases embody primary ports

## Rule

A use case implements or directly embodies the primary port. Primary adapters invoke that application capability. A separate interface is optional and must exist only when it provides a useful contract.

## Rationale

The application owns its inbound API. Making an HTTP controller implement the primary port reverses the dependency and obscures the use case.

## Incorrect

```python
class CreateOrderHttpController(CreateOrderPort):
    ...
```

## Correct

```python
class CreateOrderUseCase:
    def execute(self, command: CreateOrderCommand) -> Order:
        ...
```

## Remediation

Move the primary-port behavior into the application use case and make the adapter translate and delegate.

## Review check

Verify that each primary adapter invokes an application-owned use case contract and does not implement the business capability itself.

## TENETS-APP-001: One use case represents one workflow

## Rule

A use case represents one named business workflow and exposes one clear application entry point.

## Rationale

Focused use cases remain understandable, independently testable, and aligned with business language.

## Incorrect

```python
class OrderService:
    def create_update_cancel_and_report(self, payload): ...
```

## Correct

```python
class SubmitOrderUseCase:
    def execute(self, command: SubmitOrderCommand) -> Order: ...
```

## Remediation

Split unrelated workflows into separately named use cases and primary-port contracts.

## Review check

Verify that a use case name, input, dependencies, and transaction all serve one business outcome.

## TENETS-APP-002: Use cases orchestrate domain behavior

## Rule

Use cases load state, coordinate dependencies and transactions, invoke domain behavior, and interpret workflow outcomes. Domain invariants and business calculations remain in domain objects or domain services.

## Rationale

Application orchestration changes for workflow reasons; domain rules change for business reasons.

## Incorrect

```python
if order.total.amount > Decimal("1000"):
    order.discount = Decimal("0.10")
```

## Correct

```python
order.apply_eligible_discount(customer_tier)
```

## Remediation

Move the business decision into the domain concept that owns the invariant and leave only coordination in the use case.

## Review check

Look for calculations, state assignments, and business conditionals in use cases.

## TENETS-APP-003: Use cases load outbound capability state

## Rule

The use case loads every aggregate, entity, or value required by a secondary capability before invoking that port.

## Rationale

Loading is workflow orchestration. Keeping it in the use case prevents hidden persistence access in secondary adapters.

## Incorrect

```python
receipt_sender.send(order.id)
```

## Correct

```python
customer = customers.get(order.customer_id)
payment = payments.get_by_order(order.id)
receipt_sender.send(ReceiptDelivery(order, customer, payment))
```

## Remediation

Move adapter-side lookups into the use case and provide complete semantic input.

## Review check

Trace outbound calls and verify that adapters receive no identifiers that they use to load additional domain state.

## TENETS-APP-004: Use cases distinguish creation from hydration

## Rule

Use cases call the domain creation entry point for new objects and treat repository results as already hydrated existing objects.

## Rationale

Recreating a loaded object can generate a new identity, reset persisted state, and emit false creation events.

## Incorrect

```python
loaded = orders.get(command.order_id)
order = create_order(loaded.customer_id)
```

## Correct

```python
order = orders.get(command.order_id)
order.submit()
```

## Remediation

Remove recreation of repository results and invoke behavior directly on the hydrated aggregate.

## Review check

Find creation-function calls whose inputs come from objects just returned by repositories.

## TENETS-APP-005: Use cases create semantic boundary types

## Rule

Before calling a repository or secondary port, a use case converts command primitives into domain IDs, value objects, named criteria, specifications, or cohesive capability contracts.

## Rationale

External primitives are acceptable at transport boundaries but not at semantic inward-facing contracts.

## Incorrect

```python
order = orders.get(command.order_id)  # raw string
```

## Correct

```python
order_id = create_order_id(command.order_id)
order = orders.get(order_id)
```

## Remediation

Perform semantic conversion at the application boundary before the first repository or secondary-port call.

## Review check

Follow command fields into outbound calls and flag raw domain-semantic primitives.

## TENETS-APP-006: Use cases own transaction coordination

## Rule

Application use cases define transaction scope and coordinate domain-event handling, outbox writes, and outbound capability timing. Domain objects and adapters do not own the business transaction.

## Rationale

The application layer knows the workflow boundary and can coordinate persistence without coupling domain behavior to infrastructure.

## Incorrect

```python
class SqlOrderRepository:
    def save_and_publish_and_charge(self, order): ...
```

## Correct

```python
with unit_of_work:
    orders.save(order)
    outbox.add_from(order.domain_events)
```

## Remediation

Move transaction and workflow coordination into the use case or application handler.

## Review check

Locate commits, event publication, and multi-capability sequencing and verify that the application owns them.

## TENETS-APP-007: Use cases return meaningful inward-owned results

## Rule

A use case returns the simplest meaningful contract: `None`, a domain object, or an immutable application-owned result. It never returns persistence models, adapter DTOs, framework types, or unstructured dictionaries.

## Rationale

A single natural domain result needs no wrapper; projections and combined outcomes benefit from a stable application result.

## Incorrect

```python
return CreateOrderResult(order=order)  # Wrapper adds no boundary.
return jsonify(order_row)
```

## Correct

```python
return order
return OrderAccountSummary(order.id, balance, shipment_count)
```

## Remediation

Return the domain object directly when it is the natural result, or define an immutable application result for a genuine projection.

## Review check

Verify result ownership and challenge wrappers that contain only one domain object without adding meaning.

## TENETS-PATTERN-005: Flask request-scoped use-case factory

## Purpose

Create a fresh use-case instance and its transaction resources for each Flask request without introducing an unnecessary provider abstraction.

## Implementation

```python
class Container:
    def create_submit_order(self) -> SubmitOrderUseCase:
        session = self._session_factory()
        return SubmitOrderUseCase(
            orders=SqlOrderRepository(session),
            unit_of_work=SqlUnitOfWork(session),
        )

def create_app(container: Container) -> Flask:
    app = Flask(__name__)

    @app.post("/orders")
    def submit_order():
        command = SubmitOrderCommand.from_json(request.get_json())
        order = container.create_submit_order().execute(command)
        return jsonify(map_order_to_response(order)), 201

    return app
```

The bound container method is the factory. A separate `CreateSubmitOrderProvider` alias is unnecessary unless it provides independent value.

## Trade-offs

Per-request construction allocates small objects but avoids accidental mutable or transaction state sharing. Long-lived stateless clients and configuration may still be shared by the container.

## Related rules

See `TENETS-PORT-001`, `TENETS-APP-001`, and `TENETS-APP-002`.
