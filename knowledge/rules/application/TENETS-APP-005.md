---
id: TENETS-APP-005
title: Use cases create semantic boundary types
kind: rule
status: stable
category: application
severity: error
profiles: ["core"]
related: ["TENETS-PORT-007", "TENETS-PORT-010", "TENETS-REPO-003"]
aliases: []
---
## Rule

Before calling a repository or secondary port, a use case converts command primitives into domain IDs, value objects, named criteria, specifications, or cohesive capability contracts.

## Rationale

External primitives are acceptable at transport boundaries but not at semantic inward-facing contracts.

## Incorrect

```python
order = orders.get(command.order_id)  # raw string
```

## Correct

```python
order_id = create_order_id(command.order_id)
order = orders.get(order_id)
```

## Remediation

Perform semantic conversion at the application boundary before the first repository or secondary-port call.

## Review check

Follow command fields into outbound calls and flag raw domain-semantic primitives.
