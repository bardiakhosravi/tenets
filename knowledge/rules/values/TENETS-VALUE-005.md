---
id: TENETS-VALUE-005
title: Value objects exclude infrastructure concepts
kind: rule
status: stable
category: values
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-VALUE-002", "TENETS-NAME-002", "TENETS-DEPEND-001", "TENETS-API-004", "TENETS-ENTITY-003", "TENETS-PORT-012"]
aliases: []
---
## Rule

A value object never contains an infrastructure concept. Its name, attributes, properties, and methods do not refer to storage systems, databases, queues, cloud services, vendors, or how they address data, such as `s3_prefix`, `bucket`, `table_name`, `topic_arn`, or `redis_key`.

## Rationale

These terms pass import checks because they are plain strings, yet they make a replaceable technology part of the domain model. Changing storage should not change a value object, and a reader should not need to know the storage system to understand one.

## Incorrect

```python
@dataclass(frozen=True)
class InvoiceDocument:
    s3_prefix: str
    file_name: str
```

Renaming the attribute to `storage_prefix` hides the word but keeps the same concept.

## Correct

```python
# billing/domain/invoice_document.py
@dataclass(frozen=True)
class InvoiceDocument:
    invoice_id: InvoiceId
    file_name: FileName

# billing/adapters/secondary/s3_invoice_archive.py
def _map_invoice_document_to_s3_key(self, document: InvoiceDocument) -> str:
    return f"{self._prefix}/{document.invoice_id.value}/{document.file_name.value}"
```

## Remediation

Identify the business concept the value represents and model that instead. Derive the infrastructure address inside the secondary adapter from domain values and adapter configuration.

## Review check

Search value objects for attributes and methods containing terms such as `s3`, `bucket`, `prefix`, `object_key`, `blob`, `table`, `topic`, `queue`, `arn`, `sql`, `redis`, or a vendor name, and challenge renamed equivalents such as `storage_path`.
