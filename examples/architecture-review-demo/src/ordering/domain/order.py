from dataclasses import dataclass


@dataclass(frozen=True)
class OrderId:
    value: str


@dataclass
class Order:
    id: OrderId
    customer_email: str
    submitted: bool = False

    def submit(self) -> None:
        self.submitted = True
