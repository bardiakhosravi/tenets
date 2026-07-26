---
id: TENETS-REPO-005
title: Single lookups return normal absence
kind: rule
status: stable
category: repositories
severity: error
profiles: ["core"]
related: ["TENETS-APP-002", "TENETS-REPO-004", "TENETS-REPO-006"]
aliases: []
---
## Rule

A single-result lookup returns the aggregate or `None`. The use case decides whether absence is an error for its workflow.

## Rationale

Absence is a persistence result; `OrderNotFound` is an application interpretation that varies by use case.

## Incorrect

```python
def get(self, order_id: OrderId) -> Order:
    raise OrderNotFound(order_id)
```

## Correct

```python
order = orders.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

## Remediation

Return `None` from the repository and move not-found handling into the calling use case.

## Review check

Verify that repository adapters do not raise application-level not-found failures.
