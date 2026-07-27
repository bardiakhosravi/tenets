---
id: TENETS-ERROR-002
title: Domain failures remain technology agnostic
kind: rule
status: stable
category: errors
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-001", "TENETS-VALIDATE-001", "TENETS-ERROR-006"]
aliases: []
---
## Rule

Domain failures express invariant and business-rule violations without framework, protocol, persistence, or vendor concepts.

## Rationale

A domain failure must carry the same ubiquitous meaning whether the workflow is invoked through HTTP, messaging, a command line, or a test.

## Incorrect

```python
raise HTTPConflict("order already submitted")
```

## Correct

```python
class OrderAlreadySubmitted(Exception):
    pass
```

## Remediation

Replace outer-layer exceptions with a domain-specific failure and map it at each primary adapter.

## Review check

Inspect domain exception imports, names, fields, and messages for transport or infrastructure vocabulary.
