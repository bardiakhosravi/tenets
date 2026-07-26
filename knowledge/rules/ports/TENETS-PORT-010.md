---
id: TENETS-PORT-010
title: Identities cross ports as value objects
kind: rule
status: stable
category: ports
severity: error
profiles: ["core"]
related: ["TENETS-CONTEXT-005", "TENETS-PORT-007", "TENETS-REPO-003"]
aliases: []
---
## Rule

When identity alone is sufficient, pass a domain ID or local cross-context reference ID value object through the port, never its primitive representation.

## Rationale

Typed identity prevents accidental substitution and keeps ownership explicit.

## Incorrect

```python
inventory.get_availability(product_id: str)
```

## Correct

```python
inventory.get_availability(product_id: InventoryProductId)
```

## Remediation

Create the local ID value object at the primary boundary and unwrap it only inside persistence or transport mapping.

## Review check

Find primitive ID annotations on repository and secondary-port methods.
