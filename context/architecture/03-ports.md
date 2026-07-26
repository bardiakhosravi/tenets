<!-- tenets:generated-source -->
# Ports

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

## TENETS-PORT-003: Ports represent one focused capability

## Rule

A port contract represents one cohesive capability in ubiquitous language. It does not expose a generic client, utility surface, or multi-step workflow.

## Rationale

Focused ports isolate change and prevent infrastructure-oriented abstractions from shaping application workflows.

## Incorrect

```python
class ExternalServices(Protocol):
    def request(self, method: str, url: str, payload: dict) -> dict: ...
```

## Correct

```python
class PaymentGateway(Protocol):
    def authorize(self, payment: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Replace generic operations with the smallest business capability the consumer requires.

## Review check

Confirm that the port name and methods can be understood without knowing the selected vendor or transport.

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

## TENETS-PORT-007: Port contracts reject naked domain primitives

## Rule

Public repository and secondary-port methods do not accept primitive strings, numbers, booleans, dictionaries, or callables when those values carry domain meaning.

## Rationale

Semantic types preserve validation, units, identity, and intent at boundaries where primitive confusion is expensive.

## Incorrect

```python
orders.get("ord-123")
gateway.authorize(1299, "USD", "acct-7")
```

## Correct

```python
orders.get(create_order_id("ord-123"))
gateway.authorize(PaymentAuthorization(amount, billing_account_id))
```

## Remediation

Introduce or reuse a domain value object, named criteria, specification, or immutable capability contract.

## Review check

Inspect public port signatures and challenge each primitive parameter that represents identity, money, quantity, status, date, or business criteria.

## TENETS-PORT-008: Ports use the smallest cohesive semantic type

## Rule

Choose the smallest cohesive type that completely expresses a capability: an aggregate, entity, value object, named criteria, specification, or immutable application-owned contract.

## Rationale

Passing an entire aggregate unnecessarily increases coupling, while exploding it into primitives loses semantics.

## Incorrect

```python
send_receipt(order_id, email, first_name, total_cents, currency)
```

## Correct

```python
send_receipt(ReceiptDelivery(order, customer, payment_confirmation))
```

## Remediation

Model the capability input around what the operation needs, preserving domain objects where their full meaning is required.

## Review check

Verify that the contract is neither an oversized aggregate dependency nor a parameter list that reconstructs a domain concept.

## TENETS-PORT-009: Port contracts exclude external representations

## Rule

Port contracts never expose ORM models, database rows, transport DTOs, vendor SDK objects, serialized records, or adapter-owned types.

## Rationale

External representations make the application depend on replaceable implementation details.

## Incorrect

```python
class OrderRepository(Protocol):
    def save(self, row: SqlAlchemyOrderModel) -> None: ...
```

## Correct

```python
class OrderRepository(Protocol):
    def save(self, order: Order) -> None: ...
```

## Remediation

Move representation mapping into the adapter and expose only inward-owned semantic types.

## Review check

Check port imports and annotations for framework, persistence, transport, or vendor packages.

## TENETS-PORT-010: Identities cross ports as value objects

## Rule

When identity alone is sufficient, pass a domain ID or local cross-context reference ID value object through the port, never its primitive representation.

## Rationale

Typed identity prevents accidental substitution and keeps ownership explicit.

## Incorrect

```python
inventory.get_availability(product_id: str)
```

## Correct

```python
inventory.get_availability(product_id: InventoryProductId)
```

## Remediation

Create the local ID value object at the primary boundary and unwrap it only inside persistence or transport mapping.

## Review check

Find primitive ID annotations on repository and secondary-port methods.

## TENETS-PORT-011: Secondary ports execute rather than orchestrate

## Rule

A secondary port executes one outbound capability. It does not coordinate repositories, multiple business steps, domain transitions, or other secondary ports.

## Rationale

Workflow orchestration belongs in use cases where dependencies and transaction boundaries remain visible.

## Incorrect

```python
fulfillment.process_order(order_id)  # Loads, charges, reserves, and publishes.
```

## Correct

```python
reservation = inventory.reserve(create_inventory_reservation(order))
```

## Remediation

Move the workflow into an application use case and split infrastructure interactions into focused capability ports.

## Review check

Inspect adapters for multi-step business workflows, repository calls, or calls to unrelated adapters.

## TENETS-PATTERN-002: Semantic port contract selection

## Purpose

Choose the smallest cohesive semantic type for each inward-facing contract without defaulting to primitives or oversized aggregates.

## Implementation

Use an aggregate or entity when the capability needs its behavior or coherent state:

```python
def save(order: Order) -> None: ...
```

Use a value object for one domain concept:

```python
def get(order_id: OrderId) -> Order | None: ...
```

Use named criteria for a cohesive query:

```python
@dataclass(frozen=True)
class OrderSearchCriteria:
    customer_id: CustomerId | None = None
    status: OrderStatus | None = None

def list_matching(criteria: OrderSearchCriteria) -> Sequence[Order]: ...
```

Use an application-owned capability contract for a projection or integration result:

```python
def quote_shipping(destination: ShippingAddress, parcel: Parcel) -> ShippingQuote: ...
```

## Trade-offs

Semantic types add small definitions but prevent parameter ambiguity and representation leakage. Do not create a wrapper that has no domain or contract meaning merely to avoid every primitive.

## Related rules

See `TENETS-PORT-007` through `TENETS-PORT-010`.
