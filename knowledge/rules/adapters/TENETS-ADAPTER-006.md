---
id: TENETS-ADAPTER-006
title: Secondary adapters translate expected technical failures
kind: rule
status: stable
category: adapters
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ADAPTER-004", "TENETS-DEPEND-003"]
aliases: []
---
## Rule

A secondary adapter catches specific expected technical failures and translates them into failures declared beside the consuming port contract, preserving the original cause.

## Rationale

Use cases can respond to meaningful capability failures without depending on vendor exception classes.

## Incorrect

```python
payment_gateway.authorize(request)  # StripeConnectionError leaks inward.
```

## Correct

```python
try:
    return self._authorize(request)
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Define a capability-specific expected failure, catch only the corresponding technical failures, and chain the cause.

## Review check

Inspect adapter boundaries for vendor exceptions leaking inward, broad catches, and discarded causes.
