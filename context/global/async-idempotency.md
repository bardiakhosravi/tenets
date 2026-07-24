# Asynchronous Workflow Idempotency Rules
- All asynchronous operations (event handlers, message consumers, background tasks) MUST be idempotent
- Use idempotency keys or natural deduplication identifiers for every async operation
- Design handlers so that processing the same message twice produces the same outcome as processing it once
- Store processing status to detect and skip duplicate executions
- Never rely on message delivery guarantees alone — always code for at-least-once delivery

```python
@dataclass(frozen=True)
class IdempotencyKey:
    value: str


def create_idempotency_key(value: str) -> IdempotencyKey:
    return IdempotencyKey(value=value)


class SendWelcomeEmailHandler:
    def __init__(
        self,
        email_service: EmailNotificationPort,
        idempotency_store: IdempotencyStorePort
    ):
        self._email_service = email_service
        self._idempotency_store = idempotency_store

    def handle(self, event: UserCreated) -> None:
        key = create_idempotency_key(f"welcome_email:{event.user_id}")
        if self._idempotency_store.has_been_processed(key):
            return  # Already handled — skip
        message = WelcomeEmail(
            recipient=create_email(event.email),
            display_name=event.name,
        )
        self._email_service.send_welcome_email(message)
        self._idempotency_store.mark_processed(key)
```
