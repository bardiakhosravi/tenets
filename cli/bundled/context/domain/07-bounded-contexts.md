# Bounded Context Rules

## Bounded Context Rules
- Each bounded context represents a distinct area of the business with its own ubiquitous language
- A bounded context MUST have its own domain model — never share entities across contexts
- Communication between bounded contexts should use domain events or an Anti-Corruption Layer (ACL)
- Shared concepts between contexts should be expressed as separate value objects in each context, not shared classes
- Define context maps to document relationships between bounded contexts (e.g., Upstream/Downstream, Conformist, Customer-Supplier)
- Each bounded context may have its own package structure following the hexagonal layout

```python
# Context Map Example:
# [Identity Context] --domain events--> [Notification Context]
# [Order Context] --ACL--> [Inventory Context]

# BAD: sharing a User entity between contexts
from identity.domain.model.user import User  # Don't import across contexts

# GOOD: each context defines its own representation
# identity/domain/model/user.py
@dataclass
class User:
    id: UserId
    email: Email
    credentials: HashedPassword

# ordering/domain/model/customer.py — separate concept, same real-world person
@dataclass(frozen=True)
class CustomerId:
    value: str

@dataclass
class Customer:
    id: CustomerId
    name: str
    shipping_address: Address

# Anti-Corruption Layer translates between contexts
class IdentityContextACL:
    """Translates Identity context concepts into Ordering context concepts."""
    def __init__(self, identity_api: IdentityQueryPort):
        self._identity_api = identity_api

    def resolve_customer(self, user_id: str) -> Customer:
        user_data = self._identity_api.get_user(user_id)
        return Customer(
            id=CustomerId(user_data.user_id),
            name=user_data.name,
            shipping_address=Address(user_data.default_address)
        )
```
