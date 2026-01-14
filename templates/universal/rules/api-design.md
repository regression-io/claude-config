# API Design Rules

## RESTful Principles
- Use nouns for resources, verbs for actions
- HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- Plural resource names: /users, /orders
- Nested resources for relationships: /users/{id}/orders

## Request/Response
- Use JSON for request and response bodies
- Consistent envelope: `{ "data": ..., "meta": ..., "errors": ... }`
- Include pagination for collections: offset/limit or cursor-based
- Support filtering, sorting, field selection

## Versioning
- Version in URL path: /v1/users or header: Accept-Version
- Never break existing clients
- Deprecate before removing
- Document migration paths

## Error Responses
- Use appropriate HTTP status codes
- 4xx for client errors, 5xx for server errors
- Include error code, message, and details
- Example: `{ "error": { "code": "INVALID_EMAIL", "message": "Email format invalid" }}`

## Security
- Always use HTTPS
- Authenticate every request (except public endpoints)
- Rate limit all endpoints
- Validate and sanitize all inputs
- Don't expose internal IDs or implementation details

## Performance
- Support compression (gzip)
- Implement caching headers (ETag, Cache-Control)
- Keep payloads minimal
- Use async for long operations (return 202, poll for result)
