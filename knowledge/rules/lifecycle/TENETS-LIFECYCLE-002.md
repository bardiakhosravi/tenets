---
id: TENETS-LIFECYCLE-002
title: Python creation uses module functions
kind: rule
status: stable
category: lifecycle
severity: error
minimum_profile: pragmatic
applies_to: ["python"]
related: ["TENETS-LIFECYCLE-001", "TENETS-LIFECYCLE-004"]
aliases: []
---
## Rule

In Python, create every new entity, aggregate, and value object through a standalone `create_<domain_object>()` function in that object's module.

## Rationale

A named module function makes creation semantics explicit while leaving the constructor available for controlled reconstruction.

## Incorrect

```python
order = Order(customer_id=customer_id)
order = Order.create(customer_id)
```

## Correct

```python
order = create_order(customer_id)
```

## Remediation

Add a colocated creation function and replace direct workflow construction and class factory calls.

## Review check

Search application and domain workflow code for direct constructors or class factory methods used for new domain objects.
