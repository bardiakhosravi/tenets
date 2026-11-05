---
id: TENETS-ENTITY-003
title: Entities and aggregates exclude infrastructure concepts
kind: rule
status: stable
category: entities
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-ENTITY-002", "TENETS-AGGREGATE-001", "TENETS-NAME-002", "TENETS-DEPEND-001", "TENETS-VALUE-005"]
aliases: []
---
## Rule

An entity or aggregate never contains an infrastructure concept. Its name, attributes, properties, and methods do not refer to storage systems, databases, queues, cloud services, vendors, or how they address data, such as `s3_prefix`, `bucket`, `table_name`, `topic_arn`, or `redis_key`.

## Rationale

These terms pass import checks because they are plain strings, yet they tie the business model to a replaceable technology. Changing storage should not change an entity or require migrating its state.

## Incorrect

```python
@dataclass(eq=False)
class Invoice:
    id: InvoiceId
    customer_account_id: CustomerAccountId
    s3_prefix: str
```

Renaming the attribute to `storage_prefix` hides the word but keeps the same concept.

## Correct

```python
# billing/domain/invoice.py
@dataclass(eq=False)
class Invoice:
    id: InvoiceId
    customer_account_id: CustomerAccountId
    document: InvoiceDocument

# billing/adapters/secondary/s3_invoice_archive.py
def _map_invoice_document_to_s3_key(self, document: InvoiceDocument) -> str:
    return f"{self._prefix}/{document.invoice_id.value}/{document.file_name.value}"
```

## Remediation

Remove the attribute and let the secondary adapter derive the location from domain values and its configuration. If the location cannot be derived, the adapter stores its own record of it, keyed by domain identity.

## Review check

Search entities and aggregates for attributes and methods containing terms such as `s3`, `bucket`, `prefix`, `object_key`, `blob`, `table`, `topic`, `queue`, `arn`, `sql`, `redis`, or a vendor name, and challenge renamed equivalents such as `storage_path`.
