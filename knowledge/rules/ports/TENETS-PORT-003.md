---
id: TENETS-PORT-003
title: Ports represent one focused capability
kind: rule
status: stable
category: ports
severity: error
profiles: ["core"]
related: ["TENETS-PORT-006", "TENETS-PORT-011"]
aliases: []
---
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
