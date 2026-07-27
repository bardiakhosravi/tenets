---
id: TENETS-PATTERN-005
title: Flask request-scoped use-case factory
kind: pattern
status: stable
category: composition
severity: guidance
minimum_profile: pragmatic
applies_to: ["python", "flask"]
related: ["TENETS-PORT-001", "TENETS-APP-001", "TENETS-APP-002"]
aliases: []
---
## Purpose

Create a fresh use-case instance and its transaction resources for each Flask request without introducing an unnecessary provider abstraction.

## Implementation

```python
class Container:
    def create_submit_order(self) -> SubmitOrderUseCase:
        session = self._session_factory()
        return SubmitOrderUseCase(
            orders=SqlOrderRepository(session),
            unit_of_work=SqlUnitOfWork(session),
        )

def create_app(container: Container) -> Flask:
    app = Flask(__name__)

    @app.post("/orders")
    def submit_order():
        command = SubmitOrderCommand.from_json(request.get_json())
        order = container.create_submit_order().execute(command)
        return jsonify(map_order_to_response(order)), 201

    return app
```

The bound container method is the factory. A separate `CreateSubmitOrderProvider` alias is unnecessary unless it provides independent value.

## Trade-offs

Per-request construction allocates small objects but avoids accidental mutable or transaction state sharing. Long-lived stateless clients and configuration may still be shared by the container.

## Related rules

See `TENETS-PORT-001`, `TENETS-APP-001`, and `TENETS-APP-002`.
