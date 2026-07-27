---
id: TENETS-COMPOSE-002
title: Technology configuration remains outside business logic
kind: rule
status: stable
category: composition
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-COMPOSE-001", "TENETS-DEPEND-001", "TENETS-DEPEND-002"]
aliases: []
---
## Rule

Environment variables, connection settings, credentials, vendor selection, framework configuration, and deployment concerns remain in configuration and composition modules.

## Rationale

Business behavior should not change shape based on how a service is deployed or which adapter is selected.

## Incorrect

```python
if os.environ["PAYMENT_PROVIDER"] == "stripe":
    order.mark_payment_pending()
```

## Correct

```python
payment_gateway = StripePaymentGateway(settings.stripe)
submit_order = SubmitOrderUseCase(payment_gateway=payment_gateway)
```

## Remediation

Move technology and environment decisions to typed configuration and the composition root.

## Review check

Inspect domain and application code for environment access, credentials, connection strings, and vendor-selection branches.
