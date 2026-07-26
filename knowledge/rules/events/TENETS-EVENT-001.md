---
id: TENETS-EVENT-001
title: Domain events are immutable internal records
kind: rule
status: stable
category: events
severity: error
profiles: ["core"]
related: ["TENETS-EVENT-002", "TENETS-EVENT-003"]
aliases: []
---
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
