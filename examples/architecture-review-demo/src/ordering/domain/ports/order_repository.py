from typing import Protocol

from ordering.domain.order import Order, OrderId


class OrderRepository(Protocol):
    def get(self, order_id: OrderId) -> Order | None: ...

    def save(self, order: Order) -> None: ...
