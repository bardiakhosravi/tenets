---
id: TENETS-ENTITY-002
title: Entities own behavior and protect invariants
kind: rule
status: stable
category: entities
severity: error
profiles: ["core"]
related: ["TENETS-ENTITY-001", "TENETS-AGGREGATE-003", "TENETS-APP-002"]
aliases: []
---
## Rule

Entities expose business behavior that protects their invariants. Callers do not mutate entity state directly or reconstruct its decisions procedurally.

## Rationale

Keeping behavior with state makes valid transitions consistent across workflows.

## Incorrect

```python
order.status = OrderStatus.SUBMITTED
```

## Correct

```python
order.submit()
```

## Remediation

Make state private or controlled and move transition rules into a domain method.

## Review check

Search callers for direct state assignment and duplicated conditionals governing entity transitions.
