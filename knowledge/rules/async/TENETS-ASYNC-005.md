---
id: TENETS-ASYNC-005
title: Acknowledge asynchronous input after durable completion
kind: rule
status: stable
category: async-reliability
severity: error
profiles: ["core"]
related: ["TENETS-EVENT-009", "TENETS-ASYNC-004"]
aliases: []
---
## Rule

The primary messaging adapter acknowledges delivery only after the application transaction commits or confirms that an identical message was already completed.

## Rationale

Acknowledging before durability can permanently lose work if the process fails before commit.

## Incorrect

```python
channel.ack(message)
consumer_use_case.execute(event)
```

## Correct

```python
result = consumer_use_case.execute(event)
if result.is_durably_complete:
    channel.ack(message)
```

## Remediation

Move acknowledgement after durable application completion and map retryable, permanent, and conflict failures explicitly.

## Review check

Verify acknowledgement order for success, identical duplicate, validation failure, retryable failure, and identity conflict.
