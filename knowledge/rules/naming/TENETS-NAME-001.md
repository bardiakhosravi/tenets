---
id: TENETS-NAME-001
title: Domain names follow ubiquitous language
kind: rule
status: stable
category: naming
severity: warning
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-CONTEXT-001", "TENETS-PORT-003", "TENETS-NAME-002"]
aliases: []
---
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
