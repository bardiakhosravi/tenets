<!-- tenets:generated-source -->
# Primary Adapters

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ADAPTER-001: Primary adapters invoke application capabilities

## Rule

A primary adapter receives an external interaction, translates it into an application input, invokes one primary port or use case, and returns through its protocol boundary.

## Rationale

Primary adapters drive the application without becoming the owner of its workflow.

## Incorrect

```python
@app.post("/orders")
def submit_order():
    order = create_order(...)
    orders.save(order)
```

## Correct

```python
@app.post("/orders")
def submit_order():
    order = create_submit_order().execute(map_request_to_command(request))
    return map_order_to_response(order), 201
```

## Remediation

Move workflow orchestration into a use case and leave translation and delegation in the adapter.

## Review check

Verify each entry point invokes one application capability rather than repositories or domain creation directly.

## TENETS-ADAPTER-002: Primary adapters validate and translate transport input

## Rule

Primary adapters validate transport shape and authentication context, then translate external representations into application commands, queries, and semantic values.

## Rationale

Malformed protocol input should not enter the application, while business validation remains with the domain or use case that owns it.

## Incorrect

```python
use_case.execute(request.get_json())
```

## Correct

```python
payload = SubmitOrderRequest.parse(request.get_json())
command = map_submit_order_request_to_command(payload, authenticated_account)
use_case.execute(command)
```

## Remediation

Add a protocol request schema and an explicit mapping to the application-owned input.

## Review check

Verify adapters handle required fields and transport formats without duplicating domain decisions.

## TENETS-ADAPTER-003: Protocol response and error mapping remain in primary adapters

## Rule

Primary adapters map application outcomes and known failures to protocol-specific responses, status codes, headers, acknowledgements, or exit codes.

## Rationale

Transport semantics are adapter concerns and must not leak into use cases or domain objects.

## Incorrect

```python
class GetOrderUseCase:
    def execute(self, order_id) -> Response:
        return jsonify({"id": order_id}), 200
```

## Correct

```python
order = get_order.execute(order_id)
return jsonify(map_order_to_response(order)), 200
```

## Remediation

Return an inward-owned result from the use case and perform protocol mapping in the primary adapter.

## Review check

Inspect use-case return types and exceptions for HTTP, messaging, CLI, or framework concepts.

## TENETS-API-002: External schemas belong to primary adapters

## Rule

HTTP, messaging, CLI, and other external request and response schemas are owned by their primary adapters, not by the domain or application layers.

## Rationale

Transport contracts contain serialization and compatibility concerns that should evolve independently of inward models.

## Incorrect

```python
# ordering/domain/order_response.py
class OrderResponse(BaseModel): ...
```

## Correct

```python
# ordering/adapters/primary/http/order_response.py
class OrderResponse(BaseModel): ...
```

## Remediation

Move transport schemas to the owning adapter and map them to and from application inputs and results.

## Review check

Search domain and application packages for framework schema bases, transport field aliases, and serialization metadata.

## TENETS-API-003: Primary adapters map results before external delivery

## Rule

Primary adapters map domain objects and application-owned results into explicit external response representations before they cross the protocol boundary.

## Rationale

Explicit response mapping prevents accidental data exposure and decouples public compatibility from inward model evolution.

## Incorrect

```python
return jsonify(order.__dict__)
```

## Correct

```python
return jsonify(map_order_to_response(order).model_dump())
```

## Remediation

Define the intended external response fields and add an explicit directional mapper in the primary adapter.

## Review check

Verify endpoints do not serialize inward objects generically or return them directly through framework auto-serialization.

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
