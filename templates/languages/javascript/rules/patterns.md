# JavaScript Patterns & Best Practices

## Async/Await
```javascript
// Prefer async/await over raw promises
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// Error handling with Promise.allSettled
const results = await Promise.allSettled(urls.map(fetch));
const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
```

## Error Handling
```javascript
// Custom error classes
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(field, message) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

// Centralized error handling
function handleError(error) {
  if (error instanceof ValidationError) {
    return { status: 400, body: { field: error.field, message: error.message } };
  }
  console.error('Unexpected error:', error);
  return { status: 500, body: { message: 'Internal server error' } };
}
```

## Functional Patterns
```javascript
// Pure functions
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;

// Composition
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
const process = pipe(
  normalize,
  validate,
  transform
);

// Immutable updates
const updateUser = (user, updates) => ({
  ...user,
  ...updates,
  updatedAt: new Date()
});
```

## Defensive Programming
```javascript
// Guard clauses
function processUser(user) {
  if (!user) {
    throw new Error('User is required');
  }
  if (!user.email) {
    throw new ValidationError('email', 'Email is required');
  }
  // Main logic...
}

// Default values
function createConfig(options = {}) {
  return {
    timeout: 5000,
    retries: 3,
    ...options
  };
}

// Type checking at runtime
function isObject(value) {
  return value !== null && typeof value === 'object';
}
```

## Testing
```javascript
import { describe, it, expect, vi } from 'vitest';

describe('UserService', () => {
  it('should create a user', async () => {
    const mockDb = { insert: vi.fn().mockResolvedValue({ id: 1 }) };
    const service = new UserService(mockDb);

    const user = await service.create({ name: 'Test' });

    expect(user.id).toBe(1);
    expect(mockDb.insert).toHaveBeenCalledWith({ name: 'Test' });
  });
});
```
