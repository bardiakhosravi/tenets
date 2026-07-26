---
id: TENETS-NAME-002
title: Domain names exclude technology and vendor terminology
kind: rule
status: stable
category: naming
severity: error
profiles: ["core"]
related: ["TENETS-NAME-001", "TENETS-DEPEND-001", "TENETS-ADAPTER-005"]
aliases: []
---
## Rule

Domain types, behavior, and events are named for business meaning, never databases, transports, frameworks, vendors, or implementation mechanisms.

## Rationale

Technology names in the domain make replaceable implementation choices part of the business model.

## Incorrect

```python
class StripePaymentCompleted: ...
class SqlOrder: ...
```

## Correct

```python
class PaymentAuthorized: ...
class Order: ...
```

## Remediation

Move implementation-specific names to adapters and rename inward concepts around their business meaning.

## Review check

Search domain names for vendor, protocol, framework, database, queue, and serialization terminology.
