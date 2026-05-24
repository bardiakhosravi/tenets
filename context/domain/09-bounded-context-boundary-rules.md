# Bounded Context Boundary Rules

## Cross-Context Reference IDs

A bounded context may store the ID of an entity owned by another bounded context when it needs to maintain a relationship to that entity.
This is called a **cross-context reference ID**.

Example:

```text
Staff Management owns StaffSchoolAssignment.
School Management owns School.
StaffSchoolAssignment may store school_id.
That school_id is a reference to a School owned by School Management.
```

This does not mean the referencing bounded context owns the referenced entity.

## Rule

A bounded context may define local value objects for IDs of external entities it references.
Those value objects represent references, not ownership.
The owning bounded context remains responsible for validating existence, status, and business rules through its public contract.

## Example

Staff Management may define its own local `SchoolId` value object:

```python
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class SchoolId:
    """
    Reference to a School owned by School Management.
    Staff Management stores this ID for staff-school assignment,
    but School Management remains the source of truth for the school.
    """
    value: UUID
```

Staff Management may use this value object inside its own aggregate:

```python
from dataclasses import dataclass


@dataclass
class StaffSchoolAssignment:
    staff_id: StaffId
    school_id: SchoolId
    role: StaffSchoolRole
```

This is acceptable because `SchoolId` is only a reference.

Staff Management must still validate the school through School Management's public contract before creating the assignment.

## Do Not Import Another Context's Domain Value Object

Avoid this inside Staff Management:

```python
from src.school_management.domain.model.school.value_objects import SchoolId
```

Even though `SchoolId` looks simple, importing it from School Management's domain layer creates a domain dependency between bounded contexts.

Prefer this:

- Staff Management defines its own local `SchoolId` reference value object.
- Or Staff Management uses a generic ID primitive if the project already has one.

Do not put domain-specific IDs such as `SchoolId`, `RoomId`, `StaffId`, or `ChildId` in shared just because multiple contexts mention them.

## Validation Rule

When a bounded context stores a relationship to an entity owned by another bounded context, it must validate the external entity through the owning context's public contract before persisting the relationship.

Example:

```text
Staff Management stores staff_school_assignment.
School is owned by School Management.
Therefore Staff Management must validate school through School Management before saving the assignment.
```

Example flow:

1. Staff Management receives `school_id` from the API request.
2. Staff Management loads the staff member from its own repository.
3. Staff Management calls School Management's public contract to validate the school.
4. School Management confirms the school exists, belongs to the organization, and is assignable.
5. Staff Management creates `StaffSchoolAssignment` using its local `SchoolId` reference value object.

## Ownership Examples

Staff Management:

- May store `SchoolId` as a reference on `StaffSchoolAssignment`.
- May store `RoomId` as a reference on `StaffRoomAssignment`.
- Does not own `School` or `Room`.

School Management:

- Owns `School` and `Room`.
- Owns school status, room status, and school/room business rules.

Child Management:

- May store `SchoolId` or `RoomId` only if needed as a reference.
- Does not own `School` or `Room`.

IAM:

- May store `scope_type = "school"` and `scope_id = school_id`.
- Does not own `School`.

## Final Rule

Store foreign context IDs as local reference value objects.
Validate referenced entities through the owning context's public contract.
Never import another bounded context's domain model or domain value objects just to reuse an ID type.
