---
id: TENETS-ASYNC-004
title: Local consumer effects and inbox receipts are atomic
kind: rule
status: stable
category: async-reliability
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-ASYNC-003", "TENETS-EVENT-008", "TENETS-PATTERN-009"]
aliases: []
---
## Rule

Atomically persist the consumer-scoped inbox receipt, local business updates, and resulting outbox records in one local transaction.

## Rationale

Separate commits allow a crash to record completion without business work or repeat business work without a receipt.

## Incorrect

```python
inbox.record(receipt)
unit_of_work.commit()
inventory.reserve(order)
```

## Correct

```python
with unit_of_work:
    inbox.add(receipt)
    inventory.save(reservation)
    outbox.add(inventory_reserved_event)
    unit_of_work.commit()
```

## Remediation

Give the inbox, business repository, outbox, and Unit of Work one shared transaction resource.

## Review check

Verify atomic visibility and rollback of the receipt, local state, and emitted publication intent.
