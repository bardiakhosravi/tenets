<!-- tenets:generated-source -->
# Ubiquitous Language

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-NAME-001: Domain names follow ubiquitous language

## Rule

Names in domain models, use cases, ports, events, and tests — and internal helper functions, private methods, local variables, and parameters — use the terminology and distinctions agreed for their bounded context. Do not introduce a term that is not part of that context's ubiquitous language.

## Rationale

Consistent language makes code communicate the business model and exposes conceptual disagreement. It also governs how coding agents describe the system: an off-glossary name propagates into the agent's explanations and silently becomes the vocabulary it uses with the developer, breaking the shared language between human and agent — not only code readability.

## Incorrect

```python
class ProcessDataService: ...
```

```python
class RegisterUserUseCase:
    def execute(self, command: RegisterUser) -> None:
        user = register_user(command.email)
        self._inventory(user)          # "inventory" is nowhere in the domain

    def _inventory(self, user: User) -> None:
        self._users.add(user)
```

## Correct

```python
class SubmitOrderUseCase: ...
```

```python
class RegisterUserUseCase:
    def execute(self, command: RegisterUser) -> None:
        user = register_user(command.email)
        self._users.add(user)          # no needless helper; if extracted, name it
                                        # from the glossary, e.g. _add_registered_user
```

## Remediation

Replace generic or inconsistent terms with the context's accepted business vocabulary. Check each name — including private helpers and locals — against the bounded context's glossary; if the term is not there, rename it to an agreed term or raise the language gap, never coin a new one silently.

## Review check

Compare code names with requirements, examples, and neighbouring domain concepts for semantic drift, including private helpers, local variables, and parameters. Verify every code identifier maps to a term in the context's ubiquitous language and flag invented terms such as a generic `inventory` used for persistence.

## TENETS-NAME-002: Domain names exclude technology and vendor terminology

## Rule

Domain types, attributes, behavior, and events are named for business meaning, never databases, transports, frameworks, vendors, or implementation mechanisms.

## Rationale

Technology names in the domain make replaceable implementation choices part of the business model.

## Incorrect

```python
class StripePaymentCompleted: ...
class SqlOrder: ...
```

## Correct

```python
class PaymentAuthorized: ...
class Order: ...
```

## Remediation

Move implementation-specific names to adapters and rename inward concepts around their business meaning.

## Review check

Search domain type and attribute names for vendor, protocol, framework, database, queue, and serialization terminology.

## TENETS-VALUE-005: Value objects exclude infrastructure concepts

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

## TENETS-API-004: Primary port contracts exclude infrastructure concepts

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

## TENETS-ENTITY-003: Entities and aggregates exclude infrastructure concepts

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

## TENETS-PORT-012: Secondary port contracts exclude infrastructure concepts

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

## TENETS-CONTEXT-001: Each bounded context owns its model and language

## Rule

Each bounded context owns the definitions, invariants, and language of its domain model. Similar terms in different contexts may intentionally have different structures and meanings.

## Rationale

Explicit ownership prevents a shared enterprise model from coupling independently evolving business capabilities.

## Incorrect

```text
Ordering, Billing, and Shipping all import one global Customer entity.
```

## Correct

```text
Ordering owns CustomerReferenceId; Billing owns BillingAccount; Customer Accounts owns Customer.
```

## Remediation

Assign each concept to a context and translate across published boundaries instead of sharing internal models.

## Review check

Verify every domain type has one owning context and cross-context similarities do not imply shared implementation.

## TENETS-PORT-003: Ports represent one focused capability

## Rule

A port contract represents one cohesive capability in ubiquitous language. It does not expose a generic client, utility surface, or multi-step workflow.

## Rationale

Focused ports isolate change and prevent infrastructure-oriented abstractions from shaping application workflows.

## Incorrect

```python
class ExternalServices(Protocol):
    def request(self, method: str, url: str, payload: dict) -> dict: ...
```

## Correct

```python
class PaymentGateway(Protocol):
    def authorize(self, payment: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Replace generic operations with the smallest business capability the consumer requires.

## Review check

Confirm that the port name and methods can be understood without knowing the selected vendor or transport.
