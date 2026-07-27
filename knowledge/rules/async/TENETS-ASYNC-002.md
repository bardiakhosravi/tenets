---
id: TENETS-ASYNC-002
title: Idempotency identity is scoped to consumer and operation
kind: rule
status: stable
category: async-reliability
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-ASYNC-001", "TENETS-ASYNC-003"]
aliases: []
---
## Rule

Scope asynchronous idempotency identity by logical message identity, consuming capability, and operation.

## Rationale

The same integration event may legitimately produce one independent outcome in each consumer or operation.

## Incorrect

```sql
UNIQUE (message_id)
```

## Correct

```sql
UNIQUE (consumer_name, operation_name, message_id)
```

## Remediation

Expand the receipt key to include stable consumer and operation identities.

## Review check

Verify that unrelated consumers cannot suppress each other's valid work.
