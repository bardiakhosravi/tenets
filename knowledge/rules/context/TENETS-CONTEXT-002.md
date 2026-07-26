---
id: TENETS-CONTEXT-002
title: Bounded contexts do not import each other's internals
kind: rule
status: stable
category: context
severity: error
profiles: ["core"]
related: ["TENETS-CONTEXT-003", "TENETS-CONTEXT-004"]
aliases: []
---
## Rule

A bounded context must not import another context's entities, value objects, repositories, use cases, or internal modules.

## Rationale

Internal models encode local language and invariants. Sharing them couples contexts and erodes their independent ownership.

## Incorrect

```python
from customer_accounts.domain.customer import Customer

class SubmitOrderUseCase:
    def execute(self, customer: Customer) -> Order: ...
```

## Correct

```python
class CustomerEligibilityPort(Protocol):
    def get_eligibility(self, customer_id: CustomerReferenceId) -> CustomerEligibility: ...
```

## Remediation

Replace the internal import with a consuming-context port expressed in local language and an adapter to a published provider contract.

## Review check

Verify imports do not cross bounded-context internal package boundaries.
