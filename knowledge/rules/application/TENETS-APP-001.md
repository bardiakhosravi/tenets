---
id: TENETS-APP-001
title: One use case represents one workflow
kind: rule
status: stable
category: application
severity: error
profiles: ["core"]
related: ["TENETS-APP-002", "TENETS-PORT-001"]
aliases: []
---
## Rule

A use case represents one named business workflow and exposes one clear application entry point.

## Rationale

Focused use cases remain understandable, independently testable, and aligned with business language.

## Incorrect

```python
class OrderService:
    def create_update_cancel_and_report(self, payload): ...
```

## Correct

```python
class SubmitOrderUseCase:
    def execute(self, command: SubmitOrderCommand) -> Order: ...
```

## Remediation

Split unrelated workflows into separately named use cases and primary-port contracts.

## Review check

Verify that a use case name, input, dependencies, and transaction all serve one business outcome.
