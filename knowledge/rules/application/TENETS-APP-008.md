---
id: TENETS-APP-008
title: Use cases do not invoke other use cases
kind: rule
status: stable
category: application
severity: error
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-001", "TENETS-APP-006", "TENETS-PORT-001", "TENETS-UOW-009", "TENETS-SERVICE-001"]
aliases: []
---
## Rule

A use case never receives, constructs, or invokes another use case or primary port. Each use case reaches the domain and secondary ports directly.

## Rationale

A use case is the application's entry point for one workflow. Calling one from another makes transaction ownership ambiguous: the inner use case either nests a Unit of Work or commits on its own and leaves partial writes when the outer one fails. It also repeats boundary work such as command mapping, authorization, and idempotency, and couples two workflows that should change independently.

## Incorrect

```python
class SubmitOrderUseCase:
    def __init__(self, orders: OrderRepository, reserve_inventory: ReserveInventoryUseCase, unit_of_work: UnitOfWork) -> None: ...

    def execute(self, command: SubmitOrderCommand) -> Order:
        with self._unit_of_work:
            order = self._orders.get(OrderId(command.order_id))
            order.submit()
            self._reserve_inventory.execute(ReserveInventoryCommand(order_id=command.order_id))
            self._unit_of_work.commit()
        return order
```

## Correct

```python
class SubmitOrderUseCase:
    def __init__(self, orders: OrderRepository, inventory: InventoryReservationPort, unit_of_work: UnitOfWork) -> None: ...

    def execute(self, command: SubmitOrderCommand) -> Order:
        with self._unit_of_work:
            order = self._orders.get(OrderId(command.order_id))
            order.submit()
            self._inventory.reserve(InventoryReservationRequest(order.id, order.lines))
            self._unit_of_work.commit()
        return order
```

## Remediation

Choose the replacement from what was being reused. Move shared business logic into an aggregate method or domain service. Extract shared orchestration steps into a plain application function that owns no Unit of Work or command. Record a domain event and handle the follow-up in its own transaction when it may happen afterwards. Combine the steps into one use case and one Unit of Work when they must commit together. When the workflows are independent, let the primary adapter or a process manager invoke each one.

## Review check

Search use-case constructors and attributes for parameters typed as another use case or primary port, `execute` calls on injected collaborators, and composition roots that pass one use case into another.
