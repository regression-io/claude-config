---
globs: frontend/**
---
# React JavaScript Rules (Frontend)

These rules apply to the React frontend in `frontend/`.

## Style
- Functional components only
- `PascalCase` for components, `camelCase` for functions
- PropTypes for runtime validation
- Named exports preferred

## Component Pattern
```javascript
import PropTypes from 'prop-types';

export function UserCard({ user, onEdit }) {
  return (
    <div>
      <h3>{user.name}</h3>
      {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
    </div>
  );
}

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
};
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
│   └── utils/
├── package.json
└── jsconfig.json
```

## API Integration
```javascript
/**
 * @param {number} id
 * @returns {Promise<import('../../shared/api-types').User>}
 */
async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

## Testing
```bash
cd frontend
npm run test
npm run lint
```
