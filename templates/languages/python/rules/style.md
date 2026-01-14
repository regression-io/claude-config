# Python Style Rules

## PEP 8 Compliance
- Use 4 spaces for indentation (never tabs)
- Maximum line length: 88 characters (Black default)
- Two blank lines between top-level definitions
- One blank line between method definitions

## Naming Conventions
- `snake_case` for functions, variables, modules
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- `_private` prefix for internal use
- `__dunder__` for magic methods only

## Imports
```python
# Standard library
import os
import sys

# Third-party
import requests
from pydantic import BaseModel

# Local
from myapp.models import User
from myapp.utils import helper
```
- One import per line
- Group: stdlib, third-party, local (blank line between)
- Absolute imports preferred
- Avoid `from module import *`

## Type Hints
```python
def process_user(user_id: int, options: dict[str, Any] | None = None) -> User:
    """Process a user by ID."""
    ...
```
- Use type hints for all public functions
- Use `|` for unions (Python 3.10+)
- Import from `typing` for complex types

## Docstrings
```python
def calculate_total(items: list[Item], discount: float = 0.0) -> float:
    """Calculate the total price of items with optional discount.

    Args:
        items: List of items to sum.
        discount: Percentage discount (0.0 to 1.0).

    Returns:
        Total price after discount.

    Raises:
        ValueError: If discount is not between 0 and 1.
    """
```
- Use Google style docstrings
- Document all public functions and classes
- Include Args, Returns, Raises sections
