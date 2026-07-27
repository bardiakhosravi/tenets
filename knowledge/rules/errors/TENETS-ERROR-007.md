---
id: TENETS-ERROR-007
title: Unexpected failures terminate at an outer boundary
kind: rule
status: stable
category: errors
severity: error
profiles: ["core"]
related: ["TENETS-ERROR-005", "TENETS-ERROR-006", "TENETS-UOW-010"]
aliases: []
---
## Rule

Let unexpected failures reach a true outer safety boundary that logs them once with correlation context and returns a safe generic protocol outcome.

## Rationale

Intermediate broad catches hide defects and duplicate logging, while an outer boundary prevents internal messages, SQL, payloads, and stack traces from leaking externally.

## Incorrect

```python
try:
    self._order_repository.save(order)
except Exception:
    return None
```

## Correct

```python
@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    app.logger.exception("Unhandled request failure")
    return {"code": "internal_error"}, 500
```

## Remediation

Remove broad intermediate catches unless they are cleanup boundaries that preserve the primary failure, and install one outer protocol safety boundary.

## Review check

Verify that unexpected failures are logged once, produce no internal detail in responses, and are not mislabeled as expected outcomes.
