# Ubiquitous Language Rules

## Ubiquitous Language Rules
- Every class, method, variable, and event name in the domain layer MUST use terms from the business domain
- Maintain a glossary of domain terms per bounded context — developers and domain experts must agree on definitions
- If a term is ambiguous across contexts, it belongs in separate bounded contexts with context-specific definitions
- Code reviews should flag technical jargon in the domain layer (e.g., "Manager", "Processor", "Handler", "Helper", "Util")
- Refactor immediately when the team discovers a better domain term — language drift erodes the model

```python
# BAD: technical jargon in domain layer
class OrderProcessor:
    def process_order(self, data: dict) -> None: ...

class UserDataManager:
    def handle_user_update(self, payload: dict) -> None: ...

# GOOD: ubiquitous language from the domain
class OrderFulfillment:
    def fulfill(self, order: Order) -> Shipment: ...

class Enrollment:
    def enroll_child(self, child: Child, program: Program) -> EnrollmentConfirmation: ...
```
