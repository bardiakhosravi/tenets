---
id: TENETS-CONTEXT-004
title: Cross-context adapters translate published contracts
kind: rule
status: stable
category: context
severity: error
profiles: ["core"]
related: ["TENETS-CONTEXT-002", "TENETS-CONTEXT-003", "TENETS-PORT-009"]
aliases: []
---
## Rule

An adapter between bounded contexts calls a published provider contract and translates its representations into the consuming port's semantic types.

## Rationale

An explicit translation boundary prevents either context's internal model from becoming a shared model by accident.

## Incorrect

```python
def get_eligibility(customer_id):
    return customer_repository.get(customer_id)
```

## Correct

```python
def get_eligibility(customer_id: CustomerReferenceId) -> CustomerEligibility:
    response = self._customer_api.get_customer(str(customer_id))
    return CustomerEligibility(active=response.status == "active")
```

## Remediation

Call only a published API, event, or application contract and map its response into types owned by the consumer.

## Review check

Verify the adapter is the only place that understands both published provider data and consuming-context semantics.
