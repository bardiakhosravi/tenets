<!-- tenets:generated-source -->
# Bounded Contexts

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-CONTEXT-001: Each bounded context owns its model and language

## Rule

Each bounded context owns the definitions, invariants, and language of its domain model. Similar terms in different contexts may intentionally have different structures and meanings.

## Rationale

Explicit ownership prevents a shared enterprise model from coupling independently evolving business capabilities.

## Incorrect

```text
Ordering, Billing, and Shipping all import one global Customer entity.
```

## Correct

```text
Ordering owns CustomerReferenceId; Billing owns BillingAccount; Customer Accounts owns Customer.
```

## Remediation

Assign each concept to a context and translate across published boundaries instead of sharing internal models.

## Review check

Verify every domain type has one owning context and cross-context similarities do not imply shared implementation.

## TENETS-CONTEXT-002: Bounded contexts do not import each other's internals

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

## TENETS-CONTEXT-003: Cross-context contracts use the consumer's language

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

## TENETS-CONTEXT-004: Cross-context adapters translate published contracts

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

## TENETS-CONTEXT-005: Consuming port placement follows capability ownership

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

## TENETS-CONTEXT-006: External references are validated through public contracts

## Rule

When a workflow requires an external reference to be valid, the application use case validates it through a consuming port before persisting the local reference.

## Rationale

Local repositories cannot validate another context's ownership or lifecycle, and domain objects must not perform external I/O.

## Incorrect

```python
order = create_order(CustomerReferenceId(command.customer_id))
order_repository.save(order)
```

## Correct

```python
customer_id = CustomerReferenceId(command.customer_id)
if not customer_eligibility.get_eligibility(customer_id).may_order:
    raise CustomerNotEligible(customer_id)
order_repository.save(create_order(customer_id))
```

## Remediation

Add an application-invoked consuming port and perform required validation before local creation or persistence.

## Review check

Verify externally owned references are validated at the application boundary when the workflow requires current validity.
