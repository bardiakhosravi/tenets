<!-- tenets:generated-source -->
# Validation and Error Handling

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-VALIDATE-001: Domain objects enforce domain invariants

## Rule

Entities, aggregates, and value objects enforce their own invariants explicitly on every lifecycle path where those invariants apply.

## Rationale

Domain validity must not depend on whether an object entered through HTTP, a use case, a repository mapper, or another adapter.

## Incorrect

```python
if request_body.quantity <= 0:
    raise BadRequest("quantity must be positive")
```

## Correct

```python
@dataclass(frozen=True)
class Quantity:
    value: int

    def __post_init__(self) -> None:
        if self.value <= 0:
            raise InvalidQuantity()
```

## Remediation

Move business invariants into the domain type and retain only protocol-shape checks at the external boundary.

## Review check

Verify that every applicable creation, mutation, and hydration path passes through the domain invariant.

## TENETS-VALIDATE-002: Primary adapters validate external input shape

## Rule

Primary adapters validate protocol shape and map valid external inputs into application or domain semantics without duplicating domain invariants.

## Rationale

Transport concerns such as required JSON fields belong at the protocol boundary, while business meaning remains reusable and authoritative inside the domain.

## Incorrect

```python
command = CreateOrderCommand(**request.get_json())
```

## Correct

```python
request_body = CreateOrderRequest.from_json(request.get_json())
command = CreateOrderCommand(
    customer_account_id=CustomerAccountId(request_body.customer_account_id),
    lines=tuple(map_request_line_to_command_line(line) for line in request_body.lines),
)
```

## Remediation

Introduce a protocol request model, validate its shape, and map it explicitly to semantic input types.

## Review check

Check that malformed external data stops at the primary adapter and domain rules are not independently reimplemented there.

## TENETS-ERROR-001: Failure ownership follows architectural meaning

## Rule

Define a failure beside the domain concept, application workflow, or port contract that gives the failure architectural meaning.

## Rationale

Meaningful ownership keeps failures precise and prevents one global technical hierarchy from coupling otherwise independent layers and bounded contexts.

## Incorrect

```text
shared/errors.py
  DomainException
  AdapterException
  Every project failure
```

## Correct

```text
ordering/domain/errors.py
ordering/application/errors.py
ordering/application/ports/payment_gateway_errors.py
```

## Remediation

Move each failure to its owning concept or contract and remove dependencies on global technical categories.

## Review check

For each failure, identify who can define its meaning without importing an outer technology.

## TENETS-ERROR-002: Domain failures remain technology agnostic

## Rule

Domain failures express invariant and business-rule violations without framework, protocol, persistence, or vendor concepts.

## Rationale

A domain failure must carry the same ubiquitous meaning whether the workflow is invoked through HTTP, messaging, a command line, or a test.

## Incorrect

```python
raise HTTPConflict("order already submitted")
```

## Correct

```python
class OrderAlreadySubmitted(Exception):
    pass
```

## Remediation

Replace outer-layer exceptions with a domain-specific failure and map it at each primary adapter.

## Review check

Inspect domain exception imports, names, fields, and messages for transport or infrastructure vocabulary.

## TENETS-ERROR-003: Application failures represent orchestration outcomes

## Rule

Application failures represent meaningful use-case outcomes, such as required absence or workflow rejection, rather than technical adapter failures.

## Rationale

The application layer owns how repository results and capability outcomes affect a workflow, but it must remain independent of vendor mechanics.

## Incorrect

```python
raise DatabaseRowMissing(order_id)
```

## Correct

```python
order = self._order_repository.get(command.order_id)
if order is None:
    raise OrderNotFound(command.order_id)
```

## Remediation

Interpret technical-neutral port results in the use case and raise a workflow-specific application failure only when required.

## Review check

Verify that application failures describe business workflow outcomes and do not mention drivers, protocols, or vendor SDKs.

## TENETS-ERROR-004: Expected outbound failures are declared beside their port

## Rule

Declare each expected outbound failure that a use case may handle beside the consuming port contract.

## Rationale

Expected failure semantics are part of the capability contract and must not be invented independently by an adapter implementation.

## Incorrect

```python
except StripeConnectionError:
    raise AdapterException()
```

## Correct

```python
class PaymentGatewayUnavailable(Exception):
    pass

class PaymentGateway(Protocol):
    def authorize(self, request: PaymentAuthorization) -> PaymentAuthorizationResult: ...
```

## Remediation

Name the expected capability failure in application or domain language and document it with the port that consumers depend upon.

## Review check

Confirm that every expected adapter failure handled inward has a precise port-owned contract type.

## TENETS-ERROR-005: Secondary adapters translate specific vendor failures

## Rule

Secondary adapters catch specific expected technical failures, raise the corresponding port-declared failures, and preserve the original cause.

## Rationale

Specific translation prevents vendor types from leaking inward while retaining diagnostic evidence and avoiding accidental conversion of programming defects.

## Incorrect

```python
except Exception:
    raise PaymentGatewayUnavailable()
```

## Correct

```python
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Catch only known vendor failures at the adapter boundary and chain each translated cause.

## Review check

Look for broad catches, swallowed causes, generic adapter failures, and vendor exceptions crossing the port.

## TENETS-ERROR-006: Primary adapters map known failures

## Rule

Primary adapters map known domain, application, and port-declared failures into explicit protocol-specific outcomes.

## Rationale

Transport status, response shape, acknowledgment, and exit codes belong to the driving boundary rather than to reusable business code.

## Incorrect

```python
raise OrderNotFound(order_id)  # Escapes the HTTP boundary unmapped.
```

## Correct

```python
@app.errorhandler(OrderNotFound)
def handle_order_not_found(error: OrderNotFound):
    return {"code": "order_not_found"}, 404
```

## Remediation

Add centralized primary-adapter mappings for every known failure that can reach that protocol.

## Review check

Trace known failures to stable protocol responses and verify that domain or application code does not choose those responses.

## TENETS-ERROR-007: Unexpected failures terminate at an outer boundary

## Rule

Let unexpected failures reach a true outer safety boundary that logs them once with correlation context and returns a safe generic protocol outcome.

## Rationale

Intermediate broad catches hide defects and duplicate logging, while an outer boundary prevents internal messages, SQL, payloads, and stack traces from leaking externally.

## Incorrect

```python
try:
    self._order_repository.save(order)
except Exception:
    return None
```

## Correct

```python
@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    app.logger.exception("Unhandled request failure")
    return {"code": "internal_error"}, 500
```

## Remediation

Remove broad intermediate catches unless they are cleanup boundaries that preserve the primary failure, and install one outer protocol safety boundary.

## Review check

Verify that unexpected failures are logged once, produce no internal detail in responses, and are not mislabeled as expected outcomes.

## TENETS-ERROR-008: Failure types live with their owning concept or contract

## Rule

Place failure types in cohesive modules owned by their domain concept, application capability, or port contract rather than in a global shared-kernel dumping ground.

## Rationale

File placement should expose ownership and dependency direction; a universal exceptions module obscures both and creates cross-context coupling.

## Incorrect

```text
shared_kernel/exceptions.py
  OrderAlreadySubmitted
  PaymentGatewayUnavailable
  OrderNotFound
```

## Correct

```text
ordering/domain/errors.py
ordering/application/errors.py
ordering/application/ports/payment_gateway_errors.py
```

## Remediation

Relocate failures to their owner; a small module may colocate one precise failure with the contract it describes.

## Review check

Inspect shared failure modules for unrelated bounded-context, workflow, port, protocol, or vendor concepts.

## TENETS-PATTERN-012: Layered Python error organization and handling

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
