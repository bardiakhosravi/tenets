# Secondary Adapter Rules
- Secondary adapters implement secondary ports defined in domain/application layers
- Organize secondary adapters by technology for shared infrastructure and easier maintenance
- Should handle all external system complexities (database mapping, API calls, etc.)
- Must translate between domain objects and external representations
- Should not expose external system details to the domain
- Include error handling and retry logic when appropriate
- Keep technology-specific models/schemas within their adapter implementations

```python
# SQL Database Adapter - infrastructure/adapters/secondary/sql/sql_user_repository.py
class SqlUserRepository(UserRepository):
    def __init__(self, session: Session):
        self._session = session

    def save(self, user: User) -> None:
        user_model = UserModel(
            id=user.id.value,
            email=user.email.value,
            name=user.name,
            version=user.version
        )
        self._session.merge(user_model)

    def find_by_email(self, email: Email) -> Optional[User]:
        model = self._session.query(UserModel).filter_by(email=email.value).first()
        return self._to_domain(model) if model else None

    def _to_domain(self, model: UserModel) -> User:
        return User(
            id=UserId(model.id),
            email=Email(model.email),
            name=model.name
        )

# HTTP External Service Adapter - infrastructure/adapters/secondary/http/http_email_service.py
class HttpEmailNotificationAdapter(EmailNotificationPort):
    def __init__(self, http_client: HTTPClient, api_config: EmailAPIConfig):
        self._http_client = http_client
        self._api_config = api_config

    def send_welcome_email(self, user_email: Email, user_name: str) -> None:
        payload = {
            'to': user_email.value,
            'template': 'welcome',
            'variables': {'name': user_name}
        }
        response = self._http_client.post(
            f"{self._api_config.base_url}/send",
            json=payload,
            headers={'Authorization': f'Bearer {self._api_config.api_key}'}
        )
        if response.status_code != 200:
            raise EmailDeliveryError(f"Failed to send email: {response.text}")
```
