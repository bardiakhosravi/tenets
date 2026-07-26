---
id: TENETS-API-002
title: External schemas belong to primary adapters
kind: rule
status: stable
category: api
severity: error
profiles: ["core"]
related: ["TENETS-ADAPTER-002", "TENETS-API-001", "TENETS-API-003"]
aliases: []
---
## Rule

HTTP, messaging, CLI, and other external request and response schemas are owned by their primary adapters, not by the domain or application layers.

## Rationale

Transport contracts contain serialization and compatibility concerns that should evolve independently of inward models.

## Incorrect

```python
# ordering/domain/order_response.py
class OrderResponse(BaseModel): ...
```

## Correct

```python
# ordering/adapters/primary/http/order_response.py
class OrderResponse(BaseModel): ...
```

## Remediation

Move transport schemas to the owning adapter and map them to and from application inputs and results.

## Review check

Search domain and application packages for framework schema bases, transport field aliases, and serialization metadata.
