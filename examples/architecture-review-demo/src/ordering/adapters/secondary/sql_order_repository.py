from ordering.domain.order import Order, OrderId
from ordering.domain.ports.order_repository import OrderRepository


class SqlOrderRepository(OrderRepository):
    def __init__(self) -> None:
        self._orders: dict[str, Order] = {
            "order-123": Order(
                id=OrderId("order-123"),
                customer_email="customer@example.com",
            )
        }

    def get(self, order_id: OrderId) -> Order | None:
        return self._orders.get(order_id.value)

    def save(self, order: Order) -> None:
        self._orders[order.id.value] = order
