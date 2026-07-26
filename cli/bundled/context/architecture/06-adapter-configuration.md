<!-- tenets:generated-source -->
# Adapter Configuration

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-COMPOSE-001: Dependency wiring occurs in the composition root

## Rule

Concrete adapter selection, dependency construction, lifecycle scope, and port-to-adapter wiring occur in an outer composition root.

## Rationale

Only the composition root needs knowledge of both inward-facing contracts and their concrete implementations.

## Incorrect

```python
class SubmitOrderUseCase:
    def __init__(self) -> None:
        self._orders = SqlOrderRepository(create_engine(os.environ["DB_URL"]))
```

## Correct

```python
def create_submit_order() -> SubmitOrderUseCase:
    return SubmitOrderUseCase(orders=SqlOrderRepository(session_factory()))
```

## Remediation

Move construction and adapter selection out of use cases, domain objects, and adapters into the application bootstrap or container.

## Review check

Search inward layers for concrete adapter construction, service location, and environment-driven implementation selection.

## TENETS-COMPOSE-002: Technology configuration remains outside business logic

## Rule

Environment variables, connection settings, credentials, vendor selection, framework configuration, and deployment concerns remain in configuration and composition modules.

## Rationale

Business behavior should not change shape based on how a service is deployed or which adapter is selected.

## Incorrect

```python
if os.environ["PAYMENT_PROVIDER"] == "stripe":
    order.mark_payment_pending()
```

## Correct

```python
payment_gateway = StripePaymentGateway(settings.stripe)
submit_order = SubmitOrderUseCase(payment_gateway=payment_gateway)
```

## Remediation

Move technology and environment decisions to typed configuration and the composition root.

## Review check

Inspect domain and application code for environment access, credentials, connection strings, and vendor-selection branches.

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
