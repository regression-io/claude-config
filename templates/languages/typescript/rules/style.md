# TypeScript Style Rules

## Naming Conventions
- `camelCase` for variables, functions, methods
- `PascalCase` for classes, interfaces, types, enums
- `UPPER_SNAKE_CASE` for constants
- `_privateMethod` prefix discouraged; use `private` keyword
- Prefix interfaces with `I` only if project convention requires

## Type Definitions
```typescript
// Prefer interfaces for objects
interface User {
  id: number;
  name: string;
  email: string;
  roles?: string[];
}

// Use types for unions, intersections, primitives
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;

// Generics
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

## Strict Mode
Enable in tsconfig.json:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Avoid `any`
```typescript
// ❌ Bad
function process(data: any): any { ... }

// ✅ Good
function process<T extends Record<string, unknown>>(data: T): ProcessedData { ... }

// Use unknown for truly unknown types
function parseJSON(text: string): unknown {
  return JSON.parse(text);
}
```

## Null Handling
```typescript
// Optional chaining
const name = user?.profile?.name;

// Nullish coalescing
const displayName = name ?? 'Anonymous';

// Type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

## Imports
```typescript
// Named imports (preferred)
import { User, UserService } from './user';

// Type-only imports
import type { Config } from './config';

// Avoid default exports (harder to refactor)
export { UserService };  // Named export preferred
```
