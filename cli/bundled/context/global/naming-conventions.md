<!-- tenets:generated-source -->
# Naming Conventions

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

## TENETS-NAME-003: Use-case class names end with UseCase

## Rule

Name application use-case classes with the business capability followed by the `UseCase` suffix.

## Rationale

The suffix makes orchestration classes distinguishable from domain services, adapters, handlers, and commands wherever they appear.

## Incorrect

```python
class SubmitOrder:
    ...
```

## Correct

```python
class SubmitOrderUseCase:
    ...
```

## Remediation

Rename the class and update composition-root providers and references consistently.

## Review check

Verify that every application workflow class ends with `UseCase`.

## TENETS-NAME-004: Event handler names identify their event boundary

## Rule

End application domain-event handler classes with `DomainEventHandler` and external integration-event consumer handler classes with `IntegrationEventHandler`.

## Rationale

Explicit suffixes prevent ambiguity when internal domain events and published integration events appear in the same codebase.

## Incorrect

```python
class RecordOrderSubmitted:
    ...
```

## Correct

```python
class RecordOrderSubmittedForPublicationDomainEventHandler:
    ...

class ReserveInventoryForOrderIntegrationEventHandler:
    ...
```

## Remediation

Rename handlers to include both their capability and event-boundary suffix.

## Review check

Verify that event handlers are distinguishable by name without relying on package placement.

## TENETS-NAME-005: Dependency names identify the capability they provide

## Rule

Name injected dependencies and stored fields after their specific capability or contract. Avoid ambiguous names such as `factory`, `repository`, `client`, `handler`, or `publisher`.

## Rationale

Capability-specific names keep constructors and orchestration readable when several dependencies share the same technical role.

## Incorrect

```python
self._factory = factory
self._publisher = publisher
```

## Correct

```python
self._order_submitted_integration_event_factory = (
    order_submitted_integration_event_factory
)
self._integration_event_publisher = integration_event_publisher
```

## Remediation

Rename parameters and fields to the narrow capability they implement.

## Review check

Inspect dependency variables and verify that each name remains clear without reading its type annotation.

## TENETS-REPO-004: Repository names express result semantics

## Rule

Use `get` or `get_by_*` for one result, `list_*` for bounded collections, `search` for criteria-driven collections, and `exists_by_*` for existence. Do not use `find_*`.

## Rationale

These verbs communicate expected cardinality and outcome more precisely than the ambiguous `find` convention.

## Incorrect

```python
find_user_by_email(email)
find_orders(criteria)
```

## Correct

```python
get_by_email(email)
search(criteria)
```

## Remediation

Rename the contract and every adapter implementation according to result semantics.

## Review check

Search repository interfaces and tests for methods beginning with `find`.
