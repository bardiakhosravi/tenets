# Primary Adapter Rules
- Primary adapters are the entry points (web controllers, CLI, message consumers)
- Should translate external requests to domain commands/queries
- Must not contain business logic - only translation and validation
- Should handle framework-specific concerns (HTTP status codes, serialization)
- Should be thin and delegate to use cases through primary ports

```python
# FastAPI Controller (Primary Adapter)
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel

class CreateUserRequest(BaseModel):
    email: str
    name: str

class ChangeEmailRequest(BaseModel):
    email: str

class CreateUserResponse(BaseModel):
    user_id: str

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CreateUserResponse)
async def create_user(
    request: CreateUserRequest,
    use_case: CreateUserPort = Depends()
) -> CreateUserResponse:
    try:
        command = CreateUserCommand(
            email=request.email,
            name=request.name
        )
        response = use_case.execute(command)
        return CreateUserResponse(user_id=response.user_id)
    except InvalidEmailError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email: {str(e)}")
    except UserAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except DomainException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{user_id}/email", status_code=status.HTTP_204_NO_CONTENT)
async def change_user_email(
    user_id: str,
    request: ChangeEmailRequest,
    use_case: ChangeUserEmailPort = Depends()
) -> None:
    try:
        command = ChangeEmailCommand(
            user_id=UserId(user_id),
            new_email=request.email
        )
        use_case.execute(command)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except InvalidEmailError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email: {str(e)}")
    except DomainException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=GetUserResponse)
async def get_user(
    user_id: str,
    use_case: GetUserPort = Depends()
) -> GetUserResponse:
    try:
        query = GetUserQuery(user_id=UserId(user_id))
        response = use_case.execute(query)
        return GetUserResponse(
            user_id=response.user_id,
            email=response.email,
            name=response.name
        )
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except DomainException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    use_case: DeactivateUserPort = Depends()
) -> None:
    try:
        command = DeactivateUserCommand(user_id=UserId(user_id))
        use_case.execute(command)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except UserAlreadyDeactivatedError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except DomainException as e:
        raise HTTPException(status_code=400, detail=str(e))
```
