---
id: TENETS-ERROR-005
title: Secondary adapters translate specific vendor failures
kind: rule
status: stable
category: errors
severity: error
profiles: ["core"]
related: ["TENETS-ADAPTER-006", "TENETS-ERROR-004", "TENETS-ERROR-007"]
aliases: []
---
## Rule

Secondary adapters catch specific expected technical failures, raise the corresponding port-declared failures, and preserve the original cause.

## Rationale

Specific translation prevents vendor types from leaking inward while retaining diagnostic evidence and avoiding accidental conversion of programming defects.

## Incorrect

```python
except Exception:
    raise PaymentGatewayUnavailable()
```

## Correct

```python
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Catch only known vendor failures at the adapter boundary and chain each translated cause.

## Review check

Look for broad catches, swallowed causes, generic adapter failures, and vendor exceptions crossing the port.
