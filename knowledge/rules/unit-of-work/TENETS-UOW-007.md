---
id: TENETS-UOW-007
title: Multi-transaction workflows create fresh scoped transactions
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-UOW-002", "TENETS-EVENT-008", "TENETS-PATTERN-008"]
aliases: []
---
## Rule

A workflow that deliberately crosses multiple transaction boundaries obtains a fresh Unit of Work and matching adapters for each boundary through a capability-specific factory.

## Rationale

Relays and similar workflows must not reuse closed transaction resources or hold database transactions open during external calls.

## Incorrect

```python
with self._unit_of_work:
    messages = self._outbox.claim_pending(batch_size)
with self._unit_of_work:
    self._outbox.mark_published(message.id)
```

## Correct

```python
claim_transaction = self._integration_event_relay_transaction_factory.create()
mark_transaction = self._integration_event_relay_transaction_factory.create()
```

## Remediation

Replace reusable Unit of Work instances with a narrowly named transaction factory that creates correctly shared transaction-scoped dependencies.

## Review check

Verify that every transaction in a multi-transaction workflow receives a distinct Unit of Work and resource.
