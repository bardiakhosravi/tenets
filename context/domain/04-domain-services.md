# Domain Service Rules

## Domain Service Rules
- Create domain services ONLY when business logic doesn't naturally fit in entities or value objects
- Domain services should be stateless
- Use dependency injection for external dependencies
- Should operate on domain objects, not primitives
- Name services with domain language (not technical terms)

```python
class PricingService:
    def __init__(self, discount_repository: DiscountRepository):
        self._discount_repository = discount_repository

    def calculate_order_total(self, order: Order, customer: Customer) -> Money:
        # Complex pricing logic that spans multiple aggregates
        pass
```
