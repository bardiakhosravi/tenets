# Use Case Rules
- Use cases represent single business operations that the application can perform
- Each use case should handle exactly one business workflow
- Use cases orchestrate domain objects but contain no business logic
- When a workflow creates a new domain object, the use case calls the module-level creation function and supplies every available input that belongs to the valid initial state
- A use case MUST NOT create an incomplete object and immediately mutate it to apply creation data that was already available
- Objects returned by repositories are already hydrated; use cases invoke domain behavior on them and do not recreate them
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
            email = create_email(command.email)
            user = create_user(email=email, name=command.name)
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
            user.change_email(create_email(command.new_email))
            self._user_repository.save(user)
```
