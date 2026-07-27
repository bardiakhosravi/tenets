---
id: TENETS-TEST-005
title: Tests distinguish creation from hydration entry points
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: pragmatic
applies_to: ["python"]
related: ["TENETS-LIFECYCLE-002", "TENETS-LIFECYCLE-005", "TENETS-ADAPTER-007"]
aliases: []
---
## Rule

Use production `create_<domain_object>()` functions when tests need new domain objects and explicit constructors or directional repository mappers when tests need persisted state.

## Rationale

Tests that bypass creation or recreate persisted objects through creation functions can hide lifecycle defects and produce events, defaults, or identities at the wrong time.

## Incorrect

```python
loaded_order = create_order(order_id=persisted_id, status=persisted_status)
```

## Correct

```python
new_order = create_order(customer_account_id=account_id, lines=lines)
loaded_order = map_order_row_to_order_domain_object(row)
```

## Remediation

Choose the entry point from the object's lifecycle meaning and make fixtures explicit about whether they create or reconstruct state.

## Review check

Inspect domain and repository tests for creation functions used as hydration shortcuts or constructors used to bypass creation policy.
