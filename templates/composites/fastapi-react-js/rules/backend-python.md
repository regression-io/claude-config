---
globs: backend/**
---
# Python Rules (Backend)

These rules apply to the FastAPI backend in `backend/`.

## Style
- Use 4 spaces for indentation
- `snake_case` for functions/variables, `PascalCase` for classes
- Type hints on all public functions
- Google-style docstrings

## Patterns
```python
# Use Pydantic for validation
from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: EmailStr

# Use dependency injection
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> User:
    ...

# Async context managers for resources
async with async_session() as session:
    ...
```

## Project Structure
```
backend/
├── src/api/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings
│   ├── dependencies.py   # DI
│   ├── routers/          # Endpoints
│   ├── models/           # SQLAlchemy
│   ├── schemas/          # Pydantic
│   └── services/         # Business logic
├── tests/
└── pyproject.toml
```

## Testing
```bash
cd backend
pytest -v --cov=src
```
