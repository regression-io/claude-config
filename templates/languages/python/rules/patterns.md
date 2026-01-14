# Python Patterns & Best Practices

## Context Managers
```python
# File operations
with open("file.txt") as f:
    content = f.read()

# Custom context manager
from contextlib import contextmanager

@contextmanager
def timer(name: str):
    start = time.time()
    yield
    print(f"{name}: {time.time() - start:.2f}s")
```

## Data Classes
```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    roles: list[str] = field(default_factory=list)
    active: bool = True
```
- Use dataclasses for data containers
- Use Pydantic for validation needs

## Exception Handling
```python
class AppError(Exception):
    """Base exception for application."""
    pass

class NotFoundError(AppError):
    """Resource not found."""
    pass

# Usage
try:
    user = get_user(id)
except NotFoundError:
    return {"error": "User not found"}, 404
except AppError as e:
    logger.error(f"App error: {e}")
    raise
```

## Generators & Iterators
```python
# Generator for memory efficiency
def read_large_file(path: str):
    with open(path) as f:
        for line in f:
            yield line.strip()

# Generator expression
squares = (x**2 for x in range(1000000))
```

## Async Patterns
```python
import asyncio

async def fetch_all(urls: list[str]) -> list[Response]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

## Testing
```python
import pytest

@pytest.fixture
def user():
    return User(id=1, name="Test")

def test_user_creation(user):
    assert user.name == "Test"
    assert user.active is True

@pytest.mark.parametrize("input,expected", [
    ("test@email.com", True),
    ("invalid", False),
])
def test_email_validation(input, expected):
    assert validate_email(input) == expected
```
