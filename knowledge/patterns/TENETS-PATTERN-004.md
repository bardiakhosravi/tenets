---
id: TENETS-PATTERN-004
title: Cross-context consuming adapter
kind: pattern
status: stable
category: context
severity: guidance
profiles: ["core", "python"]
related: ["TENETS-CONTEXT-002", "TENETS-CONTEXT-003", "TENETS-CONTEXT-004", "TENETS-CONTEXT-005", "TENETS-CONTEXT-006"]
aliases: []
---
## Purpose

Let one bounded context consume another through a local capability without importing provider internals.

## Implementation

```python
# ordering/application/ports/customer_eligibility.py
class CustomerEligibilityPort(Protocol):
    def get_eligibility(
        self, customer_id: CustomerReferenceId
    ) -> CustomerEligibility: ...

# ordering/adapters/customer_accounts_http.py
class CustomerAccountsHttpAdapter(CustomerEligibilityPort):
    def get_eligibility(
        self, customer_id: CustomerReferenceId
    ) -> CustomerEligibility:
        response = self._client.get_customer(str(customer_id))
        return CustomerEligibility(
            may_order=response.status == "active",
            credit_hold=response.credit_hold,
        )
```

The use case invokes `CustomerEligibilityPort`; the adapter translates the Customer Accounts published response into Ordering semantics.

## Trade-offs

The translation adds code and may duplicate similar-looking types. That duplication preserves bounded-context autonomy and allows either model to evolve independently.

## Related rules

See `TENETS-CONTEXT-002` through `TENETS-CONTEXT-006`.
