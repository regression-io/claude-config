# FastAPI Endpoint Rules

## Request/Response Models
```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Request schema (input)
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

# Response schema (output)
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode

# Update schema (partial)
class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
```

## CRUD Endpoints
```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db = Depends(get_db),
):
    return await UserService(db).list(skip=skip, limit=limit)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db = Depends(get_db)):
    return await UserService(db).create(user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db = Depends(get_db)):
    user = await UserService(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, updates: UserUpdate, db = Depends(get_db)):
    user = await UserService(db).update(user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db = Depends(get_db)):
    deleted = await UserService(db).delete(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
```

## Path & Query Parameters
```python
@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1),           # Required
    status: str | None = Query(None),            # Optional
    limit: int = Query(10, ge=1, le=100),        # With bounds
):
    ...

@router.get("/{user_id}/posts/{post_id}")
async def get_user_post(
    user_id: int = Path(..., gt=0),
    post_id: int = Path(..., gt=0),
):
    ...
```
