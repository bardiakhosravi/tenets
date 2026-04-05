# Cross-Context Communication Rules

## In-Process Cross-Context Communication (Modular Monolith)

When one bounded context module needs data from another module in the same monolith:

- The consuming module defines its own **port** (ABC) in its domain layer describing what it needs
- The providing module exposes a **public query service** as a dedicated file — the only thing other modules may import
- An **adapter** in the consuming module's infrastructure layer wraps the query service behind the port
- The consuming module's domain and application layers MUST NOT import the providing module's internal code (entities, repositories, value objects)
- This enables extraction to microservices later — swap the in-process adapter for an HTTP adapter with zero domain changes

```python
# Providing module exposes a public query service
class InventoryQueryService:
    def check_availability(self, product_id: str, quantity: int) -> bool: ...

# Consuming module defines its own port
class InventoryPort(ABC):
    @abstractmethod
    def check_availability(self, product_id: str, quantity: int) -> bool: ...

# Consuming module's adapter wraps the query service
class InProcessInventoryAdapter(InventoryPort):
    def __init__(self, service: InventoryQueryService):
        self._service = service

    def check_availability(self, product_id: str, quantity: int) -> bool:
        return self._service.check_availability(product_id, quantity)
```

## Cross-Service Communication (Different Processes)

When a bounded context needs to call an external service or a context running as a separate service:

- The consuming module defines a **port** (ABC) in its domain layer
- An **HTTP adapter** in infrastructure implements the port using an HTTP client
- Only the bounded context that **owns** an external system should talk to it directly — other modules call that context's API through their own port + adapter
- Service-to-service authentication should use dedicated service account credentials, not user tokens
- The adapter maps HTTP errors to domain or adapter exceptions — the domain layer never sees HTTP status codes
