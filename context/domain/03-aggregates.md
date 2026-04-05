# Aggregate Rules

## Aggregate Rules
- Aggregates MUST have a single Aggregate Root (an Entity)
- Only the Aggregate Root should be directly accessible from outside
- Internal entities within an aggregate should be accessed through the root
- Aggregate boundaries should align with transaction boundaries
- Use factory methods on aggregates for complex creation logic
- Aggregates should be small and focused
- Cross-child invariants (rules that span multiple child entities within an aggregate) MUST be enforced by the aggregate root's methods, not by repositories or use cases. If two things must be consistent within the same transaction, they belong in the same aggregate.

**Aggregate persistence rules:**
- Child entities within an aggregate (e.g., line items in an order, assignments in a staff record) are persisted in **separate database tables** for normalization and queryability
- The aggregate root's **single repository** loads and saves all child entities in one transaction — no separate repositories for child entities
- The aggregate is a **domain concept**, not a persistence concept. How it is stored is an infrastructure detail
- At small volumes (< 100 child entities), eagerly load the full aggregate on every operation. Consider lazy loading only when child collections grow to hundreds or thousands of items.

```python
@dataclass(eq=False)
class Order:  # Aggregate Root
    id: OrderId
    customer_id: CustomerId
    _line_items: list[OrderLineItem] = field(default_factory=list, init=False)

    def add_line_item(self, product_id: ProductId, quantity: int) -> None:
        # Business rules and validation
        line_item = OrderLineItem(product_id, quantity)
        self._line_items.append(line_item)

    @property
    def line_items(self) -> tuple[OrderLineItem, ...]:
        return tuple(self._line_items)  # Return immutable view
```

## Aggregate Consistency Rules
- Each aggregate defines a transactional consistency boundary — all invariants within an aggregate are enforced in a single transaction
- Only ONE aggregate may be modified per transaction — cross-aggregate changes must use eventual consistency via domain events
- Aggregates reference other aggregates by identity (ID), never by direct object reference
- Keep aggregates small — large aggregates cause contention and performance issues
- Aggregate roots are responsible for enforcing all invariants of their internal entities
- Use optimistic concurrency (version field) to detect conflicting modifications

```python
@dataclass
class Order:  # Aggregate Root
    id: OrderId
    customer_id: CustomerId  # Reference by ID, not Customer object
    version: int = 0
    _line_items: list[OrderLineItem] = field(default_factory=list, init=False)
    _status: OrderStatus = field(default=OrderStatus.DRAFT, init=False)

    def add_line_item(self, product_id: ProductId, quantity: Quantity, price: Money) -> None:
        if self._status != OrderStatus.DRAFT:
            raise OrderNotEditableError(self.id)
        if len(self._line_items) >= 50:
            raise OrderLineLimitExceededError(self.id, max_items=50)
        self._line_items.append(OrderLineItem(product_id, quantity, price))

    def submit(self) -> list[DomainEvent]:
        if not self._line_items:
            raise EmptyOrderError(self.id)
        self._status = OrderStatus.SUBMITTED
        return [OrderSubmitted(order_id=self.id, customer_id=self.customer_id)]

    # Cross-aggregate side effects happen via events, not direct modification
    # e.g., OrderSubmitted → InventoryReservationHandler reserves stock
```
