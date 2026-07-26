---
id: TENETS-EVENT-009
title: External events enter through primary messaging adapters
kind: rule
status: stable
category: events
severity: error
profiles: ["core"]
related: ["TENETS-ADAPTER-001", "TENETS-ADAPTER-003", "TENETS-ASYNC-005"]
aliases: []
---
## Rule

A primary messaging adapter validates the broker envelope, deserializes the published contract, maps it to local application input, invokes one consumer capability, and acknowledges according to the durable outcome.

## Rationale

Broker types and acknowledgement mechanics are transport concerns, while business handling belongs to the application and domain.

## Incorrect

```python
def handle(message: BrokerMessage) -> None:
    inventory.reserve(message.payload["sku"])
```

## Correct

```python
event = map_message_to_order_submitted_integration_event_v1(message)
reserve_inventory_for_order_use_case.execute(event)
channel.ack(message)
```

## Remediation

Move envelope validation and acknowledgement into a primary adapter and map to a semantic application input.

## Review check

Verify that application consumers never receive broker message types and that acknowledgements follow durable outcomes.
