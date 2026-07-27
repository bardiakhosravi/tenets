---
id: TENETS-ERROR-003
title: Application failures represent orchestration outcomes
kind: rule
status: stable
category: errors
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-002", "TENETS-REPO-005", "TENETS-ERROR-006"]
aliases: []
---
## Rule

Application failures represent meaningful use-case outcomes, such as required absence or workflow rejection, rather than technical adapter failures.

## Rationale

The application layer owns how repository results and capability outcomes affect a workflow, but it must remain independent of vendor mechanics.

## Incorrect

```python
raise DatabaseRowMissing(order_id)
```

## Correct

```python
order = self._order_repository.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

## Remediation

Interpret technical-neutral port results in the use case and raise a workflow-specific application failure only when required.

## Review check

Verify that application failures describe business workflow outcomes and do not mention drivers, protocols, or vendor SDKs.
