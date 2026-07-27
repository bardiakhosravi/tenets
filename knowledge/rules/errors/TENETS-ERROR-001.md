---
id: TENETS-ERROR-001
title: Failure ownership follows architectural meaning
kind: rule
status: stable
category: errors
severity: error
profiles: ["core"]
related: ["TENETS-ERROR-002", "TENETS-ERROR-003", "TENETS-ERROR-004"]
aliases: []
---
## Rule

Define a failure beside the domain concept, application workflow, or port contract that gives the failure architectural meaning.

## Rationale

Meaningful ownership keeps failures precise and prevents one global technical hierarchy from coupling otherwise independent layers and bounded contexts.

## Incorrect

```text
shared/errors.py
  DomainException
  AdapterException
  Every project failure
```

## Correct

```text
ordering/domain/errors.py
ordering/application/errors.py
ordering/application/ports/payment_gateway_errors.py
```

## Remediation

Move each failure to its owning concept or contract and remove dependencies on global technical categories.

## Review check

For each failure, identify who can define its meaning without importing an outer technology.
