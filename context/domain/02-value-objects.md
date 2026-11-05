<!-- tenets:generated-source -->
# Value Objects

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-VALUE-001: Value objects are immutable and use value equality

## Rule

A value object is immutable and equality is determined by its complete semantic value.

## Rationale

Value objects describe what a value is, not which individual instance it is.

## Incorrect

```python
address.city = "Toronto"
```

## Correct

```python
@dataclass(frozen=True)
class ShippingAddress:
    street: str
    city: str
    postal_code: PostalCode
```

## Remediation

Prevent mutation and replace changed values with newly created value objects.

## Review check

Verify value objects have no identity equality, mutating methods, or externally writable state.

## TENETS-VALUE-002: Value objects represent semantic domain concepts

## Rule

Create a value object when a value has domain meaning, invariants, units, formatting, comparison rules, or behavior beyond its primitive representation.

## Rationale

Named semantic values prevent primitive confusion and centralize behavior belonging to the concept.

## Incorrect

```python
def authorize(amount: int, currency: str) -> None: ...
```

## Correct

```python
def authorize(amount: Money) -> None: ...
```

## Remediation

Replace related primitives with a cohesive domain value that owns their semantics.

## Review check

Challenge repeated primitives representing identity, money, quantity, date ranges, status, or validated text.

## TENETS-VALUE-003: Value invariants apply during creation and hydration

## Rule

Invariants intrinsic to a value object are enforced whenever it is instantiated, including both new creation and persistence hydration.

## Rationale

Persisted data does not become valid merely because it already exists; invalid values must not enter the domain model.

## Incorrect

```python
postal_code = object.__new__(PostalCode)
postal_code.value = row.postal_code
```

## Correct

```python
postal_code = PostalCode(row.postal_code)
```

## Remediation

Put intrinsic validation in the value object's construction path and map corrupted persistence data to an explicit adapter failure.

## Review check

Verify repository mappers cannot bypass value-object invariants.

## TENETS-VALUE-004: Value objects are instantiated directly

## Rule

A value object has one entry point: its constructor. Callers instantiate it directly, and it has no separate creation function or class factory. In Python, all validation and normalization live in `__post_init__`.

## Rationale

Creation functions separate creation-only behavior such as identity generation, defaults, and events from hydration. A value object has none of that behavior, so creating and hydrating it are the same operation. A second entry point adds indirection, and any validation placed in it is skipped when the constructor is used directly.

## Incorrect

```python
@dataclass(frozen=True)
class Quantity:
    value: int

def create_quantity(value: int) -> Quantity:
    if value <= 0:
        raise InvalidQuantity()
    return Quantity(value)

quantity = create_quantity(command.quantity)
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()

quantity = Quantity(command.quantity)
```

Normalization also belongs in `__post_init__`. It must be idempotent because hydration runs it too:

```python
@dataclass(frozen=True)
class CustomerEmail:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if "@" not in normalized:
            raise InvalidCustomerEmail()
        object.__setattr__(self, "value", normalized)
```

## Remediation

Move validation and normalization from the creation function into `__post_init__`, replace its calls with the constructor, and delete the function.

## Review check

Search value-object modules for `create_<value_object>()` functions and class factories, and verify that validation does not live outside the constructor path.

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

## TENETS-VALIDATE-001: Domain objects enforce domain invariants

## Rule

Entities, aggregates, and value objects enforce their own invariants explicitly on every lifecycle path where those invariants apply.

## Rationale

Domain validity must not depend on whether an object entered through HTTP, a use case, a repository mapper, or another adapter.

## Incorrect

```python
if request_body.quantity <= 0:
    raise BadRequest("quantity must be positive")
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()
```

## Remediation

Move business invariants into the domain type and retain only protocol-shape checks at the external boundary.

## Review check

Verify that every applicable creation, mutation, and hydration path passes through the domain invariant.
