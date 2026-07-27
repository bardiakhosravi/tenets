---
id: TENETS-API-001
title: External APIs never expose persistence models
kind: rule
status: stable
category: api
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ADAPTER-005", "TENETS-API-002", "TENETS-API-003"]
aliases: []
---
## Rule

External API requests and responses never use ORM entities, database rows, persistence schemas, or serialized database records as their public contract.

## Rationale

Database structure is an implementation detail with different compatibility, security, and evolution requirements from an external API.

## Incorrect

```python
return OrderRow.query.get(order_id).to_dict()
```

## Correct

```python
order = get_order.execute(OrderId(order_id))
return map_order_to_response(order)
```

## Remediation

Define an adapter-owned API schema and map from an inward-owned result.

## Review check

Inspect endpoint annotations, serializers, and returned values for persistence representations.
