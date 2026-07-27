---
id: TENETS-PATTERN-010
title: External-effect idempotency
kind: pattern
status: stable
category: async-reliability
severity: guidance
minimum_profile: strict
applies_to: ["python"]
related: ["TENETS-ASYNC-001", "TENETS-ASYNC-006", "TENETS-ASYNC-007", "TENETS-ASYNC-008"]
aliases: []
---
## Purpose

Protect non-transactional effects such as charges, email delivery, or external API mutations when local database atomicity cannot cover the provider.

## Implementation

Derive one stable effect identity from the consumer operation rather than from
an individual delivery attempt:

```python
@dataclass(frozen=True)
class PaymentChargeKey:
    value: str

    @classmethod
    def for_order(
        cls,
        order_id: OrderReferenceId,
        payment_account_id: PaymentAccountId,
    ) -> "PaymentChargeKey":
        return cls(
            f"charge-order:{order_id.value}:{payment_account_id.value}"
        )
```

Pass that semantic key through the application-owned port:

```python
class PaymentGateway(Protocol):
    def charge(
        self,
        request: PaymentChargeRequest,
        idempotency_key: PaymentChargeKey,
    ) -> PaymentChargeResult: ...
```

The secondary adapter translates it to the provider mechanism:

```python
class AcmePaymentGateway:
    def charge(
        self,
        request: PaymentChargeRequest,
        idempotency_key: PaymentChargeKey,
    ) -> PaymentChargeResult:
        response = self._acme_payment_client.create_charge(
            amount_minor=request.amount.minor_units,
            currency=request.amount.currency.code,
            idempotency_key=idempotency_key.value,
        )
        return map_acme_charge_to_payment_charge_result(response)
```

Persist enough local operation state to reconcile an uncertain outcome:

```text
pending -> provider accepted but local completion unknown -> reconcile by key
succeeded -> return the previously accepted result
failed permanently -> reject without issuing a new effect
```

If a provider offers no idempotency support, choose and document one of:

- Query or reconcile provider state before repeating.
- Compensate a confirmed duplicate effect.
- Serialize the operation through another durable mechanism.
- Accept and document the duplicate and loss risk.

Retain the local identity for at least the provider's idempotency window and the
full supported application replay period. State guarantees independently:

```text
Billing state and its inbox receipt are atomic.
The payment provider deduplicates PaymentChargeKey for 30 days.
Reconciliation handles unknown provider outcomes during that period.
```

## Trade-offs

Provider idempotency reduces duplicate effects but does not create a distributed
transaction. Reconciliation and compensation add operational work, while
accepting residual risk may be correct only for low-impact effects.

## Related rules

See `TENETS-ASYNC-006`, `TENETS-ASYNC-007`, and `TENETS-ASYNC-008`.
