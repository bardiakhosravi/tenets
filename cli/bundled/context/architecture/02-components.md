<!-- tenets:generated-source -->
# Hexagonal Architecture Components

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

## TENETS-PORT-002: Port placement follows capability ownership

## Rule

Place a port in the domain when it expresses a domain-required capability. Place it in the application when it exists for orchestration, reporting, enrichment, or another application workflow concern.

## Rationale

Port ownership is determined by the consumer's language and purpose, not by the provider, protocol, or adapter technology.

## Incorrect

```text
All outbound ports are forced into domain/ports because they call external systems.
```

## Correct

```text
domain/ports/fraud_assessment.py
application/ports/customer_directory.py
```

## Remediation

Describe the capability from the consuming context's perspective, then move the contract to the layer that owns that meaning.

## Review check

Ask whether domain behavior requires the capability or whether only a use case needs it to coordinate work.

## TENETS-PORT-004: External dependencies are accessed through ports

## Rule

Application workflows access persistence, messaging, external services, clocks, identity generation, and other replaceable external capabilities through inward-owned port contracts.

## Rationale

Ports isolate business workflows from technology selection and provide explicit test boundaries.

## Incorrect

```python
response = requests.post("https://payments.example/authorize", json=payload)
```

## Correct

```python
confirmation = payment_gateway.authorize(authorization)
```

## Remediation

Define the focused capability required by the consumer, implement it in an adapter, and inject the port into the use case.

## Review check

Find direct I/O or external-library calls in domain and application code.

## TENETS-ADAPTER-001: Primary adapters invoke application capabilities

## Rule

A primary adapter receives an external interaction, translates it into an application input, invokes one primary port or use case, and returns through its protocol boundary.

## Rationale

Primary adapters drive the application without becoming the owner of its workflow.

## Incorrect

```python
@app.post("/orders")
def submit_order():
    order = create_order(...)
    orders.save(order)
```

## Correct

```python
@app.post("/orders")
def submit_order():
    order = create_submit_order().execute(map_request_to_command(request))
    return map_order_to_response(order), 201
```

## Remediation

Move workflow orchestration into a use case and leave translation and delegation in the adapter.

## Review check

Verify each entry point invokes one application capability rather than repositories or domain creation directly.

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
