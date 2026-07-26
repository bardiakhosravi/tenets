---
id: TENETS-CONTEXT-006
title: External references are validated through public contracts
kind: rule
status: stable
category: context
severity: error
profiles: ["core"]
related: ["TENETS-CONTEXT-004", "TENETS-CONTEXT-005", "TENETS-PORT-010"]
aliases: []
---
## Rule

When a workflow requires an external reference to be valid, the application use case validates it through a consuming port before persisting the local reference.

## Rationale

Local repositories cannot validate another context's ownership or lifecycle, and domain objects must not perform external I/O.

## Incorrect

```python
order = create_order(CustomerReferenceId(command.customer_id))
order_repository.save(order)
```

## Correct

```python
customer_id = CustomerReferenceId(command.customer_id)
if not customer_eligibility.get_eligibility(customer_id).may_order:
    raise CustomerNotEligible(customer_id)
order_repository.save(create_order(customer_id))
```

## Remediation

Add an application-invoked consuming port and perform required validation before local creation or persistence.

## Review check

Verify externally owned references are validated at the application boundary when the workflow requires current validity.
