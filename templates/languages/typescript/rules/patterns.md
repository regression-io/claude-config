# TypeScript Patterns & Best Practices

## Error Handling
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

// Result type pattern
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function parseConfig(text: string): Result<Config> {
  try {
    return { success: true, data: JSON.parse(text) };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}
```

## Async Patterns
```typescript
// Async/await with proper error handling
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new AppError('Failed to fetch user', 'FETCH_ERROR', response.status);
  }
  return response.json();
}

// Parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// With timeout
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}
```

## Dependency Injection
```typescript
interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

class UserService {
  constructor(
    private readonly db: Database,
    private readonly logger: Logger
  ) {}

  async getUser(id: string): Promise<User | null> {
    this.logger.info(`Fetching user ${id}`);
    return this.db.users.findById(id);
  }
}
```

## Utility Types
```typescript
// Partial - all props optional
function updateUser(id: string, updates: Partial<User>): Promise<User>

// Pick/Omit - subset of props
type UserPreview = Pick<User, 'id' | 'name'>;
type UserCreate = Omit<User, 'id' | 'createdAt'>;

// Record - typed objects
type UserMap = Record<string, User>;

// Required - remove optional
type RequiredUser = Required<User>;
```

## Testing
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('UserService', () => {
  it('should fetch user by id', async () => {
    const mockDb = {
      users: { findById: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }) }
    };
    const service = new UserService(mockDb as any, console);

    const user = await service.getUser('1');

    expect(user).toEqual({ id: '1', name: 'Test' });
    expect(mockDb.users.findById).toHaveBeenCalledWith('1');
  });
});
```
