<!-- tenets:generated-source -->
# Ubiquitous Language

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-NAME-001: Domain names follow ubiquitous language

## Rule

Names in domain models, use cases, ports, events, and tests — and internal helper functions, private methods, local variables, and parameters — use the terminology and distinctions agreed for their bounded context. Do not introduce a term that is not part of that context's ubiquitous language.

## Rationale

Consistent language makes code communicate the business model and exposes conceptual disagreement. It also governs how coding agents describe the system: an off-glossary name propagates into the agent's explanations and silently becomes the vocabulary it uses with the developer, breaking the shared language between human and agent — not only code readability.

## Incorrect

```python
class ProcessDataService: ...
```

```python
class RegisterUserUseCase:
    def execute(self, command: RegisterUser) -> None:
        user = register_user(command.email)
        self._inventory(user)          # "inventory" is nowhere in the domain

    def _inventory(self, user: User) -> None:
        self._users.add(user)
```

## Correct

```python
class SubmitOrderUseCase: ...
```

```python
class RegisterUserUseCase:
    def execute(self, command: RegisterUser) -> None:
        user = register_user(command.email)
        self._users.add(user)          # no needless helper; if extracted, name it
                                        # from the glossary, e.g. _add_registered_user
```

## Remediation

Replace generic or inconsistent terms with the context's accepted business vocabulary. Check each name — including private helpers and locals — against the bounded context's glossary; if the term is not there, rename it to an agreed term or raise the language gap, never coin a new one silently.

## Review check

Compare code names with requirements, examples, and neighbouring domain concepts for semantic drift, including private helpers, local variables, and parameters. Verify every code identifier maps to a term in the context's ubiquitous language and flag invented terms such as a generic `inventory` used for persistence.

## TENETS-NAME-002: Domain names exclude technology and vendor terminology

## Rule

Domain types, behavior, and events are named for business meaning, never databases, transports, frameworks, vendors, or implementation mechanisms.

## Rationale

Technology names in the domain make replaceable implementation choices part of the business model.

## Incorrect

```python
class StripePaymentCompleted: ...
class SqlOrder: ...
```

## Correct

```python
class PaymentAuthorized: ...
class Order: ...
```

## Remediation

Move implementation-specific names to adapters and rename inward concepts around their business meaning.

## Review check

Search domain names for vendor, protocol, framework, database, queue, and serialization terminology.

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

## TENETS-PORT-003: Ports represent one focused capability

## Rule

A port contract represents one cohesive capability in ubiquitous language. It does not expose a generic client, utility surface, or multi-step workflow.

## Rationale

Focused ports isolate change and prevent infrastructure-oriented abstractions from shaping application workflows.

## Incorrect

```python
class ExternalServices(Protocol):
    def request(self, method: str, url: str, payload: dict) -> dict: ...
```

## Correct

```python
class PaymentGateway(Protocol):
    def authorize(self, payment: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Replace generic operations with the smallest business capability the consumer requires.

## Review check

Confirm that the port name and methods can be understood without knowing the selected vendor or transport.
