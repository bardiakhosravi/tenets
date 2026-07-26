---
id: TENETS-REPO-001
title: Repositories represent aggregate persistence
kind: rule
status: stable
category: repositories
severity: error
profiles: ["core"]
related: ["TENETS-REPO-002", "TENETS-REPO-007"]
aliases: []
---
## Rule

A repository interface represents the collection and persistence needs of one aggregate root in domain language.

## Rationale

Repositories are domain-owned contracts used by application use cases, not generic database access services.

## Incorrect

```python
class DatabaseRepository(Protocol):
    def execute(self, sql: str) -> list[dict]: ...
```

## Correct

```python
class OrderRepository(Protocol):
    def get(self, order_id: OrderId) -> Order | None: ...
    def save(self, order: Order) -> None: ...
```

## Remediation

Define the contract around aggregate operations required by use cases and move query technology into an adapter.

## Review check

Verify that repository names and methods describe aggregate persistence without database terminology.
