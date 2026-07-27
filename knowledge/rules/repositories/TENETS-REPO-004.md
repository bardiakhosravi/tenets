---
id: TENETS-REPO-004
title: Repository names express result semantics
kind: rule
status: stable
category: repositories
severity: warning
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-REPO-003", "TENETS-REPO-005"]
aliases: []
---
## Rule

Use `get` or `get_by_*` for one result, `list_*` for bounded collections, `search` for criteria-driven collections, and `exists_by_*` for existence. Do not use `find_*`.

## Rationale

These verbs communicate expected cardinality and outcome more precisely than the ambiguous `find` convention.

## Incorrect

```python
find_user_by_email(email)
find_orders(criteria)
```

## Correct

```python
get_by_email(email)
search(criteria)
```

## Remediation

Rename the contract and every adapter implementation according to result semantics.

## Review check

Search repository interfaces and tests for methods beginning with `find`.
