---
id: TENETS-PORT-009
title: Port contracts exclude external representations
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-008", "TENETS-REPO-006"]
aliases: []
---
## Rule

Port contracts never expose ORM models, database rows, transport DTOs, vendor SDK objects, serialized records, or adapter-owned types.

## Rationale

External representations make the application depend on replaceable implementation details.

## Incorrect

```python
class OrderRepository(Protocol):
    def save(self, row: SqlAlchemyOrderModel) -> None: ...
```

## Correct

```python
class OrderRepository(Protocol):
    def save(self, order: Order) -> None: ...
```

## Remediation

Move representation mapping into the adapter and expose only inward-owned semantic types.

## Review check

Check port imports and annotations for framework, persistence, transport, or vendor packages.
