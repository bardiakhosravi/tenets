# Infrastructure Replaceability Rules
- Every external dependency (database, message broker, email provider, cache) MUST be accessed through a port interface
- Swapping an infrastructure component should require ONLY a new adapter implementation and a DI container change — zero domain or application layer modifications
- No adapter-specific types (e.g., SQLAlchemy `Session`, MongoDB `Collection`) may appear outside the infrastructure layer
- Validate replaceability by ensuring all adapter implementations pass the same contract tests for their port

```python
# Good: DI container is the only place that knows which adapter is active
class DIContainer:
    def user_repository(self) -> UserRepository:
        # Switch from SQL to Mongo by changing this single line
        return SqlUserRepository(self._sql_session)
        # return MongoUserRepository(self._mongo_client)
```
