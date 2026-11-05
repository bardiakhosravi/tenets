---
id: TENETS-API-004
title: Primary port contracts exclude infrastructure concepts
kind: rule
status: stable
category: api
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-API-001", "TENETS-API-002", "TENETS-ADAPTER-005", "TENETS-APP-007", "TENETS-VALUE-005", "TENETS-PORT-012"]
aliases: []
---
## Rule

The inputs and outputs of a primary port never contain infrastructure concepts. This covers primary adapter request and response models, whatever library defines them, and application commands, queries, and results. Their fields do not refer to storage systems, databases, queues, cloud services, vendors, or how they address data, such as `s3_prefix`, `bucket`, `table_name`, `topic_arn`, or `redis_key`.

## Rationale

Callers should describe what they want in business terms. An infrastructure field makes a storage choice part of the public contract, so replacing the technology breaks clients, and it lets callers steer where data is stored. Checks on types and imports miss this because the field is a plain string.

## Incorrect

```python
class ExportInvoicesRequest(BaseModel):
    s3_prefix: str

class InvoiceExportResponse(BaseModel):
    s3_bucket: str
    s3_key: str

@dataclass(frozen=True)
class ExportInvoicesCommand:
    s3_prefix: str
```

Renaming the field to `storage_prefix` hides the word but keeps the same concept.

## Correct

```python
class ExportInvoicesRequest(BaseModel):
    billing_period: str

class InvoiceExportResponse(BaseModel):
    export_id: str
    download_url: str

@dataclass(frozen=True)
class ExportInvoicesCommand:
    billing_period: BillingPeriod
```

Fields the protocol itself needs, such as a pagination cursor or `download_url`, are not infrastructure concepts.

## Remediation

Replace the field with the business concept the caller actually means. Let the secondary adapter choose the infrastructure location from domain values and its own configuration.

## Review check

Search request and response models, commands, queries, and results for fields containing terms such as `s3`, `bucket`, `prefix`, `object_key`, `blob`, `table`, `topic`, `queue`, `arn`, `sql`, `redis`, or a vendor name, and challenge renamed equivalents such as `storage_path`.
