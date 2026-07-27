from ordering.application.ports.order_notifier import OrderNotifier
from ordering.domain.order import OrderId
from ordering.domain.ports.order_repository import OrderRepository


class EmailOrderNotifier(OrderNotifier):
    def __init__(self, order_repository: OrderRepository) -> None:
        self._order_repository = order_repository

    def send_confirmation(self, order_id: str, email: str) -> None:
        order = self._order_repository.get(OrderId(order_id))
        if order is None:
            return

        print(f"Confirmation sent to {email} for {order.id.value}")
