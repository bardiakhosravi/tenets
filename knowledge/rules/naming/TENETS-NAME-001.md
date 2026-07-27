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

Names in domain models, use cases, ports, events, and tests use the terminology and distinctions agreed for their bounded context.

## Rationale

Consistent language makes code communicate the business model and exposes conceptual disagreement.

## Incorrect

```python
class ProcessDataService: ...
```

## Correct

```python
class SubmitOrderUseCase: ...
```

## Remediation

Replace generic or inconsistent terms with the context's accepted business vocabulary.

## Review check

Compare code names with requirements, examples, and neighbouring domain concepts for semantic drift.
