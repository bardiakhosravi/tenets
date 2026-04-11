# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## Domain Language *(mandatory)*

<!--
  IMPORTANT: Before writing any user stories, establish the ubiquitous language for
  this feature. These are the terms that domain experts use and that will appear in
  code, APIs, UI, and all conversations.

  BEFORE defining new terms:
  1. Check any existing domain glossary for this project
  2. Reuse existing terms where they apply
  3. If an existing term means something different in this feature's context,
     that is a signal this may belong to a different bounded context (see next section)

  After this feature is complete, new terms introduced here should be promoted into
  the domain glossary for the relevant bounded context.
-->

| Term | Definition | Examples | Not to be confused with |
|------|-----------|----------|------------------------|
| [Term 1] | [Plain language definition a domain expert would use] | [Concrete instance] | [Similar term that means something different] |
| [Term 2] | [Plain language definition] | [Concrete instance] | [Similar term] |

## Bounded Context *(mandatory)*

<!--
  IMPORTANT: Determine where this feature lives in the domain landscape.
  Consult any existing context map for the project before making decisions.

  This decision determines which service/module this feature gets built in,
  what team owns it, and how it communicates with the rest of the system.
-->

### Context Decision

- **Bounded Context**: [Name of the bounded context this feature belongs to]
- **New or Existing?**: [Is this a new bounded context or does it extend an existing one?]
- **Core Responsibility**: [One sentence — what this context is responsible for]
- **Explicit Exclusions**: [What this context does NOT do — prevents scope creep]

### Context Relationships

<!--
  Only fill this in if this feature introduces a new bounded context or new
  relationships between existing contexts. Skip if this is purely internal
  to an existing context with no new cross-context communication.

  Integration patterns:
  - Published Language: shared schema (e.g., event contracts)
  - Open Host Service: public API for other contexts to consume
  - Anti-Corruption Layer: translation layer when consuming another context
  - Shared Kernel: small shared model (use sparingly)
  - Customer-Supplier: upstream context provides what downstream needs
  - Conformist: downstream accepts upstream's model as-is
-->

| Relationship | Other Context | Pattern | What Flows | Direction |
|-------------|---------------|---------|------------|-----------|
| [e.g., "Publishes enrollment events"] | [e.g., Billing] | [e.g., Published Language] | [e.g., ChildEnrolled event] | [Upstream/Downstream] |

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently

  USE THE UBIQUITOUS LANGUAGE defined above in all story descriptions and acceptance
  scenarios. If you find yourself using a term not in the glossary, add it.

  FRONTEND COVERAGE: If a user story involves a user interacting with the system
  through a UI, note which views or pages are implied. This ensures downstream
  planning and task generation covers both backend AND frontend work.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Candidate Domain Concepts *(mandatory)*

<!--
  Identify the key domain concepts this feature introduces or touches.
  This is NOT the full domain model (that happens in /speckit.plan) — this is
  an early signal of what aggregates, entities, and value objects likely exist.
  Use this to validate scope and bounded context decisions.
-->

- **[Concept 1]**: [What it represents, why it matters to the business]
- **[Concept 2]**: [What it represents, relationships to other concepts]
- **[Concept 3]**: [What it represents, key business rules it carries]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
