---
id: TENETS-UOW-001
title: The application owns the Unit of Work contract
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-DEPEND-002", "TENETS-UOW-006"]
aliases: []
---
## Rule

Define the Unit of Work as an application-owned port. Persistence adapters implement its transaction mechanics without exposing sessions, connections, cursors, ORMs, or SQL inward.

## Rationale

The use case decides when application work succeeds; infrastructure decides how the technical transaction commits, rolls back, and releases resources.

## Incorrect

```python
from sqlalchemy.orm import Session

class SubmitOrderUseCase:
    def __init__(self, session: Session) -> None: ...
```

## Correct

```python
class UnitOfWork(Protocol):
    def __enter__(self) -> Self: ...
    def commit(self) -> None: ...
    def rollback(self) -> None: ...
    def __exit__(self, exception_type, exception, traceback) -> bool: ...
```

## Remediation

Move the transaction contract into the application layer and keep driver-specific resources inside secondary adapters.

## Review check

Verify that use cases depend on an inward-owned Unit of Work abstraction and never import persistence transaction types.
