---
id: TENETS-LIFECYCLE-006
title: Mutation does not finish creation
kind: rule
status: stable
category: lifecycle
severity: error
profiles: ["core"]
related: ["TENETS-LIFECYCLE-003"]
aliases: []
---
## Rule

Do not create an incomplete object and immediately invoke mutation methods to apply creation data that was already available. Mutation remains valid for later business transitions or newly available information.

## Rationale

The issue is incomplete creation, not mutation itself. Domain methods should represent actual transitions after a valid object exists.

## Incorrect

```python
order = create_order(customer_id)
order.change_shipping_address(command.initial_shipping_address)
```

## Correct

```python
order = create_order(customer_id, command.initial_shipping_address)
# Later:
order.change_shipping_address(new_address)
```

## Remediation

Move initial data into the creation entry point while retaining the mutation method for later transitions.

## Review check

Review the first operations after creation and compare their inputs with the creation command.
