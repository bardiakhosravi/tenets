<!-- tenets:generated-source -->
# Dependency Rules

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-DEPEND-001: Domain code is independent of frameworks and infrastructure

## Rule

Domain code depends only on the language standard library and domain-owned concepts. It does not import frameworks, ORMs, transports, vendor SDKs, configuration, application workflows, or adapter implementations.

## Rationale

The domain model must remain executable and testable without selecting infrastructure or a delivery mechanism.

## Incorrect

```python
from sqlalchemy.orm import Mapped

class Order:
    id: Mapped[str]
```

## Correct

```python
class Order:
    def __init__(self, id: OrderId, status: OrderStatus) -> None: ...
```

## Remediation

Move technical annotations and mapping into an adapter and retain only domain-owned types and behavior.

## Review check

Inspect domain imports for application, adapter, framework, persistence, transport, and vendor packages.

## TENETS-DEPEND-002: Application code depends inward and on owned ports

## Rule

Application code may depend on domain concepts and application- or domain-owned port contracts. It never imports concrete adapters, frameworks, vendor clients, or persistence implementations.

## Rationale

Use cases remain independent of replaceable delivery and infrastructure choices when dependencies are expressed as inward-owned contracts.

## Incorrect

```python
class SubmitOrderUseCase:
    def __init__(self, orders: SqlOrderRepository) -> None: ...
```

## Correct

```python
class SubmitOrderUseCase:
    def __init__(self, orders: OrderRepository) -> None: ...
```

## Remediation

Introduce or use an inward-owned port and move concrete adapter selection to the composition root.

## Review check

Inspect application imports and constructor annotations for concrete adapters or technology packages.

## TENETS-DEPEND-003: Adapters depend only on published inward-facing contracts

## Rule

Adapters may depend inward on the port contracts they call or implement, their semantic parameter and result types, and domain constructors required for repository mapping. They do not import unrelated layer internals or other adapter implementations.

## Rationale

Published contracts create deliberate dependency boundaries while internal imports and adapter-to-adapter calls create hidden coupling.

## Incorrect

```python
from ordering.application.use_cases.submit_order import SubmitOrderUseCase
from ordering.adapters.sql_order_repository import SqlOrderRepository
```

## Correct

```python
from ordering.application.ports.submit_order import SubmitOrderPort
from ordering.domain.ports.order_repository import OrderRepository
```

## Remediation

Replace internal or peer-adapter dependencies with the relevant published inward-facing contract and wire implementations externally.

## Review check

Verify adapter imports are limited to implemented or invoked contracts, their semantic types, and required mapping constructors.

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
