# Cross-Cutting Concern Rules
- Handle infrastructure concerns (logging, metrics, caching) in adapters
- Use decorators or middleware patterns for cross-cutting concerns
- Keep domain objects free from infrastructure dependencies
- Implement concerns like retries, circuit breakers in secondary adapters
- Use aspect-oriented patterns at the adapter boundaries

```python
# Decorator for logging in adapters
def logged_repository(func):
    def wrapper(*args, **kwargs):
        logger.info(f"Repository operation: {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"Operation successful: {func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Operation failed: {func.__name__}, error: {e}")
            raise
    return wrapper

class SqlUserRepository(UserRepository):
    @logged_repository
    def save(self, user: User) -> None:
        # Implementation
        pass
```
