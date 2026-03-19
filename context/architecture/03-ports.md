# Port Definition Rules
- Ports define interfaces between layers and external systems
- **Primary ports** (driving) define application use cases - belong in application layer
- **Domain-driven secondary ports** (repositories, domain services) - belong in domain layer
- **Infrastructure secondary ports** (email, messaging, external APIs) - belong in application layer
- Port interfaces should use domain language, not technical terms
- Ports should be focused and follow Single Responsibility Principle

```python
# Primary Ports (Application Layer) - application/ports/primary/
class CreateUserPort(ABC):
    @abstractmethod
    def execute(self, command: CreateUserCommand) -> CreateUserResponse:
        pass

class ChangeUserEmailPort(ABC):
    @abstractmethod
    def execute(self, command: ChangeEmailCommand) -> None:
        pass

# Domain-Driven Secondary Ports (Domain Layer) - domain/repositories/
class UserRepository(ABC):  # Already shown in rule 5
    @abstractmethod
    def find_by_email(self, email: Email) -> Optional[User]:
        pass

# Domain Services (Domain Layer) - domain/services/
class PricingServicePort(ABC):
    @abstractmethod
    def calculate_product_price(self, product: Product, customer: Customer) -> Money:
        pass

# Infrastructure Secondary Ports (Application Layer) - application/ports/secondary/
class EmailNotificationPort(ABC):
    @abstractmethod
    def send_welcome_email(self, user_email: Email, user_name: str) -> None:
        pass

    @abstractmethod
    def send_email_change_notification(self, old_email: Email, new_email: Email) -> None:
        pass

class EventPublisherPort(ABC):
    @abstractmethod
    def publish(self, event: DomainEvent) -> None:
        pass
```
