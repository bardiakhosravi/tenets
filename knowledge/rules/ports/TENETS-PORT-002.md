---
id: TENETS-PORT-002
title: Port placement follows capability ownership
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-CONTEXT-004", "TENETS-PORT-003"]
aliases: []
---
## Rule

Place a port in the domain when it expresses a domain-required capability. Place it in the application when it exists for orchestration, reporting, enrichment, or another application workflow concern.

## Rationale

Port ownership is determined by the consumer's language and purpose, not by the provider, protocol, or adapter technology.

## Incorrect

```text
All outbound ports are forced into domain/ports because they call external systems.
```

## Correct

```text
domain/ports/fraud_assessment.py
application/ports/customer_directory.py
```

## Remediation

Describe the capability from the consuming context's perspective, then move the contract to the layer that owns that meaning.

## Review check

Ask whether domain behavior requires the capability or whether only a use case needs it to coordinate work.
