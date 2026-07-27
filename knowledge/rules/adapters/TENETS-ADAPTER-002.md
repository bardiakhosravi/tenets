---
id: TENETS-ADAPTER-002
title: Primary adapters validate and translate transport input
kind: rule
status: stable
category: adapters
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ADAPTER-001", "TENETS-API-002", "TENETS-APP-005"]
aliases: []
---
## Rule

Primary adapters validate transport shape and authentication context, then translate external representations into application commands, queries, and semantic values.

## Rationale

Malformed protocol input should not enter the application, while business validation remains with the domain or use case that owns it.

## Incorrect

```python
use_case.execute(request.get_json())
```

## Correct

```python
payload = SubmitOrderRequest.parse(request.get_json())
command = map_submit_order_request_to_command(payload, authenticated_account)
use_case.execute(command)
```

## Remediation

Add a protocol request schema and an explicit mapping to the application-owned input.

## Review check

Verify adapters handle required fields and transport formats without duplicating domain decisions.
