---
id: TENETS-DEPEND-003
title: Adapters depend only on published inward-facing contracts
kind: rule
status: stable
category: dependencies
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-002", "TENETS-ADAPTER-001", "TENETS-ADAPTER-004"]
aliases: []
---
## Rule

Adapters may depend inward on the port contracts they call or implement, their semantic parameter and result types, and domain constructors required for repository mapping. They do not import unrelated layer internals or other adapter implementations.

## Rationale

Published contracts create deliberate dependency boundaries while internal imports and adapter-to-adapter calls create hidden coupling.

## Incorrect

```python
from ordering.application.use_cases.submit_order import SubmitOrderUseCase
from ordering.adapters.sql_order_repository import SqlOrderRepository
```

## Correct

```python
from ordering.application.ports.submit_order import SubmitOrderPort
from ordering.domain.ports.order_repository import OrderRepository
```

## Remediation

Replace internal or peer-adapter dependencies with the relevant published inward-facing contract and wire implementations externally.

## Review check

Verify adapter imports are limited to implemented or invoked contracts, their semantic types, and required mapping constructors.
