---
id: TENETS-UOW-002
title: One Unit of Work instance represents one transaction
kind: rule
status: stable
category: unit-of-work
severity: error
profiles: ["core"]
related: ["TENETS-UOW-003", "TENETS-UOW-007"]
aliases: []
---
## Rule

Treat each Unit of Work instance as a one-shot transaction boundary. Do not enter or reuse it after it exits.

## Rationale

One lifecycle prevents stale sessions, identity maps, and transaction state from crossing application operations.

## Incorrect

```python
with unit_of_work:
    save_order()
    unit_of_work.commit()

with unit_of_work:
    mark_event_published()
    unit_of_work.commit()
```

## Correct

```python
first_unit_of_work = unit_of_work_factory.create()
with first_unit_of_work:
    ...
    first_unit_of_work.commit()

second_unit_of_work = unit_of_work_factory.create()
with second_unit_of_work:
    ...
    second_unit_of_work.commit()
```

## Remediation

Create a fresh Unit of Work for each deliberate transaction and reject adapter reuse explicitly.

## Review check

Trace every Unit of Work instance and verify that it is entered at most once.
