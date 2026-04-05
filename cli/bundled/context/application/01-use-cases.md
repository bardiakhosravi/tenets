# Use Case Rules
- Use cases represent single business operations that the application can perform
- Each use case should handle exactly one business workflow
- Use cases orchestrate domain objects but contain no business logic
- Should be stateless and focused on a single responsibility
- Handle cross-cutting concerns (transactions, events, etc.)
- Use cases return **domain objects** (entities, aggregates). The primary adapter (controller) is responsible for mapping domain objects to external representations (e.g., Pydantic response models, JSON). This follows hexagonal architecture — adapters are the translation layer, not use cases. (Note: Clean Architecture prescribes response DTOs from use cases, but in hexagonal architecture the adapter handles this translation.)
- Name use cases after business operations using domain language

```python
class CreateUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        unit_of_work: UnitOfWork,
        event_publisher: EventPublisher
    ):
        self._user_repository = user_repository
        self._unit_of_work = unit_of_work
        self._event_publisher = event_publisher

    def execute(self, command: CreateUserCommand) -> CreateUserResponse:
        with self._unit_of_work:
            # Orchestration logic only
            email = Email(command.email)
            user = User.create(email, command.name)
            self._user_repository.save(user)
            self._event_publisher.publish(UserCreated(user.id, email))
            return CreateUserResponse(user.id.value)

class ChangeUserEmailUseCase:
    def __init__(self, user_repository: UserRepository, unit_of_work: UnitOfWork):
        self._user_repository = user_repository
        self._unit_of_work = unit_of_work

    def execute(self, command: ChangeEmailCommand) -> None:
        with self._unit_of_work:
            user = self._user_repository.find_by_id(command.user_id)
            if not user:
                raise UserNotFoundError(command.user_id)
            user.change_email(Email(command.new_email))
            self._user_repository.save(user)
```
