---
id: TENETS-REPO-002
title: Repository writes accept aggregate roots
kind: rule
status: stable
category: repositories
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-REPO-001", "TENETS-REPO-006"]
aliases: []
---
## Rule

Repository write methods accept complete aggregate roots. Child entities are persisted through their aggregate repository, not separate public repositories.

## Rationale

The aggregate root protects invariants and defines the persistence consistency boundary.

## Incorrect

```python
order_line_repository.save(order.line_items[0])
```

## Correct

```python
order.add_line_item(product_id, quantity, price)
order_repository.save(order)
```

## Remediation

Remove child write repositories and make the aggregate repository map and persist the complete aggregate.

## Review check

Find repositories whose public write methods accept non-root members of an aggregate.
