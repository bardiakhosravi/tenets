---
id: TENETS-UOW-004
title: Transaction participants share one resource without hidden dependencies
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-UOW-001", "TENETS-COMPOSE-001", "TENETS-PORT-005"]
aliases: []
---
## Rule

The composition root gives every repository, outbox, and Unit of Work adapter in one transaction the same transaction-scoped resource while injecting each application port explicitly.

## Rationale

Atomicity requires shared transaction state, while explicit constructor dependencies keep orchestration visible and prevent the Unit of Work from becoming a service locator.

## Incorrect

```python
with self._unit_of_work:
    order = self._unit_of_work.repositories.orders.get(order_id)
```

## Correct

```python
session = session_factory()
SubmitOrderUseCase(
    order_repository=SqlOrderRepository(session),
    integration_event_outbox=SqlOutbox(session),
    unit_of_work=SqlUnitOfWork(session),
)
```

## Remediation

Move resource sharing into the composition root and inject every consumed port by its capability-specific name.

## Review check

Verify both that transaction participants share one resource and that use-case dependencies are not discovered through the Unit of Work.
