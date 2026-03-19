# Components of Hexagonal Architecture

Use hexagonal architecture to separate business logic, application orchestration, and technical concerns. Follow strict dependency rules and component boundaries to ensure modularity, testability, and adaptability.

---

## Domain

**Responsibilities:**  
- Encapsulate business rules, logic, and invariants.  
- Represent core concepts, entities, value objects, and aggregates.  
- Operate independently from external systems, frameworks, or infrastructure.

**Must:**  
- Contain pure business logic only.  
- Behave deterministically based on inputs.  
- Exposes behavior; application may call these, but domain must not depend on application or ports.

**Must Not:**  
- Depend on application, adapters, ports, or infrastructure.  
- Leak infrastructure concerns (e.g., database code) into domain logic.  
- Include technical or framework-specific annotations.  
- Use domain objects for data transport or serialization.

**Boundaries:**  
- No dependencies on adapters, frameworks, or external services.  
- Communicate only through defined ports with the application layer.

---

## Application

**Responsibilities:**  
- Orchestrate use cases, workflows, and application-specific logic.  
- Coordinate domain objects to fulfill business requirements.  
- Manage transactions, security, and authorization if applicable.  
- Define and expose inbound ports; use outbound ports.

**Must:**  
- Delegate business logic exclusively to the domain.  
- Be stateless and idempotent where possible.  
- Depend only on domain logic and port interfaces.

**Must Not:**  
- Contain business rules.  
- Depend on infrastructure or adapter implementations.  
- Mix application and infrastructure responsibilities.

**Boundaries:**  
- Expose inbound ports and use outbound ports.  
- Never depend on adapter implementations directly.

---

## Ports

### Inbound Ports

**Responsibilities:**  
- Define interfaces to drive application use cases (commands, queries).  
- Specify system capabilities for external actors.

**Must:**  
- Be purely abstract, language- and technology-agnostic.  
- Be declared in the application layer.

**Must Not:**  
- Leak technical details (e.g., HTTP, messaging) into definitions.  
- Depend on adapter-specific data structures.

**Boundaries:**  
- Implemented only by inbound adapters.

### Outbound Ports

**Responsibilities:**  
- Define interfaces for required external operations (persistence, messaging).  
- Specify system needs from the outside world.

**Must:**  
- Be purely abstract and represent business needs, not technical mechanisms.  
- Be declared in the application layer.

**Must Not:**  
- Match specific databases or external APIs.  
- Include technical error handling or transport concerns.

**Boundaries:**  
- Implemented only by outbound adapters.

---

## Adapters

### Inbound Adapters

**Responsibilities:**  
- Translate external requests into calls to inbound ports.  
- Handle protocol-specific concerns (parsing, validation, authentication).

**Must:**  
- Implement inbound ports only.  
- Depend on external protocols and frameworks.  
- Validate inputs rigorously.

**Must Not:**  
- Contain business or workflow logic.  
- Access domain or application internals directly.  
- Skip validation or leak invalid data.

**Boundaries:**  
- Do not depend on other adapters or infrastructure details.

### Outbound Adapters

**Responsibilities:**  
- Implement outbound ports to connect with infrastructure (databases, APIs, message brokers).  
- Translate domain/application requests into external system interactions.

**Must:**  
- Implement outbound ports only.  
- Handle errors properly and translate to port-level abstractions.  
- Depend on external technologies and protocols.

**Must Not:**  
- Contain business or application logic.  
- Know use case orchestration details.  
- Leak external data structures into domain or application.  
- Allow infrastructure failures to propagate as technical exceptions.

**Boundaries:**  
- Do not depend on other adapters, application, or domain internals.

---

## Boundaries & Allowed Dependencies

- **Domain:** MUST have no dependencies.  
- **Application:** MUST depend only on domain and port interfaces.  
- **Ports:** MUST be pure interfaces; MUST NOT depend on adapters or infrastructure.  
- **Adapters:** MUST depend on ports and external technologies ONLY; MUST NOT depend on domain or application internals.

**Allowed Interaction Flow:**  
Inbound adapters → inbound ports → application → domain → outbound ports → outbound adapters.

**Prohibited Interactions:**  
- Adapters MUST NOT call domain or application internals directly.  
- Domain MUST NOT depend on application, ports, or adapters.  
- Application MUST NOT depend on adapters or infrastructure.

---

## Decision Table

| Concern/Responsibility        | Domain | Application | Ports | Adapters |
|------------------------------|--------|-------------|-------|----------|
| Business rules               | MUST   | MUST NOT    | MUST NOT | MUST NOT |
| Use case orchestration       | MUST NOT | MUST     | MUST NOT | MUST NOT |
| Interface definition         | MUST NOT | MUST      | MUST    | MUST NOT |
| Protocol translation         | MUST NOT | MUST NOT  | MUST NOT | MUST    |
| Infrastructure integration   | MUST NOT | MUST NOT  | MUST NOT | MUST    |
| External communication       | MUST NOT | MUST NOT  | MUST NOT | MUST    |
| Dependency on frameworks     | MUST NOT | MUST NOT  | MUST NOT | MUST    |
| Statelessness               | MUST    | MUST       | MUST    | MUST    |

---

## Agent Directive

1. **Respect component responsibilities:** Agents must assign tasks and logic according to component roles.  
2. **Enforce dependency rules:** Agents must not create or allow prohibited dependencies.  
3. **Use ports as boundaries:** Agents must communicate between layers strictly via ports.  
4. **Avoid embedding logic in adapters:** Agents must keep adapters free of business and orchestration logic.  
5. **Validate inputs at inbound adapters:** Agents must ensure all external data is validated before reaching application or domain.  
6. **Maintain purity of domain:** Agents must prevent technical concerns from leaking into domain logic.  
7. **Follow interaction flow:** Agents must route communication through the allowed path only.  
8. **Ensure testability:** Agents must design components to be independently testable.  
9. **Report violations:** Agents must flag any breach of these rules immediately.