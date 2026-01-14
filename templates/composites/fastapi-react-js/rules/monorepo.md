# FastAPI + React JavaScript Monorepo Rules

## Project Structure
```
project/
├── backend/                  # FastAPI Python
│   ├── src/
│   │   └── api/
│   ├── tests/
│   ├── pyproject.toml
│   └── .env
├── frontend/                 # React JavaScript
│   ├── src/
│   ├── package.json
│   └── jsconfig.json
├── shared/                   # Shared types via JSDoc
│   └── api-types.js
├── docker-compose.yml
├── .claude/
│   └── mcps.json
└── CLAUDE.md
```

## Path-Scoped Rules
This monorepo uses path-scoped rules:

- `/backend/**` → Python + FastAPI rules
- `/frontend/**` → JavaScript + React rules
- `/**` → Universal rules

## Shared Types (JSDoc)
```javascript
// shared/api-types.js
/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} ApiError
 * @property {{code: string, message: string, details?: any}} error
 */

export {};
```

## Backend/Frontend Communication
- Backend generates OpenAPI schema
- Use PropTypes for runtime validation in React
- Keep JSDoc types in sync with backend schemas
- Consistent error handling format

## Development Workflow
```bash
# Start both services
docker-compose up

# Or separately:
cd backend && uvicorn src.api.main:app --reload
cd frontend && npm run dev
```

## Testing Strategy
- Backend: pytest
- Frontend: Jest + Testing Library
- E2E: Playwright
- Manual API testing with Postman/httpie
