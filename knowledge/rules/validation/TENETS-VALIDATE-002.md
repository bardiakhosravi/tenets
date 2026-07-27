---
id: TENETS-VALIDATE-002
title: Primary adapters validate external input shape
kind: rule
status: stable
category: validation
severity: error
profiles: ["core"]
related: ["TENETS-ADAPTER-001", "TENETS-API-002", "TENETS-VALIDATE-001"]
aliases: []
---
## Rule

Primary adapters validate protocol shape and map valid external inputs into application or domain semantics without duplicating domain invariants.

## Rationale

Transport concerns such as required JSON fields belong at the protocol boundary, while business meaning remains reusable and authoritative inside the domain.

## Incorrect

```python
command = CreateOrderCommand(**request.get_json())
```

## Correct

```python
request_body = CreateOrderRequest.from_json(request.get_json())
command = CreateOrderCommand(
    customer_account_id=CustomerAccountId(request_body.customer_account_id),
    lines=tuple(map_request_line_to_command_line(line) for line in request_body.lines),
)
```

## Remediation

Introduce a protocol request model, validate its shape, and map it explicitly to semantic input types.

## Review check

Check that malformed external data stops at the primary adapter and domain rules are not independently reimplemented there.
