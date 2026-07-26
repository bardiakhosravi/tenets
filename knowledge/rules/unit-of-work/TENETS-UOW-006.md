---
id: TENETS-UOW-006
title: Units of Work do not orchestrate workflows
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-APP-001", "TENETS-UOW-001"]
aliases: []
---
## Rule

A Unit of Work owns transaction mechanics only. It does not load aggregates, apply business rules, dispatch handlers, publish events, construct adapters, read configuration, or coordinate workflows.

## Rationale

Putting application behavior inside transaction infrastructure hides dependencies and mixes orchestration with persistence mechanics.

## Incorrect

```python
unit_of_work.submit_order_and_publish(order_id)
```

## Correct

```python
with self._unit_of_work:
    order = self._order_repository.get(command.order_id)
    order.submit(command.submitted_at)
    self._order_repository.save(order)
    self._unit_of_work.commit()
```

## Remediation

Move workflow decisions into the use case and leave only begin, commit, rollback, and cleanup in the Unit of Work adapter.

## Review check

Inspect Unit of Work methods for repository access, domain behavior, publication, handlers, construction, or configuration.
