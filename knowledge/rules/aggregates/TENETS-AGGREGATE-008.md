---
id: TENETS-AGGREGATE-008
title: One modified aggregate per transaction is the default
kind: rule
status: stable
category: aggregates
severity: warning
profiles: ["core"]
related: ["TENETS-AGGREGATE-002", "TENETS-AGGREGATE-006", "TENETS-APP-006"]
aliases: []
---
## Rule

Modify one aggregate instance per transaction by default. Outbox, audit, and idempotency records do not count as additional aggregates. A same-context, same-resource exception requires an ADR documenting the invariant, alternatives, concurrency, and failure behavior. Cross-context or distributed multi-aggregate transactions are prohibited.

## Rationale

Small transaction boundaries reduce coupling and contention while making partial failure explicit.

## Incorrect

```python
with unit_of_work:
    order.submit()
    inventory.decrement(order.lines)
    customer.add_loyalty_points(order.total)
```

## Correct

```python
with unit_of_work:
    order.submit()
    outbox.add(OrderSubmitted.from_order(order))
# Separate consumers update Inventory and Customer Accounts.
```

## Remediation

Prefer events, reservations, process managers, or compensation. If immediate atomic consistency is genuinely required within one context and resource, record the exception in an ADR.

## Review check

Count modified aggregate instances in each transaction and require either separation or a qualifying ADR.
