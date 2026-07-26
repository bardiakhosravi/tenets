---
id: TENETS-AGGREGATE-003
title: Aggregate roots enforce internal invariants
kind: rule
status: stable
category: aggregates
severity: error
profiles: ["core"]
related: ["TENETS-AGGREGATE-001", "TENETS-AGGREGATE-002", "TENETS-ENTITY-002"]
aliases: []
---
## Rule

The aggregate root validates and performs every operation that can affect invariants spanning its internal members.

## Rationale

Individual children cannot reliably protect rules involving the aggregate as a whole.

## Incorrect

```python
order.lines.append(line)  # Bypasses duplicate-product and total rules.
```

## Correct

```python
order.add_line(product_id, quantity, unit_price)
```

## Remediation

Encapsulate internal collections and expose root behavior that enforces all affected invariants.

## Review check

Trace mutations of aggregate children and verify each originates from root behavior.
