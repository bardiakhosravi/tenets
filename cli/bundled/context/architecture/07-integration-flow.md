# Integration Flow Rules
- Primary adapters call primary ports (use cases)
- Use cases orchestrate domain objects and use secondary ports for external systems
- Secondary adapters implement secondary ports and handle external complexities
- Domain objects should never directly depend on adapters
- Use events for loose coupling between bounded contexts

```python
# Flow Example: Web Request → Controller → Use Case → Repository
class UserController:  # Primary Adapter
    def create_user(self, request) -> Response:
        command = CreateUserCommand(request.email, request.name)
        response = self._create_user_use_case.execute(command)  # → Primary Port
        return Response(201, {'user_id': response.user_id})

class CreateUserUseCase(CreateUserPort):  # Primary Port Implementation
    def execute(self, command: CreateUserCommand) -> CreateUserResponse:
        email = Email(command.email)
        user = User.create(email, command.name)
        self._user_repository.save(user)  # → Secondary Port
        self._email_service.send_welcome_email(email, command.name)  # → Secondary Port
        return CreateUserResponse(user.id.value)
```
