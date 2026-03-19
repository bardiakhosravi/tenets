# DDD + Hexagonal Architecture Synergy Rules

## Repository as Secondary Port Rules
- Repository interfaces are domain ports (interfaces in domain layer)
- Repository implementations are secondary adapters (in infrastructure layer)
- Repositories should work with Aggregate Roots and use domain language
- Repository adapters handle ORM mapping and database specifics
- Keep repository interfaces focused on domain needs, not database capabilities

## Use Case as Primary Port Implementation Rules
- Use cases implement primary ports and orchestrate domain objects
- They use both domain ports (repositories) and infrastructure ports (email, messaging)
- Should not contain business logic - delegate to domain objects
- Handle cross-cutting concerns like transactions and event publishing
- Serve as the application's use case boundary
- Each use case should represent exactly one business workflow

```python
class CreateUserUseCase(CreateUserPort):
    def __init__(
        self,
        user_repository: UserRepository,  # Domain port
        email_service: EmailNotificationPort,  # Infrastructure port
        event_publisher: EventPublisherPort,  # Infrastructure port
        unit_of_work: UnitOfWork
    ):
        self._user_repository = user_repository
        self._email_service = email_service
        self._event_publisher = event_publisher
        self._unit_of_work = unit_of_work

    def execute(self, command: CreateUserCommand) -> CreateUserResponse:
        with self._unit_of_work:
            email = Email(command.email)
            user = User.create(email, command.name)
            self._user_repository.save(user)  # Domain port
            self._email_service.send_welcome_email(email, command.name)  # Infrastructure port
            self._event_publisher.publish(UserCreated(user.id, email))  # Infrastructure port
            return CreateUserResponse(user.id.value)
```
