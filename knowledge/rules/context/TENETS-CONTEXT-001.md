---
id: TENETS-CONTEXT-001
title: Each bounded context owns its model and language
kind: rule
status: stable
category: context
severity: error
profiles: ["core"]
related: ["TENETS-CONTEXT-002", "TENETS-CONTEXT-003", "TENETS-NAME-001"]
aliases: []
---
## Rule

Each bounded context owns the definitions, invariants, and language of its domain model. Similar terms in different contexts may intentionally have different structures and meanings.

## Rationale

Explicit ownership prevents a shared enterprise model from coupling independently evolving business capabilities.

## Incorrect

```text
Ordering, Billing, and Shipping all import one global Customer entity.
```

## Correct

```text
Ordering owns CustomerReferenceId; Billing owns BillingAccount; Customer Accounts owns Customer.
```

## Remediation

Assign each concept to a context and translate across published boundaries instead of sharing internal models.

## Review check

Verify every domain type has one owning context and cross-context similarities do not imply shared implementation.
