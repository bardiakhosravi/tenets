from ordering.adapters.secondary.sql_order_repository import SqlOrderRepository
from ordering.application.ports.order_notifier import OrderNotifier
from ordering.domain.order import OrderId


class SubmitOrderUseCase:
    def __init__(
        self,
        order_repository: SqlOrderRepository,
        order_notifier: OrderNotifier,
    ) -> None:
        self._order_repository = order_repository
        self._order_notifier = order_notifier

    def execute(self, order_id: str) -> None:
        order = self._order_repository.get(OrderId(order_id))
        if order is None:
            raise ValueError("order not found")

        order.submit()
        self._order_repository.save(order)
        self._order_notifier.send_confirmation(
            order.id.value,
            order.customer_email,
        )
