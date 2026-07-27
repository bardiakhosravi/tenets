---
id: TENETS-ASYNC-003
title: Idempotency identity is bound to payload
kind: rule
status: stable
category: async-reliability
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-ASYNC-002", "TENETS-ASYNC-004"]
aliases: []
---
## Rule

Store a canonical payload fingerprint with the idempotency identity. Reuse of the same identity with a different payload is a contract conflict, not a duplicate success.

## Rationale

Identity alone cannot distinguish legitimate redelivery from producer corruption or accidental key reuse.

## Incorrect

```python
if inbox.exists(message.id):
    return AlreadyProcessed()
```

## Correct

```python
receipt = inbox.get(key)
if receipt and receipt.payload_hash != payload_hash:
    raise IdempotencyIdentityConflict(key)
```

## Remediation

Define canonical payload serialization or selected semantic fields and persist their fingerprint with the receipt.

## Review check

Verify that same-identity, different-payload delivery is rejected and observable.
