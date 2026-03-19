# Dependency Rules
- Domain layer should have no external dependencies except standard library
- Application layer can depend on domain but should use dependency inversion for external concerns
- Infrastructure layer implements all external dependencies through adapters
- **Domain Port Dependencies**: Domain objects can depend on domain ports (repositories, domain services)
- **Infrastructure Port Dependencies**: Use cases depend on infrastructure ports for external concerns
- **Port Placement**: Domain ports in domain layer, infrastructure ports in application layer
- **Inversion of Control**: Use DI container to wire adapters to ports at startup
- Use dependency inversion - depend on abstractions, not concretions
- Inject dependencies through constructors
- Use factory pattern for complex object creation

```python
# Domain layer - can depend on domain ports
class User:  # Domain entity
    def __init__(self, id: UserId, email: Email, name: str):
        self.id = id
        self.email = email
        self.name = name

    def change_email(self, new_email: Email) -> None:
        # Business logic here
        self.email = new_email

class UserDomainService:  # Domain service
    def __init__(self, user_repo: UserRepository):  # Domain port dependency
        self._user_repo = user_repo

    def is_email_unique(self, email: Email) -> bool:
        existing_user = self._user_repo.find_by_email(email)
        return existing_user is None

# Application layer - depends on domain + infrastructure ports
class CreateUserUseCase(CreateUserPort):
    def __init__(
        self,
        user_repo: UserRepository,  # Domain port
        user_domain_service: UserDomainService,  # Domain service
        email_service: EmailNotificationPort,  # Infrastructure port
        event_publisher: EventPublisherPort  # Infrastructure port
    ):
        self._user_repo = user_repo
        self._user_domain_service = user_domain_service
        self._email_service = email_service
        self._event_publisher = event_publisher

# Infrastructure layer - implements ports with external dependencies
class SqlUserRepository(UserRepository):  # Implements domain port
    def __init__(self, session: SqlAlchemySession):  # External dependency
        self._session = session

class SmtpEmailAdapter(EmailNotificationPort):  # Implements infrastructure port
    def __init__(self, smtp_client: SMTPClient):  # External dependency
        self._smtp_client = smtp_client
```
