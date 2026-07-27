---
id: TENETS-ERROR-006
title: Primary adapters map known failures
kind: rule
status: stable
category: errors
severity: error
profiles: ["core"]
related: ["TENETS-ADAPTER-003", "TENETS-ERROR-002", "TENETS-ERROR-003", "TENETS-ERROR-004"]
aliases: []
---
## Rule

Primary adapters map known domain, application, and port-declared failures into explicit protocol-specific outcomes.

## Rationale

Transport status, response shape, acknowledgment, and exit codes belong to the driving boundary rather than to reusable business code.

## Incorrect

```python
raise OrderNotFound(order_id)  # Escapes the HTTP boundary unmapped.
```

## Correct

```python
@app.errorhandler(OrderNotFound)
def handle_order_not_found(error: OrderNotFound):
    return {"code": "order_not_found"}, 404
```

## Remediation

Add centralized primary-adapter mappings for every known failure that can reach that protocol.

## Review check

Trace known failures to stable protocol responses and verify that domain or application code does not choose those responses.
