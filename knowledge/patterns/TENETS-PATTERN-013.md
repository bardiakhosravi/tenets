---
id: TENETS-PATTERN-013
title: Python bounded-context project structure
kind: pattern
status: stable
category: project-structure
severity: guidance
minimum_profile: pragmatic
applies_to: ["python"]
related: ["TENETS-DEPEND-001", "TENETS-DEPEND-002", "TENETS-DEPEND-003", "TENETS-COMPOSE-001", "TENETS-ERROR-008", "TENETS-ADR-001"]
aliases: []
---
## Purpose

Provide a coherent Python package layout that makes bounded-context ownership,
dependency direction, port placement, and adapter technology visible without
turning path names or class counts into architecture rules.

## Implementation

Organize each bounded context as a package:

```text
src/
  ordering/
    domain/
      order.py
      errors.py
      events.py
      ports/
        order_repository.py
    application/
      commands.py
      errors.py
      handlers/
      ports/
        payment_gateway.py
      use_cases/
        submit_order_use_case.py
    adapters/
      primary/
        flask/
          routes.py
          error_handlers.py
      secondary/
        sqlite/
          order_repository.py
          mappers.py
        stripe/
          payment_gateway.py
          mappers.py
    configuration/
      container.py
```

Apply these organization principles:

- A module represents one cohesive concept, not an arbitrary class count.
- A module may contain its primary type, creation function, closely related
  value types, precise failures, and private helpers.
- Split unrelated responsibilities and independently evolving concepts.
- Keep `__init__.py` limited to package declarations or re-exports; do not hide
  business, orchestration, or adapter implementation there.
- Keep technology-specific records, models, clients, and directional mappers
  with the adapter that owns them.
- Place repository ports with the domain model whose aggregates they persist.
- Place external capability ports with the application workflow that consumes
  them.
- Wire concrete implementations in the composition root.

The following alternatives are valid when used consistently and when they
preserve the same ownership and dependency direction:

```text
ordering/adapters/secondary/...
ordering/infrastructure/adapters/secondary/...
```

Smaller codebases may combine closely related modules. Architecture review
findings should identify an actual ownership or dependency problem, not merely:

- More than one class in a module
- `adapters/` instead of `infrastructure/adapters/`
- A different but coherent package grouping

Record a project-specific layout decision when multiple teams or bounded
contexts need a durable convention.

## Trade-offs

Bounded-context-first packages make ownership and extraction boundaries clear,
but shared technical operations may require carefully scoped adapter utilities.
Type-first layouts can feel familiar in small services, but they become harder
to navigate as bounded contexts grow. Neither layout compensates for violated
dependency direction.

## Related rules

See `TENETS-DEPEND-001` through `TENETS-DEPEND-003`,
`TENETS-COMPOSE-001`, `TENETS-ERROR-008`, and `TENETS-ADR-001`.
