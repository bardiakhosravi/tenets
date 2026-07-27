---
id: TENETS-PORT-004
title: External dependencies are accessed through ports
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-DEPEND-002", "TENETS-ADAPTER-004", "TENETS-PORT-003"]
aliases: []
---
## Rule

Application workflows access persistence, messaging, external services, clocks, identity generation, and other replaceable external capabilities through inward-owned port contracts.

## Rationale

Ports isolate business workflows from technology selection and provide explicit test boundaries.

## Incorrect

```python
response = requests.post("https://payments.example/authorize", json=payload)
```

## Correct

```python
confirmation = payment_gateway.authorize(authorization)
```

## Remediation

Define the focused capability required by the consumer, implement it in an adapter, and inject the port into the use case.

## Review check

Find direct I/O or external-library calls in domain and application code.
