---
id: TENETS-UOW-005
title: Unit of Work adapters release transaction resources
kind: rule
status: stable
category: unit-of-work
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-UOW-003", "TENETS-UOW-010"]
aliases: []
---
## Rule

The Unit of Work adapter rolls back incomplete work and closes or releases its transaction-scoped resource on every exit path.

## Rationale

Commit alone does not release sessions or connections. Deterministic cleanup prevents leaks and transaction state from escaping its application boundary.

## Incorrect

```python
def __exit__(self, *args) -> bool:
    return False
```

## Correct

```python
def __exit__(self, exception_type, exception, traceback) -> bool:
    try:
        if exception is not None or not self._committed:
            self._session.rollback()
    finally:
        self._session.close()
    return False
```

## Remediation

Add rollback-on-incomplete-exit and unconditional resource cleanup, then test success and failure paths.

## Review check

Verify that commit, application failure, commit failure, and early return all release the transaction resource.
