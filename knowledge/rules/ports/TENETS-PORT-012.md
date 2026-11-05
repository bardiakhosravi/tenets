---
id: TENETS-PORT-012
title: Secondary port contracts exclude infrastructure concepts
kind: rule
status: stable
category: ports
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-PORT-003", "TENETS-PORT-009", "TENETS-REPO-003", "TENETS-ADAPTER-005", "TENETS-API-004"]
aliases: []
---
## Rule

Secondary port and repository contracts never contain infrastructure concepts. Their names, methods, parameters, capability contracts, and results do not refer to storage systems, databases, queues, cloud services, vendors, or how they address data, such as `s3_prefix`, `bucket`, `table_name`, `topic_arn`, or `redis_key`. These terms belong inside the implementing adapter.

## Rationale

A port exists so its implementation can be replaced. If callers pass or receive an infrastructure address, every adapter must understand that technology and the use case must know how data is stored.

## Incorrect

```python
class S3InvoiceArchive(Protocol):
    def upload(self, bucket: str, s3_prefix: str, document: InvoiceDocument) -> str: ...
```

Renaming the parameter to `storage_prefix` hides the word but keeps the same concept.

## Correct

```python
class InvoiceArchive(Protocol):
    def store(self, document: InvoiceDocument) -> ArchivedInvoiceDocument: ...

class S3InvoiceArchive(InvoiceArchive):
    def __init__(self, client: S3Client, bucket: str, prefix: str) -> None: ...
```

## Remediation

Name the port for the capability, pass domain values, and return a semantic result. Move infrastructure addresses into the adapter's constructor configuration or private mapping.

## Review check

Search port and repository contracts for names, parameters, and result fields containing terms such as `s3`, `bucket`, `prefix`, `object_key`, `blob`, `table`, `topic`, `queue`, `arn`, `sql`, `redis`, or a vendor name, and challenge renamed equivalents such as `storage_path`.
