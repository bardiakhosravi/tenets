<!-- tenets:generated-source -->
# Secondary Adapters

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-ADAPTER-004: Secondary adapters implement and translate port contracts

## Rule

A secondary adapter implements an inward-facing port and translates between its semantic types and one external technology or published contract.

## Rationale

Explicit translation preserves the port contract while containing external representation changes.

## Incorrect

```python
class StripeClient:
    def post(self, payload: dict) -> StripeResponse: ...
```

## Correct

```python
class StripePaymentGateway(PaymentGateway):
    def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation:
        response = self._client.authorize(_map_authorization_to_stripe(request))
        return _map_stripe_response_to_confirmation(response)
```

## Remediation

Implement the consuming port directly and add directional mapping at the adapter boundary.

## Review check

Verify the adapter's public methods exactly preserve the inward-facing contract.

## TENETS-ADAPTER-005: External models remain inside their adapters

## Rule

Vendor SDK objects, persistence models, transport schemas, serialized payloads, and technology-specific types remain private to the adapter that owns their mapping.

## Rationale

External models change for technical reasons and must not become shared application or domain contracts.

## Incorrect

```python
def authorize(self, request: PaymentAuthorization) -> StripePaymentIntent: ...
```

## Correct

```python
def authorize(self, request: PaymentAuthorization) -> PaymentConfirmation: ...
```

## Remediation

Introduce an inward-owned semantic result and map the external object before returning from the adapter.

## Review check

Search inward-facing signatures and imports for ORM, framework, protocol, and vendor-owned types.

## TENETS-ADAPTER-006: Secondary adapters translate expected technical failures

## Rule

A secondary adapter catches specific expected technical failures and translates them into failures declared beside the consuming port contract, preserving the original cause.

## Rationale

Use cases can respond to meaningful capability failures without depending on vendor exception classes.

## Incorrect

```python
payment_gateway.authorize(request)  # StripeConnectionError leaks inward.
```

## Correct

```python
try:
    return self._authorize(request)
except StripeConnectionError as error:
    raise PaymentGatewayUnavailable() from error
```

## Remediation

Define a capability-specific expected failure, catch only the corresponding technical failures, and chain the cause.

## Review check

Inspect adapter boundaries for vendor exceptions leaking inward, broad catches, and discarded causes.

## TENETS-ADAPTER-007: Repository adapters reconstruct persisted objects

## Rule

Repository adapters map persistence representations to fully hydrated domain objects through constructors and directional mappers. They never invoke new-object creation entry points.

## Rationale

Repository reads reconstruct existing lifecycle state and must not generate new identities, defaults, or creation events.

## Incorrect

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return create_order(CustomerId(row.customer_id))
```

## Correct

```python
def _map_order_row_to_order(row: OrderRow) -> Order:
    return Order(OrderId(row.id), CustomerId(row.customer_id), OrderStatus(row.status))
```

## Remediation

Replace creation calls with explicit source-to-target mapping that supplies all persisted identity and state.

## Review check

Search repository adapters for `create_*` calls and incomplete constructor mapping.

## TENETS-PORT-005: Secondary capabilities never receive repositories

## Rule

Never pass a repository to a secondary port or adapter. A non-repository secondary adapter must not construct, inject, or call repositories internally.

## Rationale

Repositories are application orchestration dependencies. Giving one to another outbound capability creates hidden loading and mixes persistence with infrastructure execution.

## Incorrect

```python
self._email_port.send_invoice(invoice, self._customer_repository)
```

## Correct

```python
customer = self._customers.get(invoice.customer_id)
self._email_port.send_invoice(customer, invoice)
```

## Remediation

Move every required load into the use case and change the port contract to accept the resulting semantic objects.

## Review check

Search secondary adapter constructors and public methods for repository parameters, imports, lookups, or service-locator access.

## TENETS-PORT-006: Use cases provide complete capability input

## Rule

A use case supplies all domain information an outbound capability needs. The secondary port does not load, discover, or derive missing domain state from persistence.

## Rationale

Complete input keeps orchestration visible and makes the port independently testable.

## Incorrect

```python
payment_gateway.capture(order.id)  # Adapter must load amount and account.
```

## Correct

```python
payment_gateway.capture(create_payment_capture(order, billing_account))
```

## Remediation

Identify missing state, load it in the use case, and add an appropriate semantic input to the port contract.

## Review check

Trace each port call and verify that its implementation can complete without querying application persistence.
