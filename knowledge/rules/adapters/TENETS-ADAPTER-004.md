---
id: TENETS-ADAPTER-004
title: Secondary adapters implement and translate port contracts
kind: rule
status: stable
category: adapters
severity: error
profiles: ["core"]
related: ["TENETS-PORT-004", "TENETS-PORT-009", "TENETS-ADAPTER-005"]
aliases: []
---
## Rule

A secondary adapter implements an inward-facing port and translates between its semantic types and one external technology or published contract.

## Rationale

Explicit translation preserves the port contract while containing external representation changes.

## Incorrect

```python
class StripeClient:
    def post(self, payload: dict) -> StripeResponse: ...
```

## Correct

```python
class StripePaymentGateway(PaymentGateway):
    def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation:
        response = self._client.authorize(_map_authorization_to_stripe(request))
        return _map_stripe_response_to_confirmation(response)
```

## Remediation

Implement the consuming port directly and add directional mapping at the adapter boundary.

## Review check

Verify the adapter's public methods exactly preserve the inward-facing contract.
