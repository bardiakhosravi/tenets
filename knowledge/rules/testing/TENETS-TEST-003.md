---
id: TENETS-TEST-003
title: Every secondary adapter proves its port contract
kind: rule
status: stable
category: testing
severity: warning
minimum_profile: pragmatic
applies_to: ["all"]
related: ["TENETS-ADAPTER-004", "TENETS-ADAPTER-006", "TENETS-REPO-005", "TENETS-PATTERN-011"]
aliases: []
---
## Rule

Run reusable behavioral contract tests against every material secondary adapter implementation.

## Rationale

All implementations of a port must preserve the same semantic inputs, outputs, absence behavior, failure translation, and transaction guarantees.

## Incorrect

```text
The SQLite repository has hand-written tests.
The Postgres repository is assumed to behave the same.
```

## Correct

```python
class TestSqliteOrderRepository(OrderRepositoryContract): ...
class TestPostgresOrderRepository(OrderRepositoryContract): ...
```

## Remediation

Extract the port's promised behavior into a reusable suite and parameterize adapter setup without putting technology-specific assertions in the shared contract.

## Review check

List each material secondary adapter and verify that it runs its port contract suite plus any technology-specific tests.
