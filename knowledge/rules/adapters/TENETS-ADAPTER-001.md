---
id: TENETS-ADAPTER-001
title: Primary adapters invoke application capabilities
kind: rule
status: stable
category: adapters
severity: error
profiles: ["core"]
related: ["TENETS-PORT-001", "TENETS-ADAPTER-002", "TENETS-ADAPTER-003"]
aliases: []
---
## Rule

A primary adapter receives an external interaction, translates it into an application input, invokes one primary port or use case, and returns through its protocol boundary.

## Rationale

Primary adapters drive the application without becoming the owner of its workflow.

## Incorrect

```python
@app.post("/orders")
def submit_order():
    order = create_order(...)
    orders.save(order)
```

## Correct

```python
@app.post("/orders")
def submit_order():
    order = create_submit_order().execute(map_request_to_command(request))
    return map_order_to_response(order), 201
```

## Remediation

Move workflow orchestration into a use case and leave translation and delegation in the adapter.

## Review check

Verify each entry point invokes one application capability rather than repositories or domain creation directly.
