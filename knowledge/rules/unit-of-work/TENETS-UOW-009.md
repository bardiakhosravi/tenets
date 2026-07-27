---
id: TENETS-UOW-009
title: Nested Units of Work are prohibited by default
kind: rule
status: stable
category: unit-of-work
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-UOW-002", "TENETS-UOW-006"]
aliases: []
---
## Rule

Do not nest Units of Work. Application handlers invoked inside a transaction participate through their injected ports and do not create or commit another Unit of Work.

## Rationale

Implicit nesting makes commit ownership ambiguous, and database `BEGIN` transactions generally do not provide portable nesting semantics.

## Incorrect

```python
with outer_unit_of_work:
    handler.handle(event)  # Handler opens another Unit of Work.
```

## Correct

```python
with self._unit_of_work:
    self._domain_event_dispatcher.dispatch(event)
    self._unit_of_work.commit()
```

## Remediation

Reuse transaction-participating ports in synchronous handlers. Model required savepoints as an explicit specialized capability and document the decision.

## Review check

Trace synchronous call paths inside a Unit of Work and verify that none opens or commits another Unit of Work.
