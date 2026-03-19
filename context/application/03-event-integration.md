# Event Integration Rules
- Domain events should be published through infrastructure ports
- Event handlers can be implemented as separate use cases
- Use event-driven architecture for cross-bounded context communication
- Events enable loose coupling between adapters and domain logic
- Consider eventual consistency for distributed operations

```python
# Event Publishing through Infrastructure Port
class EventPublisherPort(ABC):  # Application layer
    @abstractmethod
    def publish(self, event: DomainEvent) -> None:
        pass

class CreateUserUseCase(CreateUserPort):
    def __init__(
        self,
        user_repo: UserRepository,  # Domain port
        event_publisher: EventPublisherPort  # Infrastructure port
    ):
        self._user_repo = user_repo
        self._event_publisher = event_publisher

    def execute(self, command: CreateUserCommand) -> CreateUserResponse:
        user = User.create(Email(command.email), command.name)
        self._user_repo.save(user)  # Domain port
        self._event_publisher.publish(UserCreated(user.id, user.email))  # Infrastructure port
        return CreateUserResponse(user.id.value)

# Event Handler as Use Case
class SendWelcomeEmailUseCase:
    def __init__(self, email_service: EmailNotificationPort):  # Infrastructure port
        self._email_service = email_service

    def handle(self, event: UserCreated) -> None:
        self._email_service.send_welcome_email(event.email, event.name)
```
