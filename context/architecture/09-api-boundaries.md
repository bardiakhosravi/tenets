<!-- tenets:generated-source -->
# API Boundaries

> Generated from atomic Tenets rules. Edit the sources under `knowledge/`, then run `npm run catalog` from `cli/`.

## TENETS-API-001: External APIs never expose persistence models

## Rule

External API requests and responses never use ORM entities, database rows, persistence schemas, or serialized database records as their public contract.

## Rationale

Database structure is an implementation detail with different compatibility, security, and evolution requirements from an external API.

## Incorrect

```python
return OrderRow.query.get(order_id).to_dict()
```

## Correct

```python
order = get_order.execute(OrderId(order_id))
return map_order_to_response(order)
```

## Remediation

Define an adapter-owned API schema and map from an inward-owned result.

## Review check

Inspect endpoint annotations, serializers, and returned values for persistence representations.

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

## TENETS-APP-007: Use cases return meaningful inward-owned results

## Rule

A use case returns the simplest meaningful contract: `None`, a domain object, or an immutable application-owned result. It never returns persistence models, adapter DTOs, framework types, or unstructured dictionaries.

## Rationale

A single natural domain result needs no wrapper; projections and combined outcomes benefit from a stable application result.

## Incorrect

```python
return CreateOrderResult(order=order)  # Wrapper adds no boundary.
return jsonify(order_row)
```

## Correct

```python
return order
return OrderAccountSummary(order.id, balance, shipment_count)
```

## Remediation

Return the domain object directly when it is the natural result, or define an immutable application result for a genuine projection.

## Review check

Verify result ownership and challenge wrappers that contain only one domain object without adding meaning.
