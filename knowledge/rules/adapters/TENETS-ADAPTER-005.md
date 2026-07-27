---
id: TENETS-ADAPTER-005
title: External models remain inside their adapters
kind: rule
status: stable
category: adapters
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-001", "TENETS-PORT-009", "TENETS-API-001"]
aliases: []
---
## Rule

Vendor SDK objects, persistence models, transport schemas, serialized payloads, and technology-specific types remain private to the adapter that owns their mapping.

## Rationale

External models change for technical reasons and must not become shared application or domain contracts.

## Incorrect

```python
def authorize(self, request: PaymentAuthorization) -> StripePaymentIntent: ...
```

## Correct

```python
def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Introduce an inward-owned semantic result and map the external object before returning from the adapter.

## Review check

Search inward-facing signatures and imports for ORM, framework, protocol, and vendor-owned types.
