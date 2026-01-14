# FastAPI Project Structure

## Directory Layout
```
project/
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── main.py           # FastAPI app entry
│       ├── config.py         # Settings and env vars
│       ├── dependencies.py   # Dependency injection
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── users.py
│       │   └── items.py
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py       # SQLAlchemy/DB models
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── user.py       # Pydantic schemas
│       ├── services/
│       │   ├── __init__.py
│       │   └── user_service.py
│       └── utils/
├── tests/
│   ├── conftest.py
│   └── test_users.py
├── alembic/                  # DB migrations
├── pyproject.toml
└── .env
```

## Main Application
```python
# src/myapp/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

from .config import settings
from .routers import users, items

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(items.router, prefix="/items", tags=["items"])
```

## Configuration
```python
# src/myapp/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "My API"
    DEBUG: bool = False
    DATABASE_URL: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
```

## Router Module
```python
# src/myapp/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_db, get_current_user
from ..schemas.user import UserCreate, UserResponse
from ..services.user_service import UserService

router = APIRouter()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db = Depends(get_db),
):
    service = UserService(db)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```
