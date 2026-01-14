# FastAPI Error Handling

## Custom Exceptions
```python
# src/myapp/exceptions.py
from fastapi import HTTPException, status

class AppException(Exception):
    """Base exception for application."""
    def __init__(self, message: str, code: str):
        self.message = message
        self.code = code
        super().__init__(message)

class NotFoundError(AppException):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", "NOT_FOUND")

class ValidationError(AppException):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message, "VALIDATION_ERROR")

class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, "AUTH_ERROR")
```

## Exception Handlers
```python
# src/myapp/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    status_codes = {
        "NOT_FOUND": 404,
        "VALIDATION_ERROR": 400,
        "AUTH_ERROR": 401,
    }
    return JSONResponse(
        status_code=status_codes.get(exc.code, 500),
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the actual error
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            }
        }
    )
```

## Validation Errors
```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
        })
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors,
            }
        }
    )
```

## Usage in Routes
```python
@router.get("/{user_id}")
async def get_user(user_id: int, db = Depends(get_db)):
    user = await UserService(db).get_by_id(user_id)
    if not user:
        raise NotFoundError("User")  # Handled by exception handler
    return user
```
