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

class SendWelcomeEmailHandler:
    def __init__(
        self,
        email_service: EmailNotificationPort,
        idempotency_store: IdempotencyStorePort
    ):
        self._email_service = email_service
        self._idempotency_store = idempotency_store

    def handle(self, event: UserCreated) -> None:
        key = IdempotencyKey(f"welcome_email:{event.user_id.value}")
        if self._idempotency_store.has_been_processed(key):
            return  # Already handled — skip
        self._email_service.send_welcome_email(event.email, event.name)
        self._idempotency_store.mark_processed(key)
```
