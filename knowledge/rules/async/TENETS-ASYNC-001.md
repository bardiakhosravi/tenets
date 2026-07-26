---
id: TENETS-ASYNC-001
title: Asynchronous consumers define repeated-delivery outcomes
kind: rule
status: stable
category: async-reliability
severity: error
profiles: ["core"]
related: ["TENETS-ASYNC-002", "TENETS-ASYNC-008"]
aliases: []
---
## Rule

For every asynchronous consumer, define how repeated delivery affects each business state change, emitted event, external effect, and operational metric.

## Rationale

Message brokers commonly redeliver. Declaring only that a handler is "idempotent" hides which observable outcomes are actually protected.

## Incorrect

```text
ReserveInventory is idempotent.
```

## Correct

```text
One reservation and one resulting outbox event per consumer operation;
duplicate-delivery metrics may increment; customer email is protected separately.
```

## Remediation

Inventory every observable effect and specify the repeated-delivery outcome for each one.

## Review check

Verify explicit duplicate behavior for local state, emitted messages, external calls, and metrics.
