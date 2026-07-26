---
id: TENETS-UOW-011
title: Read resources have explicit cleanup scope
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-UOW-005", "TENETS-REPO-003"]
aliases: []
---
## Rule

Use an explicit Unit of Work for reads requiring a consistent multi-query snapshot. A single-operation query adapter may own and release its own short-lived resource.

## Rationale

Read-only code still consumes sessions or connections, but command-style transaction ceremony is unnecessary when one self-contained query operation can guarantee cleanup.

## Incorrect

```python
session = session_factory()
repository = SqlOrderRepository(session)
return repository.get(order_id)  # Session ownership is abandoned.
```

## Correct

```python
def get(self, order_id: OrderId) -> Order:
    with self._session_factory() as session:
        return map_order_row_to_order(session.get(OrderRow, order_id.value))
```

## Remediation

Choose either a transactionally consistent Unit of Work or a self-contained query adapter and make resource cleanup deterministic.

## Review check

Verify that every read-created session or connection has a visible owner and bounded cleanup path.
