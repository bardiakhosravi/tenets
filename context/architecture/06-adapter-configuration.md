# Adapter Configuration Rules
- Use Dependency Injection container to wire adapters to ports
- Configuration should happen at application startup in a composition root
- Adapters should be configurable through environment variables or config files
- Use factory patterns for complex adapter creation
- Keep configuration separate from business logic
- Configuration layer manages all technology-specific adapter instantiation

```python
# Configuration Layer - configuration/di_container.py
class DIContainer:
    def __init__(self, config: Config):
        self._config = config
        self._sql_session = self._create_sql_session()
        self._mongo_client = self._create_mongo_client()
        self._http_client = self._create_http_client()

    # Domain port implementations (SQL technology)
    def sql_user_repository(self) -> UserRepository:
        return SqlUserRepository(self._sql_session)

    # Domain port implementations (MongoDB technology)
    def mongo_user_repository(self) -> UserRepository:
        return MongoUserRepository(self._mongo_client)

    # Infrastructure port implementations
    def http_email_notification_service(self) -> EmailNotificationPort:
        return HttpEmailNotificationAdapter(
            self._http_client,
            self._config.email_api_config
        )

    def rabbitmq_event_publisher(self) -> EventPublisherPort:
        return RabbitMqEventPublisher(
            connection=self._create_rabbitmq_connection()
        )

    # Use case implementations
    def create_user_use_case(self) -> CreateUserPort:
        return CreateUserUseCase(
            user_repository=self.sql_user_repository(),  # Choose technology
            email_service=self.http_email_notification_service(),
            event_publisher=self.rabbitmq_event_publisher(),
            unit_of_work=UnitOfWork(self._sql_session)
        )
```
