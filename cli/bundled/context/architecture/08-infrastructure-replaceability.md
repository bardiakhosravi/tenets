<!-- tenets:generated-source -->
# Infrastructure Replaceability

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

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
