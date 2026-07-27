---
id: TENETS-ERROR-008
title: Failure types live with their owning concept or contract
kind: rule
status: stable
category: errors
severity: error
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-ERROR-001", "TENETS-CONTEXT-001", "TENETS-PATTERN-012"]
aliases: []
---
## Rule

Place failure types in cohesive modules owned by their domain concept, application capability, or port contract rather than in a global shared-kernel dumping ground.

## Rationale

File placement should expose ownership and dependency direction; a universal exceptions module obscures both and creates cross-context coupling.

## Incorrect

```text
shared_kernel/exceptions.py
  OrderAlreadySubmitted
  PaymentGatewayUnavailable
  OrderNotFound
```

## Correct

```text
ordering/domain/errors.py
ordering/application/errors.py
ordering/application/ports/payment_gateway_errors.py
```

## Remediation

Relocate failures to their owner; a small module may colocate one precise failure with the contract it describes.

## Review check

Inspect shared failure modules for unrelated bounded-context, workflow, port, protocol, or vendor concepts.
