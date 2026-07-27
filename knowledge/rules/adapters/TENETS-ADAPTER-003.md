---
id: TENETS-ADAPTER-003
title: Protocol response and error mapping remain in primary adapters
kind: rule
status: stable
category: adapters
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ADAPTER-001", "TENETS-API-003"]
aliases: []
---
## Rule

Primary adapters map application outcomes and known failures to protocol-specific responses, status codes, headers, acknowledgements, or exit codes.

## Rationale

Transport semantics are adapter concerns and must not leak into use cases or domain objects.

## Incorrect

```python
class GetOrderUseCase:
    def execute(self, order_id) -> Response:
        return jsonify({"id": order_id}), 200
```

## Correct

```python
order = get_order.execute(order_id)
return jsonify(map_order_to_response(order)), 200
```

## Remediation

Return an inward-owned result from the use case and perform protocol mapping in the primary adapter.

## Review check

Inspect use-case return types and exceptions for HTTP, messaging, CLI, or framework concepts.
