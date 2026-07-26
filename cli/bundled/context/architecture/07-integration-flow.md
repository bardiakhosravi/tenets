<!-- tenets:generated-source -->
# Integration Flow

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

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
