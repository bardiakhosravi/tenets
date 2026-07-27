---
id: TENETS-APP-007
title: Use cases return meaningful inward-owned results
kind: rule
status: stable
category: application
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-001"]
aliases: []
---
## Rule

A use case returns the simplest meaningful contract: `None`, a domain object, or an immutable application-owned result. It never returns persistence models, adapter DTOs, framework types, or unstructured dictionaries.

## Rationale

A single natural domain result needs no wrapper; projections and combined outcomes benefit from a stable application result.

## Incorrect

```python
return CreateOrderResult(order=order)  # Wrapper adds no boundary.
return jsonify(order_row)
```

## Correct

```python
return order
return OrderAccountSummary(order.id, balance, shipment_count)
```

## Remediation

Return the domain object directly when it is the natural result, or define an immutable application result for a genuine projection.

## Review check

Verify result ownership and challenge wrappers that contain only one domain object without adding meaning.
