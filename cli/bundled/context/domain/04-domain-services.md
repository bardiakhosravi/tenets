<!-- tenets:generated-source -->
# Domain Services

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-SERVICE-001: Domain services hold ownerless domain behavior

## Rule

Use a domain service only for domain behavior that requires multiple concepts and does not naturally belong to one entity or value object.

## Rationale

Premature services produce procedural models, while forcing ownerless behavior onto an entity creates artificial coupling.

## Incorrect

```python
class OrderService:
    def submit(self, order: Order) -> None:
        order.status = OrderStatus.SUBMITTED
```

## Correct

```python
class PricingPolicy:
    def calculate(self, order: Order, customer_tier: CustomerTier) -> Money: ...
```

## Remediation

Move behavior to its natural entity or value object, retaining a service only when no single domain owner exists.

## Review check

For every domain service method, ask why the behavior cannot belong to one supplied domain object.

## TENETS-SERVICE-002: Domain services are pure and stateless

## Rule

Domain services operate only on supplied semantic domain data. They retain no workflow state and perform no persistence, network access, messaging, configuration lookup, or orchestration.

## Rationale

Use cases own loading and external coordination; domain services express deterministic business behavior.

## Incorrect

```python
class PricingPolicy:
    def calculate(self, order_id: OrderId) -> Money:
        order = self._orders.get(order_id)
```

## Correct

```python
class PricingPolicy:
    def calculate(self, order: Order, tier: CustomerTier) -> Money: ...
```

## Remediation

Move I/O and loading into the use case and pass the required domain objects into the service.

## Review check

Inspect domain-service constructors and methods for repositories, ports, mutable state, and external calls.

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
