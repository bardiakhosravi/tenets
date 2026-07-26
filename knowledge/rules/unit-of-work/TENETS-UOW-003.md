---
id: TENETS-UOW-003
title: Successful writes require explicit commit
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-UOW-002", "TENETS-UOW-005"]
aliases: []
---
## Rule

A writing use case explicitly calls `commit()` after all required domain changes and transactional records succeed. An exception or clean exit without commit rolls back.

## Rationale

Explicit commit makes the application success boundary visible and makes omitted commits and early returns fail closed.

## Incorrect

```python
with self._unit_of_work:
    self._order_repository.save(order)
# Adapter commits automatically.
```

## Correct

```python
with self._unit_of_work:
    self._order_repository.save(order)
    self._integration_event_outbox.add(message)
    self._unit_of_work.commit()
```

## Remediation

Disable clean-exit auto-commit, add an explicit success commit, and roll back every incomplete exit.

## Review check

Verify that every writing Unit of Work path commits exactly once only after all required transactional work.
