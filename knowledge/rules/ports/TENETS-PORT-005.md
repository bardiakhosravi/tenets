---
id: TENETS-PORT-005
title: Secondary capabilities never receive repositories
kind: rule
status: stable
category: ports
severity: error
profiles: ["core"]
related: ["TENETS-APP-003", "TENETS-PORT-006", "TENETS-PORT-011"]
aliases: []
---
## Rule

Never pass a repository to a secondary port or adapter. A non-repository secondary adapter must not construct, inject, or call repositories internally.

## Rationale

Repositories are application orchestration dependencies. Giving one to another outbound capability creates hidden loading and mixes persistence with infrastructure execution.

## Incorrect

```python
self._email_port.send_invoice(invoice, self._customer_repository)
```

## Correct

```python
customer = self._customers.get(invoice.customer_id)
self._email_port.send_invoice(customer, invoice)
```

## Remediation

Move every required load into the use case and change the port contract to accept the resulting semantic objects.

## Review check

Search secondary adapter constructors and public methods for repository parameters, imports, lookups, or service-locator access.
