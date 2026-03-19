- entities vs values objects
- not coupling ports to adapter speicifc details. 
- exception handling

# Add Mapper Rules


### 25. Domain Object Mapping Rules
- **Centralized Mapping**: All mappings from domain objects to simple types (dicts, JSON, DTOs) MUST be done in dedicated mapper files
- **Mapper Location**: Place mappers in `infrastructure/adapters/primary/{technology}/mappers.py` for primary adapters
- **Mapper Location**: Place mappers in `infrastructure/adapters/secondary/{technology}/mappers.py` for secondary adapters
- **Pure Functions**: Mappers should be pure functions with no side effects
- **Type Safety**: Use explicit type hints for all mapper functions
- **Immutable Mapping**: Never modify domain objects during mapping
- **Complete Mapping**: Map all necessary fields, including nested value objects
- **String Conversion**: Convert domain value objects to strings using `str()` when needed for serialization

```python
# Good Example - infrastructure/adapters/primary/letta/mappers.py
def map_poi_to_letta_poi(pois: List[PointOfInterest]) -> str:
    """Map POI domain objects to Letta POI format."""
    poi_dicts = [
        {
            "id": str(poi.id),  # Convert value object to string
            "name": poi.name,
            "description": poi.description,
            "location": {
                "latitude": poi.location.latitude,
                "longitude": poi.location.longitude,
            },
        }
        for poi in pois
    ]
    return json.dumps(poi_dicts)

# Bad Example - Don't do mapping inline in adapters
class SomeAdapter:
    def some_method(self, poi: PointOfInterest):
        # DON'T do this - mapping should be in mappers.py
        return {
            "id": poi.id,
            "name": poi.name
        }
```

```python



# Recommended Structure

/context/
  README.md                          # map of the territory + how to use this context

  # Level 1 — Concepts (what & why)
  /architecture/
    00-overview.md                   # hexagonal + DDD in one page (links to below)
    hexagonal/
      01-hexagonal-primer.md         # short, agent-optimized summary
      02-components.md               # Domain, Application, Ports, Adapters (definitions & purpose)
      03-boundaries.md               # dependency rules (who can import whom), layering, packaging
      04-c4-cheatsheet.md            # C4 bullets for L1–L3
    ddd/
      01-ddd-primer.md               # ubiquitous language, bounded contexts, aggregates
      02-strategic-patterns.md       # contexts, context maps, anti-corruption layers
      03-tactical-patterns.md        # entities, VOs, domain services, repositories, domain events

  # Level 2 — Rules & non-negotiables (how)
  /standards/
    domain.md                        # invariants, entities/VOs, events, error taxonomy
    application.md                   # use cases, transactions, idempotency, mapping errors
    ports.md                         # inbound/outbound definitions, stability, versioning
    adapters.md                      # http/db/messaging adapters; resiliency, retries, timeouts
    repositories.md                  # persistence rules, mapping, no leakage, pagination rules
    testing.md                       # unit vs contract vs adapter tests; fixtures/fakes/stubs
    naming.md                        # UL alignment, events past-tense, package names
    security.md                      # secrets, validation, authZ/IAM seam placement
    observability.md                 # structured logs, metrics, traces; where to emit
    adrs.md                          # when to write one, format, examples
    quality-gates.md                 # the single checklist devs/agents must pass

  # Level 3 — Recipes & examples (do this)
  /recipes/
    ports/
      define-outbound-port.md        # template + gotchas + mini code
      versioning-outbound-port.md
    application/
      implement-usecase.md
      idempotency-patterns.md
    adapters/
      http-inbound-fastapi.md
      payment-gateway-outbound.md
      repository-postgres.md
      message-publisher-kafka.md
    patterns/
      domain-events.md
      saga-process-manager.md
      cqrs.md
      event-sourcing.md
      api-standards.md               # request/response shapes, error envelopes
    checklists/
      feature-slice-checklist.md     # from UL → tests
      adapter-readiness-checklist.md
      release-readiness-checklist.md

  # Schemas agents can parse (optional, but powerful)
  /schemas/
    project-manifest.schema.json
    bounded-context.schema.json
    ports.schema.json
    aggregates.schema.json

  # Example domain we’ll grow over time
  /examples/
    orders/                          # bounded context: Orders
      00-readme.md                   # what the example covers
      ubiquitous-language.yaml
      aggregates.yaml
      ports.yaml
      specs/
        place-order.md
        confirm-order.md
        pay-for-order.md
      snippets/                      # tiny, focused code snippets (no full app yet)
        domain_entities.py
        application_ports.py
        outbound_port_contract_tests.py
        adapter_fake_payment_gateway.py


