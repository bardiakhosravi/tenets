---
id: TENETS-LIFECYCLE-003
title: Creation receives complete initial state
kind: rule
status: stable
category: lifecycle
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-LIFECYCLE-004", "TENETS-LIFECYCLE-006"]
aliases: []
---
## Rule

A creation entry point receives every available input that belongs to the object's valid initial state.

## Rationale

Incomplete creation spreads initialization policy across callers and permits invalid intermediate objects.

## Incorrect

```python
order = create_order(customer_id)
order.set_billing_address(command.billing_address)
```

## Correct

```python
order = create_order(customer_id, billing_address)
```

## Remediation

Add already-available creation data to the creation function and construct the valid initial object atomically.

## Review check

Inspect mutations immediately following creation and determine whether their input was already available.
