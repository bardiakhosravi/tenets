---
id: TENETS-TEST-002
title: Use cases are tested through isolated port dependencies
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: core
applies_to: ["all"]
related: ["TENETS-APP-001", "TENETS-APP-002", "TENETS-UOW-003"]
aliases: []
---
## Rule

Instantiate the real use case with controlled implementations of its ports and test observable orchestration, outcomes, and transaction behavior.

## Rationale

Use-case tests should prove loading, domain invocation, outbound calls, failure handling, and commit decisions without coupling to private methods or real infrastructure.

## Incorrect

```python
use_case = Mock()
use_case.execute(command)
use_case.execute.assert_called_once_with(command)
```

## Correct

```python
orders = FakeOrderRepository([order])
unit_of_work = SpyUnitOfWork()
result = SubmitOrderUseCase(orders, unit_of_work).execute(command)
assert result is order
assert orders.requested_order_ids == [command.order_id]
assert unit_of_work.commit_count == 1
```

## Remediation

Compose the real use case with small fakes, stubs, spies, or mocks that expose the behavior promised by each port.

## Review check

Confirm that each use case has isolated tests for success, expected absence or failure, and transaction outcomes.
