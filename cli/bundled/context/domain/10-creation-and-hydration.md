# Domain Object Creation and Hydration Rules

## Creation and Hydration Are Different Operations

- **Creation** establishes a domain entity, aggregate, or value object for the first time from the business's perspective.
- **Hydration** reconstructs an existing domain object from persisted state.
- Creation and hydration MUST use different entry points because they have different semantics and side effects.

## Creation Rules

- Create every new entity, aggregate, and value object through a standalone `create_<domain_object>()` function in the same module as that domain object.
- Do not use class factory methods such as `User.create(...)`.
- Do not call the class constructor directly when creating a new domain object in application or domain workflow code.
- A creation function MUST receive all inputs that are already available and belong to the object's valid initial state.
- A creation function is responsible for creation-specific behavior such as normalization, invariant enforcement, identity generation, initial defaults, and creation-event recording.
- Do not create an intentionally incomplete object and then immediately call mutation methods to supply creation data that was already available.
- Mutation methods remain valid for genuine business transitions that happen after creation or when new information becomes available later.

```python
@dataclass(eq=False)
class User:
    id: UserId
    email: Email
    name: str

    def change_name(self, new_name: str) -> None:
        self.name = new_name


def create_user(email: Email, name: str) -> User:
    return User(
        id=UserId.generate(),
        email=email,
        name=name,
    )
```

```python
# GOOD: all available initial state is supplied at creation.
email = create_email(command.email)
user = create_user(email=email, name=command.name)

# BAD API and workflow: name was already available but omitted from creation.
def create_user_incomplete(email: Email) -> User:
    return User(id=UserId.generate(), email=email, name="")


user = create_user_incomplete(email)
user.change_name(command.name)
```

Optional state that is unavailable or does not belong to the valid initial state does not need to be accepted by the creation function. A later domain method may apply that state when the corresponding business transition occurs.

## Value Object Creation

Value objects follow the same entry-point rule. The creation function may normalize external input before constructing the immutable value.

```python
@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        if "@" not in self.value:
            raise InvalidEmailError(self.value)


def create_email(raw_value: str) -> Email:
    return Email(value=raw_value.strip().lower())
```

## Hydration Rules

- Repository adapters hydrate domain objects with their class constructors, not their creation functions.
- Hydration MUST provide persisted identity and state explicitly.
- Hydration MUST NOT generate a new identity, apply new-object defaults, record creation events, or perform other creation-only behavior.
- Constructors may enforce invariants that must hold for both newly created and hydrated objects, but they MUST NOT contain creation-specific side effects.
- Repository mapping code is responsible for reconstructing the complete aggregate, including its child entities and value objects.

```python
class SqlUserRepository(UserRepository):
    def _hydrate(self, row: UserRow) -> User:
        return User(
            id=UserId(row.id),
            email=Email(row.email),
            name=row.name,
        )
```

## Responsibility Summary

> **Creation functions establish new domain objects.**
>
> **Constructors hydrate existing domain objects.**
>
> **Creation functions receive complete initial creation data.**
>
> **Mutation methods represent later business transitions, not unfinished creation.**
