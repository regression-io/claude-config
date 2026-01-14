# React TypeScript Component Rules

## Component Structure
```typescript
// Functional components only (no class components)
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
    </div>
  );
}
```

## File Organization
```
src/
├── components/
│   ├── ui/              # Generic reusable (Button, Input, Modal)
│   ├── features/        # Feature-specific (UserCard, OrderList)
│   └── layout/          # Layout (Header, Sidebar, Footer)
├── hooks/               # Custom hooks
├── pages/               # Route pages
├── services/            # API calls
├── types/               # TypeScript types
└── utils/               # Helper functions
```

## Naming Conventions
- Components: `PascalCase` - `UserCard.tsx`
- Hooks: `useCamelCase` - `useAuth.ts`
- Utils: `camelCase` - `formatDate.ts`
- Types: `PascalCase` - `User`, `UserCardProps`

## Props Typing
```typescript
// Define props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  children: React.ReactNode;
}

// Use children explicitly
export function Button({ variant = 'primary', loading, children, ...props }: ButtonProps) {
  return (
    <button disabled={loading} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

## Event Handlers
```typescript
// Type event handlers properly
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}

function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // ...
}
```
