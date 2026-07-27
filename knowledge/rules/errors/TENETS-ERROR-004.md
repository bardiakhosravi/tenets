---
id: TENETS-ERROR-004
title: Expected outbound failures are declared beside their port
kind: rule
status: stable
category: errors
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-004", "TENETS-ADAPTER-006", "TENETS-ERROR-005"]
aliases: []
---
## Rule

Declare each expected outbound failure that a use case may handle beside the consuming port contract.

## Rationale

Expected failure semantics are part of the capability contract and must not be invented independently by an adapter implementation.

## Incorrect

```python
except StripeConnectionError:
    raise AdapterException()
```

## Correct

```python
class PaymentGatewayUnavailable(Exception):
    pass

class PaymentGateway(Protocol):
    def authorize(self, request: PaymentAuthorization) -> PaymentAuthorizationResult: ...
```

## Remediation

Name the expected capability failure in application or domain language and document it with the port that consumers depend upon.

## Review check

Confirm that every expected adapter failure handled inward has a precise port-owned contract type.
