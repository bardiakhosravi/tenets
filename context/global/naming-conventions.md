# Naming Convention Rules
- Use domain language (Ubiquitous Language) for all class and method names
- Avoid technical terms in domain layer (no "Manager", "Helper", "Util")
- Use intention-revealing names for methods
- Value objects should be named after the concept they represent
- Repository methods should reflect business queries
- **Port Naming**: End primary ports with "Port", secondary ports with "Port"
- **Adapter Naming**: Include the technology/framework in secondary adapter names
- **Clear Port vs Adapter distinction**: Ports define interfaces, Adapters implement them

```python
# Good port names
class UserManagementPort(ABC): pass           # Primary port
class EmailNotificationPort(ABC): pass       # Secondary port
class PaymentProcessingPort(ABC): pass       # Secondary port

# Good adapter names
class RestUserController:                    # Primary adapter (REST)
class GraphQLUserController:                 # Primary adapter (GraphQL)
class SqlUserRepository(UserRepository):     # Secondary adapter (SQL)
class MongoUserRepository(UserRepository):   # Secondary adapter (MongoDB)
class SmtpEmailAdapter(EmailNotificationPort): # Secondary adapter (SMTP)
class SendGridEmailAdapter(EmailNotificationPort): # Secondary adapter (SendGrid)
```
