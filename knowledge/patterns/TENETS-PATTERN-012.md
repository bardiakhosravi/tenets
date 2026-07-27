---
id: TENETS-PATTERN-012
title: Layered Python error organization and handling
kind: pattern
status: stable
category: errors
severity: guidance
profiles: ["core", "python", "flask"]
related: ["TENETS-ERROR-001", "TENETS-ERROR-002", "TENETS-ERROR-003", "TENETS-ERROR-004", "TENETS-ERROR-005", "TENETS-ERROR-006", "TENETS-ERROR-007", "TENETS-ERROR-008"]
aliases: []
---
## Purpose

Keep failures owned by their architectural meaning and translate them once as
they cross secondary and primary adapter boundaries.

## Implementation

Use cohesive modules that make ownership visible:

```text
src/ordering/
  domain/
    order.py
    errors.py
    ports/
      order_repository.py
  application/
    errors.py
    ports/
      payment_gateway.py
      payment_gateway_errors.py
    use_cases/
      submit_order_use_case.py
  adapters/
    primary/flask/
      routes.py
      error_handlers.py
    secondary/stripe/
      stripe_payment_gateway.py
      errors.py
```

Small modules may colocate one precise failure with its owning concept or port.
Projects may consistently use `exceptions.py` instead of `errors.py`; ownership
matters more than the filename.

Define domain failures without outer technology:

```python
class OrderAlreadySubmitted(Exception):
    pass
```

Interpret normal repository absence in the use case:

```python
class OrderNotFound(Exception):
    def __init__(self, order_id: OrderId) -> None:
        self.order_id = order_id
        super().__init__(f"Order {order_id} was not found")


order = self._order_repository.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

Declare expected capability failures beside the port:

```python
class PaymentGatewayUnavailable(Exception):
    pass


class PaymentDeclined(Exception):
    def __init__(self, reason: PaymentDeclineReason) -> None:
        self.reason = reason
        super().__init__(str(reason))
```

Translate only specific vendor failures in the secondary adapter:

```python
def authorize(
    self,
    request: PaymentAuthorization,
) -> PaymentAuthorizationResult:
    try:
        response = self._stripe_client.authorize(
            amount=request.amount.to_minor_units(),
            currency=request.amount.currency.code,
            idempotency_key=str(request.operation_id),
        )
    except StripeConnectionError as error:
        raise PaymentGatewayUnavailable() from error

    return map_stripe_authorization_to_result(response)
```

A use case catches a failure only when it performs meaningful workflow behavior,
recovery, compensation, or translation:

```python
try:
    authorization = self._payment_gateway.authorize(payment_request)
except PaymentDeclined as error:
    order.record_payment_declined(reason=error.reason)
    self._unit_of_work.commit()
    raise OrderPaymentRejected(order.id) from error
```

Map known failures in the Flask adapter:

```python
def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(OrderNotFound)
    def handle_order_not_found(error: OrderNotFound):
        return {"code": "order_not_found"}, 404

    @app.errorhandler(OrderAlreadySubmitted)
    def handle_order_already_submitted(error: OrderAlreadySubmitted):
        return {"code": "order_already_submitted"}, 409

    @app.errorhandler(PaymentGatewayUnavailable)
    def handle_payment_gateway_unavailable(error: PaymentGatewayUnavailable):
        return {"code": "payment_temporarily_unavailable"}, 503

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Unhandled request failure")
        return {"code": "internal_error"}, 500
```

The outer handler is the one broad safety boundary. It does not expose exception
messages, SQL, vendor payloads, stack traces, or internal identifiers. Add
correlation context through the application's logging configuration.

## Trade-offs

Precise failure ownership introduces more types than a universal
`DomainException` or `AdapterException`, but each type carries actionable
meaning and avoids cross-layer coupling. Central protocol mappings reduce route
duplication, though every primary adapter must define its own mapping.

## Related rules

See `TENETS-ERROR-001` through `TENETS-ERROR-008`,
`TENETS-ADAPTER-003`, `TENETS-ADAPTER-006`, and `TENETS-REPO-005`.
