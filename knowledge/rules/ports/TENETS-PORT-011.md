---
id: TENETS-PORT-011
title: Secondary ports execute rather than orchestrate
kind: rule
status: stable
category: ports
severity: error
profiles: ["core"]
related: ["TENETS-APP-002", "TENETS-PORT-003", "TENETS-PORT-005"]
aliases: []
---
## Rule

A secondary port executes one outbound capability. It does not coordinate repositories, multiple business steps, domain transitions, or other secondary ports.

## Rationale

Workflow orchestration belongs in use cases where dependencies and transaction boundaries remain visible.

## Incorrect

```python
fulfillment.process_order(order_id)  # Loads, charges, reserves, and publishes.
```

## Correct

```python
reservation = inventory.reserve(create_inventory_reservation(order))
```

## Remediation

Move the workflow into an application use case and split infrastructure interactions into focused capability ports.

## Review check

Inspect adapters for multi-step business workflows, repository calls, or calls to unrelated adapters.
