---
id: TENETS-NAME-003
title: Use-case class names end with UseCase
kind: rule
status: stable
category: naming
severity: warning
profiles: ["core"]
related: ["TENETS-APP-001", "TENETS-NAME-001"]
aliases: []
---
## Rule

Name application use-case classes with the business capability followed by the `UseCase` suffix.

## Rationale

The suffix makes orchestration classes distinguishable from domain services, adapters, handlers, and commands wherever they appear.

## Incorrect

```python
class SubmitOrder:
    ...
```

## Correct

```python
class SubmitOrderUseCase:
    ...
```

## Remediation

Rename the class and update composition-root providers and references consistently.

## Review check

Verify that every application workflow class ends with `UseCase`.
