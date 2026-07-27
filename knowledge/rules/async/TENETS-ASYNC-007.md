---
id: TENETS-ASYNC-007
title: Idempotency records cover the supported replay window
kind: rule
status: stable
category: async-reliability
severity: error
minimum_profile: strict
applies_to: ["all"]
related: ["TENETS-ASYNC-002", "TENETS-ASYNC-006"]
aliases: []
---
## Rule

Retain inbox receipts and external-effect identities for the complete supported retry, redelivery, and manual replay period plus an operational margin.

## Rationale

Deleting an idempotency record while its message can still return makes duplicate effects possible.

## Incorrect

```text
Receipts expire after 24 hours; manual replay is supported for 30 days.
```

## Correct

```text
Receipts are retained for the 30-day replay window plus a 7-day margin.
```

## Remediation

Align retention, broker redelivery, dead-letter replay, provider key windows, and operational replay policy.

## Review check

Compare every identity retention period with all supported paths by which the operation can be repeated.
