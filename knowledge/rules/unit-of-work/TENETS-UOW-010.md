---
id: TENETS-UOW-010
title: Rollback failures do not mask primary failures
kind: rule
status: stable
category: unit-of-work
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-ADAPTER-006", "TENETS-UOW-005"]
aliases: []
---
## Rule

When rollback fails during another application or commit failure, preserve the original failure and report the rollback failure through transaction observability. When rollback is the only failure, raise a precise inward-owned rollback failure with the driver cause.

## Rationale

Replacing the primary failure destroys the reason the transaction was abandoned, while ignoring cleanup failure hides uncertain resource state.

## Incorrect

```python
except Exception:
    session.rollback()  # A rollback error replaces the active failure.
    raise
```

## Correct

```python
try:
    session.rollback()
except Exception as rollback_error:
    transaction_observer.report_rollback_failure(
        rollback_error=rollback_error,
        primary_error=primary_error,
    )
```

## Remediation

Implement and test separate rollback paths for an active primary failure and a standalone rollback failure.

## Review check

Verify exception precedence, cause chaining, and observability when rollback itself fails.
