---
id: TENETS-CONTEXT-005
title: Consuming port placement follows capability ownership
kind: rule
status: stable
category: context
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-PORT-002", "TENETS-APP-003", "TENETS-CONTEXT-003"]
aliases: []
---
## Rule

Place a cross-context consuming port in the domain layer when it supplies a domain-required capability used directly by domain behavior. Place it in the application layer when it supports orchestration, external-reference validation, reporting, enrichment, or query coordination.

## Rationale

Port placement follows who owns the capability, not a blanket rule that every external dependency belongs in one layer.

## Incorrect

```python
# Domain-owned only because every secondary port was put in domain/ports/.
class CustomerReportingQuery(Protocol): ...
```

## Correct

```python
# ordering/application/ports/customer_eligibility.py
class CustomerEligibilityPort(Protocol):
    def get_eligibility(self, customer_id: CustomerReferenceId) -> CustomerEligibility: ...
```

## Remediation

Identify whether the capability is part of domain behavior or application workflow coordination, then move the contract to that owning layer.

## Review check

Verify the port's location is justified by the capability's owner and that a use case invokes it.
