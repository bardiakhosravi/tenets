---
id: TENETS-UOW-008
title: Units of Work do not retry business workflows
kind: rule
status: stable
category: unit-of-work
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-UOW-006", "TENETS-ASYNC-008"]
aliases: []
---
## Rule

A Unit of Work never silently retries the complete application workflow. The use case or primary worker policy decides whether replaying business behavior is safe.

## Rationale

Transaction retries may repeat domain behavior, clocks, identifier generation, external calls, and event creation.

## Incorrect

```python
@retry_on_serialization_failure
def execute_inside_unit_of_work(callback):
    callback()
```

## Correct

```python
try:
    submit_order_use_case.execute(command)
except OrderVersionConflict:
    retry_policy.handle(command)
```

## Remediation

Remove hidden callback replay from transaction infrastructure and place explicit retry policy where the complete workflow is understood.

## Review check

Search Unit of Work adapters for retry loops, callback execution, or decorators that can replay application behavior.
