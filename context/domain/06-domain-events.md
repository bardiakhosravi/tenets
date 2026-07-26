<!-- tenets:generated-source -->
# Domain Events

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-EVENT-001: Domain events are immutable internal records

## Rule

A domain event is an immutable record of a completed domain occurrence, named in the bounded context's ubiquitous language and carrying its business occurrence time.

## Rationale

Events describe facts that happened and must not change after domain behavior records them.

## Incorrect

```python
class OrderSubmitted:
    status: str
```

## Correct

```python
@dataclass(frozen=True)
class OrderSubmittedDomainEvent:
    order_id: OrderId
    occurred_at: datetime
```

## Remediation

Use an immutable domain type with semantic values, a completed-occurrence name, and explicit `occurred_at`.

## Review check

Verify immutability, past-tense domain naming, semantic values, and occurrence time.

## TENETS-EVENT-002: Domain behavior records domain events

## Rule

The aggregate or domain behavior that completes a state transition records its domain event only after the transition succeeds. Repositories and adapters do not infer events from persistence changes.

## Rationale

Only domain behavior knows whether the business occurrence actually happened and which semantics it carries.

## Incorrect

```python
if order_row.status == "submitted":
    publish(OrderSubmittedDomainEvent(...))
```

## Correct

```python
def submit(self, submitted_at: datetime) -> None:
    self._status = OrderStatus.SUBMITTED
    self._domain_events.append(
        OrderSubmittedDomainEvent(self.id, submitted_at)
    )
```

## Remediation

Move event recording into the successful domain behavior and remove adapter-side inference.

## Review check

Trace each domain event to the domain state transition that records it.

## TENETS-EVENT-003: Domain events are not external contracts

## Rule

Never serialize or publish a domain event directly to external consumers. Map selected domain events to explicit integration events.

## Rationale

Domain events may evolve with the internal model, while external contracts require independently controlled schemas and compatibility.

## Incorrect

```python
broker.publish(asdict(order_submitted_domain_event))
```

## Correct

```python
integration_event = (
    self._order_submitted_integration_event_factory.create(domain_event)
)
self._integration_event_outbox.add(integration_event)
```

## Remediation

Introduce an application-owned integration event and a directional mapping factory.

## Review check

Verify that messaging adapters never accept domain-event types as published contracts.
