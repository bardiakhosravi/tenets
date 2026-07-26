---
id: TENETS-AGGREGATE-001
title: Every aggregate has one root
kind: rule
status: stable
category: aggregates
severity: error
profiles: ["core"]
related: ["TENETS-AGGREGATE-002", "TENETS-AGGREGATE-003", "TENETS-REPO-001"]
aliases: []
---
## Rule

Every aggregate has exactly one aggregate root that is the external entry point to its internal entities and values.

## Rationale

One root gives callers a single authority for preserving aggregate-wide consistency.

## Incorrect

```python
order.lines.append(OrderLine(...))
```

## Correct

```python
order.add_line(product_id, quantity, unit_price)
```

## Remediation

Select the entity owning the aggregate lifecycle as root and route internal access and mutation through it.

## Review check

Verify callers cannot obtain and mutate aggregate members independently of the root.
