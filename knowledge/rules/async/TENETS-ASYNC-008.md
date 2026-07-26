---
id: TENETS-ASYNC-008
title: Reliability guarantees are stated per atomic boundary
kind: rule
status: stable
category: async-reliability
severity: error
profiles: ["core"]
related: ["TENETS-ASYNC-001", "TENETS-ASYNC-004", "TENETS-ASYNC-006"]
aliases: []
---
## Rule

Describe delivery and effect guarantees separately for each atomic mechanism. Do not claim end-to-end exactly-once behavior across systems that do not share one atomic boundary.

## Rationale

Outbox, broker, inbox, and external providers protect different boundaries and leave different duplicate or loss windows.

## Incorrect

```text
The order workflow is exactly once.
```

## Correct

```text
Order state and outbox recording are atomic. Publication is at least once.
Inventory state and its inbox receipt are atomic. Email duplication is governed
by the notification provider's idempotency window.
```

## Remediation

Replace broad reliability labels with guarantees and residual risks for each database, broker, consumer, and external effect.

## Review check

Verify that every reliability claim names its protected boundary and remaining failure windows.
