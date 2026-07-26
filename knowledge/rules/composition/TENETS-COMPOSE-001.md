---
id: TENETS-COMPOSE-001
title: Dependency wiring occurs in the composition root
kind: rule
status: stable
category: composition
severity: error
profiles: ["core"]
related: ["TENETS-COMPOSE-002", "TENETS-DEPEND-002", "TENETS-PATTERN-005"]
aliases: []
---
## Rule

Concrete adapter selection, dependency construction, lifecycle scope, and port-to-adapter wiring occur in an outer composition root.

## Rationale

Only the composition root needs knowledge of both inward-facing contracts and their concrete implementations.

## Incorrect

```python
class SubmitOrderUseCase:
    def __init__(self) -> None:
        self._orders = SqlOrderRepository(create_engine(os.environ["DB_URL"]))
```

## Correct

```python
def create_submit_order() -> SubmitOrderUseCase:
    return SubmitOrderUseCase(orders=SqlOrderRepository(session_factory()))
```

## Remediation

Move construction and adapter selection out of use cases, domain objects, and adapters into the application bootstrap or container.

## Review check

Search inward layers for concrete adapter construction, service location, and environment-driven implementation selection.
