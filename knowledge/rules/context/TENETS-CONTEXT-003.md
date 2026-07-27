---
id: TENETS-CONTEXT-003
title: Cross-context contracts use the consumer's language
kind: rule
status: stable
category: context
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-CONTEXT-002", "TENETS-CONTEXT-004", "TENETS-PORT-003"]
aliases: []
---
## Rule

A consuming bounded context defines the capability it needs using its own ubiquitous language and semantic types.

## Rationale

The consumer should depend on a stable business need, not the provider's storage model or internal vocabulary.

## Incorrect

```python
class CustomerTableReader(Protocol):
    def select_customer_row(self, customer_pk: str) -> dict: ...
```

## Correct

```python
class CustomerEligibilityPort(Protocol):
    def get_eligibility(self, customer_id: CustomerReferenceId) -> CustomerEligibility: ...
```

## Remediation

Rename the contract around the consuming capability and replace provider-specific parameters and results with local semantic types.

## Review check

Verify a reader can understand the contract without knowing the provider's schema or internal model.
