# API Boundary Rules

## API Must Not Leak Persistence Models
- Primary adapters (controllers) MUST return response DTOs, never domain entities or persistence models
- Request/response schemas (e.g., Pydantic `BaseModel`) live in the primary adapter layer
- Persistence models (e.g., SQLAlchemy `Model`, MongoDB schemas) live exclusively in secondary adapter packages
- Domain objects may pass through use cases but MUST be mapped to DTOs before crossing the adapter boundary
- No ORM-managed object or database-specific annotation should ever appear in an API response

```python
# BAD: leaking domain entity or persistence model
@router.get("/{user_id}")
async def get_user(user_id: str) -> User:  # Domain entity in response
    ...

# BAD: leaking persistence model
@router.get("/{user_id}")
async def get_user(user_id: str) -> UserModel:  # SQLAlchemy model in response
    ...

# GOOD: dedicated response DTO
class GetUserResponse(BaseModel):
    user_id: str
    email: str
    name: str

@router.get("/{user_id}", response_model=GetUserResponse)
async def get_user(user_id: str, use_case: GetUserPort = Depends()) -> GetUserResponse:
    result = use_case.execute(GetUserQuery(user_id=UserId(user_id)))
    return GetUserResponse(user_id=result.user_id, email=result.email, name=result.name)
```
