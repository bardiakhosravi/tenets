# Cross-Context Communication Rules

## In-Process Cross-Context Communication (Modular Monolith)

When one bounded context module needs data from another module in the same monolith:

- The consuming module defines its own **port** (ABC) in its domain layer describing what it needs
- The providing module exposes a **public query service** as a dedicated file — the only thing other modules may import
- An **adapter** in the consuming module's infrastructure layer wraps the query service behind the port
- The consuming module's domain and application layers MUST NOT import the providing module's internal code (entities, repositories, value objects)
- This enables extraction to microservices later — swap the in-process adapter for an HTTP adapter with zero domain changes

```python
@dataclass(frozen=True)
class InventoryAvailabilityRequest:
    product_id: str
    quantity: int


@dataclass(frozen=True)
class InventoryAvailabilityResponse:
    is_available: bool


# Providing module exposes a published request/response contract.
class InventoryQueryService:
    def check_availability(
        self,
        request: InventoryAvailabilityRequest,
    ) -> InventoryAvailabilityResponse:
        ...

# Consuming module defines local semantic types and its own port.
@dataclass(frozen=True)
class InventoryProductId:
    value: str


def create_inventory_product_id(raw_value: str) -> InventoryProductId:
    return InventoryProductId(value=raw_value)


@dataclass(frozen=True)
class Quantity:
    value: int


def create_quantity(value: int) -> Quantity:
    if value <= 0:
        raise InvalidQuantityError(value)
    return Quantity(value=value)


@dataclass(frozen=True)
class Availability:
    is_available: bool


def create_availability(is_available: bool) -> Availability:
    return Availability(is_available=is_available)


class InventoryPort(ABC):
    @abstractmethod
    def check_availability(
        self,
        product_id: InventoryProductId,
        quantity: Quantity,
    ) -> Availability:
        ...

# Consuming module's adapter unwraps local values at the external boundary.
class InProcessInventoryAdapter(InventoryPort):
    def __init__(self, service: InventoryQueryService):
        self._service = service

    def check_availability(
        self,
        product_id: InventoryProductId,
        quantity: Quantity,
    ) -> Availability:
        response = self._service.check_availability(
            InventoryAvailabilityRequest(
                product_id=product_id.value,
                quantity=quantity.value,
            )
        )
        return create_availability(response.is_available)
```

## Validating Cross-Context Reference IDs

When a use case creates or updates a relationship to an entity owned by another bounded context:

- Store the external entity's ID as a local reference ID value object
- Use primitive IDs only in serialized transport, persistence, integration-event, or external-system representations
- Validate the referenced entity through the owning context's public contract before persisting the relationship
- Do not import the owning context's repositories, aggregates, entities, or domain value objects
- Keep the validation in the application workflow or adapter boundary; do not make the referencing aggregate query another context

Example:

```text
Staff Management receives school_id.
Staff Management validates the school through School Management's public contract.
Staff Management stores school_id as a local SchoolId reference on StaffSchoolAssignment.
Staff Management does not import School Management's SchoolId value object.
```

## Cross-Service Communication (Different Processes)

When a bounded context needs to call an external service or a context running as a separate service:

- The consuming module defines a **port** (ABC) in its domain layer
- An **HTTP adapter** in infrastructure implements the port using an HTTP client
- Only the bounded context that **owns** an external system should talk to it directly — other modules call that context's API through their own port + adapter
- Service-to-service authentication should use dedicated service account credentials, not user tokens
- The adapter maps HTTP errors to domain or adapter exceptions — the domain layer never sees HTTP status codes
