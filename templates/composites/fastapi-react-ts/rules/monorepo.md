# FastAPI + React TypeScript Monorepo Rules

## Project Structure
```
project/
├── backend/                  # FastAPI Python
│   ├── src/
│   │   └── api/
│   ├── tests/
│   ├── pyproject.toml
│   └── .env
├── frontend/                 # React TypeScript
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Shared types/contracts
│   └── api-types.ts
├── docker-compose.yml
├── .claude/
│   └── mcps.json
└── CLAUDE.md
```

## Path-Scoped Rules
This monorepo uses path-scoped rules. Rules apply to specific directories:

- `/backend/**` → Python + FastAPI rules
- `/frontend/**` → TypeScript + React rules
- `/**` → Universal rules

## API Contract
```typescript
// shared/api-types.ts
// Generate from FastAPI OpenAPI schema
// or define manually and share

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## Backend/Frontend Communication
- Backend generates OpenAPI schema: `GET /openapi.json`
- Frontend can use generated types from OpenAPI
- Keep shared types in sync
- Use consistent error format

## Development Workflow
```bash
# Start both services
docker-compose up

# Or separately:
# Backend
cd backend && uvicorn src.api.main:app --reload

# Frontend
cd frontend && npm run dev
```

## Testing Strategy
- Backend: pytest with TestClient
- Frontend: Vitest + Testing Library
- E2E: Playwright against both services
- Contract tests: Verify API matches types
