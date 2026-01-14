---
globs: frontend/**
---
# React TypeScript Rules (Frontend)

These rules apply to the React frontend in `frontend/`.

## Style
- Functional components only
- `PascalCase` for components, `camelCase` for functions
- Explicit TypeScript types for props
- Named exports preferred

## Component Pattern
```typescript
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <h3>{user.name}</h3>
      {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
    </div>
  );
}
```

## Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable (Button, Input)
│   │   └── features/     # Domain-specific
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Route pages
│   ├── services/         # API calls
│   ├── types/            # TypeScript types
│   └── utils/
├── package.json
└── tsconfig.json
```

## API Integration
```typescript
// Use shared types from ../shared/
import type { User, ApiError } from '../../shared/api-types';

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

## Testing
```bash
cd frontend
npm run test
npm run typecheck
```
