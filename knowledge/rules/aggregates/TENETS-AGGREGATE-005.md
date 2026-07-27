---
id: TENETS-AGGREGATE-005
title: Aggregates reference other aggregates by identity
kind: rule
status: stable
category: aggregates
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-010", "TENETS-CONTEXT-002", "TENETS-AGGREGATE-006"]
aliases: []
---
## Rule

An aggregate stores references to other aggregates as domain identity value objects, not as nested aggregate instances.

## Rationale

Identity references preserve separate consistency boundaries and prevent accidental cross-aggregate mutation.

## Incorrect

```python
order.customer = customer
```

## Correct

```python
order.customer_id = CustomerReferenceId(customer.id)
```

## Remediation

Replace nested external aggregate objects with typed identities and load required state in the use case.

## Review check

Inspect aggregate fields for entities that have independent repositories or lifecycles.
