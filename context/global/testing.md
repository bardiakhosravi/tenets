# Testing Rules
- Write unit tests for domain logic without mocking domain objects
- **Test Ports in Isolation**: Mock secondary ports when testing use cases
- **Test Adapters Separately**: Test each adapter implementation independently
- **Integration Testing**: Use in-memory adapters for full workflow testing
- Test domain events are raised correctly
- Integration tests should test aggregate boundaries
- Use builders or factories for test data creation
- **Contract Testing**: Ensure all adapter implementations satisfy their port contracts
- **Use Case Testing**: Test each use case independently with mocked dependencies

```python
# Contract test for all UserRepository implementations
class UserRepositoryContractTest:
    def test_save_and_find_user(self, repository: UserRepository):
        # This test should pass for SqlUserRepository, MongoUserRepository, etc.
        user = User.create(Email("test@example.com"), "John")
        repository.save(user)
        found = repository.find_by_email(Email("test@example.com"))
        assert found is not None
        assert found.email == user.email

# Use Case Integration Test
class TestCreateUserUseCaseIntegration:
    def test_full_workflow_with_in_memory_adapters(self):
        # Arrange
        user_repo = InMemoryUserRepository()
        email_service = InMemoryEmailService()
        event_publisher = InMemoryEventPublisher()
        use_case = CreateUserUseCase(user_repo, email_service, event_publisher)

        # Act
        result = use_case.execute(CreateUserCommand("test@example.com", "John"))

        # Assert
        assert result.user_id is not None
        saved_user = user_repo.find_by_email(Email("test@example.com"))
        assert saved_user is not None
        assert len(email_service.sent_emails) == 1
        assert len(event_publisher.published_events) == 1

# Technology-specific adapter testing
class TestSqlUserRepository:
    def test_save_user_with_sql_models(self):
        # Arrange
        session = create_test_sql_session()
        repository = SqlUserRepository(session)
        user = User.create(Email("test@example.com"), "John")

        # Act
        repository.save(user)

        # Assert
        saved_user = repository.find_by_email(Email("test@example.com"))
        assert saved_user is not None
        assert saved_user.email == user.email

        # Verify SQL model was created correctly
        user_model = session.query(UserModel).filter_by(email="test@example.com").first()
        assert user_model is not None
        assert user_model.name == "John"

class TestMongoUserRepository:
    def test_save_user_with_mongo_schemas(self):
        # Arrange
        mongo_client = create_test_mongo_client()
        repository = MongoUserRepository(mongo_client)
        user = User.create(Email("test@example.com"), "John")

        # Act
        repository.save(user)

        # Assert
        saved_user = repository.find_by_email(Email("test@example.com"))
        assert saved_user is not None
        assert saved_user.email == user.email
```

## Validation and Error Handling Test Pattern
- Test domain logic in isolation without any adapters
- Test primary adapters by mocking primary ports
- Test secondary adapters by mocking external dependencies
- Use in-memory implementations of secondary ports for integration tests
- Test the full flow from primary adapter to secondary adapter for end-to-end tests

```python
# Testing with port isolation
class TestUserManagementService:
    def test_create_user_success(self):
        # Arrange
        mock_repo = Mock(spec=UserRepository)
        mock_events = Mock(spec=EventPublisherPort)
        service = UserManagementService(mock_repo, mock_events)

        # Act
        result = service.create_user(CreateUserCommand("test@example.com", "John"))

        # Assert
        mock_repo.save.assert_called_once()
        mock_events.publish.assert_called_once()
        assert isinstance(result.user_id, str)

# In-memory adapter for testing
class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self._users: dict[UserId, User] = {}

    def save(self, user: User) -> None:
        self._users[user.id] = user

    def find_by_email(self, email: Email) -> Optional[User]:
        return next((u for u in self._users.values() if u.email == email), None)
```
