---
id: TENETS-VALUE-003
title: Value invariants apply during creation and hydration
kind: rule
status: stable
category: values
severity: error
profiles: ["core"]
related: ["TENETS-VALUE-001", "TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-005"]
aliases: []
---
## Rule

Invariants intrinsic to a value object are enforced whenever it is instantiated, including both new creation and persistence hydration.

## Rationale

Persisted data does not become valid merely because it already exists; invalid values must not enter the domain model.

## Incorrect

```python
postal_code = object.__new__(PostalCode)
postal_code.value = row.postal_code
```

## Correct

```python
postal_code = PostalCode(row.postal_code)
```

## Remediation

Put intrinsic validation in the value object's construction path and map corrupted persistence data to an explicit adapter failure.

## Review check

Verify repository mappers cannot bypass value-object invariants.
