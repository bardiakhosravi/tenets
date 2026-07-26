---
id: TENETS-AGGREGATE-004
title: One repository persists the complete aggregate
kind: rule
status: stable
category: aggregates
severity: error
profiles: ["core"]
related: ["TENETS-REPO-001", "TENETS-REPO-002", "TENETS-REPO-006"]
aliases: []
---
## Rule

The aggregate root has one repository contract that persists and hydrates the complete aggregate. Internal members do not have independently callable repositories.

## Rationale

Persistence must preserve the same consistency boundary enforced by the aggregate.

## Incorrect

```python
order_repository.save(order)
order_line_repository.save_all(order.lines)
```

## Correct

```python
order_repository.save(order)
```

## Remediation

Move child mapping into the aggregate repository adapter and remove public child repositories.

## Review check

Verify one repository operation reconstructs and persists all state required by the aggregate.
