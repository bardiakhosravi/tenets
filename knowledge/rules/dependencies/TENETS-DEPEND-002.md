---
id: TENETS-DEPEND-002
title: Application code depends inward and on owned ports
kind: rule
status: stable
category: dependencies
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-001", "TENETS-DEPEND-003", "TENETS-PORT-002"]
aliases: []
---
## Rule

Application code may depend on domain concepts and application- or domain-owned port contracts. It never imports concrete adapters, frameworks, vendor clients, or persistence implementations.

## Rationale

Use cases remain independent of replaceable delivery and infrastructure choices when dependencies are expressed as inward-owned contracts.

## Incorrect

```python
class SubmitOrderUseCase:
    def __init__(self, orders: SqlOrderRepository) -> None: ...
```

## Correct

```python
class SubmitOrderUseCase:
    def __init__(self, orders: OrderRepository) -> None: ...
```

## Remediation

Introduce or use an inward-owned port and move concrete adapter selection to the composition root.

## Review check

Inspect application imports and constructor annotations for concrete adapters or technology packages.
