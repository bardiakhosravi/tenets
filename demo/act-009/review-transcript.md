# Tenets Architecture Review

Scope: `src/ordering`

Status: `changes_requested`

## Findings

### [error] TENETS-DEPEND-002

`application/submit_order_use_case.py:1` imports
`SqlOrderRepository`, and line 9 requires that concrete adapter in the use-case
constructor. Application code must depend on the inward-owned
`OrderRepository` port so adapter selection remains in the composition root.

### [error] TENETS-PORT-007

`application/ports/order_notifier.py:5` defines the outbound capability with
naked `str` values for both order identity and email address. Replace them with
the smallest cohesive domain-semantic input, such as an `OrderConfirmation`.

### [error] TENETS-PORT-005

`adapters/secondary/email_order_notifier.py:7` injects an `OrderRepository`, and
line 11 performs additional aggregate loading. The use case must supply the
complete notification input; the secondary adapter should only execute email
delivery.

## Recommended order

1. Make `SubmitOrderUseCase` depend on `OrderRepository`.
2. Introduce a cohesive `OrderConfirmation` input for `OrderNotifier`.
3. Remove repository access from `EmailOrderNotifier`.
