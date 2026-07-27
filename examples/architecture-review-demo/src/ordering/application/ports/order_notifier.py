from typing import Protocol


class OrderNotifier(Protocol):
    def send_confirmation(self, order_id: str, email: str) -> None: ...
