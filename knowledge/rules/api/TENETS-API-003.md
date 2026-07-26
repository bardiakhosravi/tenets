---
id: TENETS-API-003
title: Primary adapters map results before external delivery
kind: rule
status: stable
category: api
severity: error
profiles: ["core"]
related: ["TENETS-APP-007", "TENETS-ADAPTER-003", "TENETS-API-002"]
aliases: []
---
## Rule

Primary adapters map domain objects and application-owned results into explicit external response representations before they cross the protocol boundary.

## Rationale

Explicit response mapping prevents accidental data exposure and decouples public compatibility from inward model evolution.

## Incorrect

```python
return jsonify(order.__dict__)
```

## Correct

```python
return jsonify(map_order_to_response(order).model_dump())
```

## Remediation

Define the intended external response fields and add an explicit directional mapper in the primary adapter.

## Review check

Verify endpoints do not serialize inward objects generically or return them directly through framework auto-serialization.
