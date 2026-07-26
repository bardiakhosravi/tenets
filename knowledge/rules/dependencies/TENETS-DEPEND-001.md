---
id: TENETS-DEPEND-001
title: Domain code is independent of frameworks and infrastructure
kind: rule
status: stable
category: dependencies
severity: error
profiles: ["core"]
related: ["TENETS-DEPEND-002", "TENETS-ADAPTER-005"]
aliases: []
---
## Rule

Domain code depends only on the language standard library and domain-owned concepts. It does not import frameworks, ORMs, transports, vendor SDKs, configuration, application workflows, or adapter implementations.

## Rationale

The domain model must remain executable and testable without selecting infrastructure or a delivery mechanism.

## Incorrect

```python
from sqlalchemy.orm import Mapped

class Order:
    id: Mapped[str]
```

## Correct

```python
class Order:
    def __init__(self, id: OrderId, status: OrderStatus) -> None: ...
```

## Remediation

Move technical annotations and mapping into an adapter and retain only domain-owned types and behavior.

## Review check

Inspect domain imports for application, adapter, framework, persistence, transport, and vendor packages.
