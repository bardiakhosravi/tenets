---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain and infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 [P] Define domain value objects and entities for this feature in `src/domain/model/`
- [ ] T005 [P] Define repository port interfaces in `src/domain/ports/`
- [ ] T006 [P] Define infrastructure port interfaces in `src/application/ports/secondary/`
- [ ] T007 Setup database schema and migrations
- [ ] T008 [P] Configure dependency injection container in `src/configuration/di_container.py`
- [ ] T009 Setup error handling — DomainException and AdapterException hierarchies

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] BDD contract test for [endpoint] in `tests/contract/test_[name].feature`
- [ ] T011 [P] [US1] Integration test for [user journey] in `tests/integration/test_[name].py`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement [Entity/Aggregate] in `src/domain/model/[entity].py`
- [ ] T013 [P] [US1] Implement repository adapter in `src/adapters/secondary/sql/sql_[name]_repository.py`
- [ ] T014 [US1] Implement use case in `src/application/use_cases/[name]_use_case.py` (depends on T012)
- [ ] T015 [US1] Implement primary port in `src/application/ports/primary/[name]_port.py`
- [ ] T016 [US1] Implement API controller in `src/adapters/primary/web/[name]_controller.py`
- [ ] T017 [US1] Wire use case in DI container

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] BDD contract test for [endpoint] in `tests/contract/test_[name].feature`
- [ ] T019 [P] [US2] Integration test for [user journey] in `tests/integration/test_[name].py`

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement [Entity] in `src/domain/model/[entity].py`
- [ ] T021 [US2] Implement use case in `src/application/use_cases/[name]_use_case.py`
- [ ] T022 [US2] Implement API controller in `src/adapters/primary/web/[name]_controller.py`
- [ ] T023 [US2] Wire use case in DI container

**Checkpoint**: User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] BDD contract test for [endpoint] in `tests/contract/test_[name].feature`
- [ ] T025 [P] [US3] Integration test for [user journey] in `tests/integration/test_[name].py`

### Implementation for User Story 3

- [ ] T026 [P] [US3] Implement [Entity] in `src/domain/model/[entity].py`
- [ ] T027 [US3] Implement use case in `src/application/use_cases/[name]_use_case.py`
- [ ] T028 [US3] Implement API controller in `src/adapters/primary/web/[name]_controller.py`
- [ ] T029 [US3] Wire use case in DI container

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

<!--
  ============================================================================
  IMPORTANT — FRONTEND COVERAGE CHECK:

  If ANY user story in the spec describes a user-facing interaction, you MUST
  include a frontend phase with tasks for the UI pages, components, and
  navigation needed to complete those stories through the browser.

  Ask: "Can a user complete this story without a UI page?" If no, generate
  frontend tasks. Omitting frontend when user stories require UI is a gap.
  ============================================================================
-->

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in `tests/unit/`
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Domain model before use cases
- Use cases before controllers
- Core implementation before DI wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel
- Models within a story marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Test independently → Deploy/Demo (MVP!)
3. User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (BDD test-first)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
