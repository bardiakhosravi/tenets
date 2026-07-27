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

## TENETS-NAME-003: Use-case class names end with UseCase

## Rule

Name application use-case classes with the business capability followed by the `UseCase` suffix.

## Rationale

The suffix makes orchestration classes distinguishable from domain services, adapters, handlers, and commands wherever they appear.

## Incorrect

```python
class SubmitOrder:
    ...
```

## Correct

```python
class SubmitOrderUseCase:
    ...
```

## Remediation

Rename the class and update composition-root providers and references consistently.

## Review check

Verify that every application workflow class ends with `UseCase`.

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

## TENETS-ERROR-003: Application failures represent orchestration outcomes

## Rule

Application failures represent meaningful use-case outcomes, such as required absence or workflow rejection, rather than technical adapter failures.

## Rationale

The application layer owns how repository results and capability outcomes affect a workflow, but it must remain independent of vendor mechanics.

## Incorrect

```python
raise DatabaseRowMissing(order_id)
```

## Correct

```python
order = self._order_repository.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

## Remediation

Interpret technical-neutral port results in the use case and raise a workflow-specific application failure only when required.

## Review check

Verify that application failures describe business workflow outcomes and do not mention drivers, protocols, or vendor SDKs.

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

## TENETS-PATTERN-012: Layered Python error organization and handling

## Purpose

Keep failures owned by their architectural meaning and translate them once as
they cross secondary and primary adapter boundaries.

## Implementation

Use cohesive modules that make ownership visible:

```text
src/ordering/
  domain/
    order.py
    errors.py
    ports/
      order_repository.py
  application/
    errors.py
    ports/
      payment_gateway.py
      payment_gateway_errors.py
    use_cases/
      submit_order_use_case.py
  adapters/
    primary/flask/
      routes.py
      error_handlers.py
    secondary/stripe/
      stripe_payment_gateway.py
      errors.py
```

Small modules may colocate one precise failure with its owning concept or port.
Projects may consistently use `exceptions.py` instead of `errors.py`; ownership
matters more than the filename.

Define domain failures without outer technology:

```python
class OrderAlreadySubmitted(Exception):
    pass
```

Interpret normal repository absence in the use case:

```python
class OrderNotFound(Exception):
    def __init__(self, order_id: OrderId) -> None:
        self.order_id = order_id
        super().__init__(f"Order {order_id} was not found")


order = self._order_repository.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

Declare expected capability failures beside the port:

```python
class PaymentGatewayUnavailable(Exception):
    pass


class PaymentDeclined(Exception):
    def __init__(self, reason: PaymentDeclineReason) -> None:
        self.reason = reason
        super().__init__(str(reason))
```

Translate only specific vendor failures in the secondary adapter:

```python
def authorize(
    self,
    request: PaymentAuthorization,
) -> PaymentAuthorizationResult:
    try:
        response = self._stripe_client.authorize(
            amount=request.amount.to_minor_units(),
            currency=request.amount.currency.code,
            idempotency_key=str(request.operation_id),
        )
    except StripeConnectionError as error:
        raise PaymentGatewayUnavailable() from error

    return map_stripe_authorization_to_result(response)
```

A use case catches a failure only when it performs meaningful workflow behavior,
recovery, compensation, or translation:

```python
try:
    authorization = self._payment_gateway.authorize(payment_request)
except PaymentDeclined as error:
    order.record_payment_declined(reason=error.reason)
    self._unit_of_work.commit()
    raise OrderPaymentRejected(order.id) from error
```

Map known failures in the Flask adapter:

```python
def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(OrderNotFound)
    def handle_order_not_found(error: OrderNotFound):
        return {"code": "order_not_found"}, 404

    @app.errorhandler(OrderAlreadySubmitted)
    def handle_order_already_submitted(error: OrderAlreadySubmitted):
        return {"code": "order_already_submitted"}, 409

    @app.errorhandler(PaymentGatewayUnavailable)
    def handle_payment_gateway_unavailable(error: PaymentGatewayUnavailable):
        return {"code": "payment_temporarily_unavailable"}, 503

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Unhandled request failure")
        return {"code": "internal_error"}, 500
```

The outer handler is the one broad safety boundary. It does not expose exception
messages, SQL, vendor payloads, stack traces, or internal identifiers. Add
correlation context through the application's logging configuration.

## Trade-offs

Precise failure ownership introduces more types than a universal
`DomainException` or `AdapterException`, but each type carries actionable
meaning and avoids cross-layer coupling. Central protocol mappings reduce route
duplication, though every primary adapter must define its own mapping.

## Related rules

See `TENETS-ERROR-001` through `TENETS-ERROR-008`,
`TENETS-ADAPTER-003`, `TENETS-ADAPTER-006`, and `TENETS-REPO-005`.
