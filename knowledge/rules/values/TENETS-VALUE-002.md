---
id: TENETS-VALUE-002
title: Value objects represent semantic domain concepts
kind: rule
status: stable
category: values
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-VALUE-001", "TENETS-PORT-007", "TENETS-NAME-001"]
aliases: []
---
## Rule

Create a value object when a value has domain meaning, invariants, units, formatting, comparison rules, or behavior beyond its primitive representation.

## Rationale

Named semantic values prevent primitive confusion and centralize behavior belonging to the concept.

## Incorrect

```python
def authorize(amount: int, currency: str) -> None: ...
```

## Correct

```python
def authorize(amount: Money) -> None: ...
```

## Remediation

Replace related primitives with a cohesive domain value that owns their semantics.

## Review check

Challenge repeated primitives representing identity, money, quantity, date ranges, status, or validated text.
