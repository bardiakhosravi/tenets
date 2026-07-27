---
id: TENETS-REPO-006
title: Repositories return domain models
kind: rule
status: stable
category: repositories
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-009", "TENETS-REPO-002", "TENETS-REPO-007"]
aliases: []
---
## Rule

Repositories return fully hydrated aggregate roots, domain read models where explicitly contracted, or absence. They never return ORM models, rows, serialized records, or untyped dictionaries.

## Rationale

Persistence representations belong to adapters and cannot safely carry domain behavior or invariants.

## Incorrect

```python
def get(self, order_id: OrderId) -> OrderRow | None: ...
```

## Correct

```python
def get(self, order_id: OrderId) -> Order | None: ...
```

## Remediation

Add adapter mapping from the persistence representation to the complete domain object.

## Review check

Inspect repository return annotations and use-case code for persistence or mapping concerns.
