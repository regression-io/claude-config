# React JavaScript Component Rules

## Component Structure
```javascript
// Functional components only
export function UserCard({ user, onEdit, className }) {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
    </div>
  );
}

// PropTypes for runtime validation
import PropTypes from 'prop-types';

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
  className: PropTypes.string,
};

UserCard.defaultProps = {
  className: '',
};
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
└── utils/               # Helper functions
```

## Naming Conventions
- Components: `PascalCase` - `UserCard.jsx`
- Hooks: `useCamelCase` - `useAuth.js`
- Utils: `camelCase` - `formatDate.js`
- Files: Match component name

## Props Pattern
```javascript
// Destructure props with defaults
export function Button({
  variant = 'primary',
  loading = false,
  children,
  ...props
}) {
  return (
    <button disabled={loading} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
```

## JSDoc for Type Hints
```javascript
/**
 * @param {Object} props
 * @param {import('../types').User} props.user
 * @param {(user: import('../types').User) => void} [props.onEdit]
 */
export function UserCard({ user, onEdit }) {
  // IDE gets type hints from JSDoc
}
```
