# Document Command

Generate or update documentation.

## Usage
```
/document [file|module|--api|--readme]
```

## Documentation Types

### Code Documentation
- Add docstrings/JSDoc to functions
- Document parameters, returns, throws
- Include usage examples for complex APIs
- Note any side effects or prerequisites

### API Documentation
Generate for each endpoint:
- HTTP method and path
- Request parameters (path, query, body)
- Response format with examples
- Error responses
- Authentication requirements

### README Generation
Include sections:
1. Project title and description
2. Installation instructions
3. Quick start / Usage examples
4. Configuration options
5. Contributing guidelines
6. License

### Architecture Documentation
Document:
- System overview diagram
- Key components and responsibilities
- Data flow for main use cases
- External dependencies
- Deployment architecture

## Documentation Standards
- Write for the reader, not the writer
- Keep it concise but complete
- Use examples liberally
- Update docs with code changes
- Date architecture decisions

## Output
- For code: inline documentation
- For API: OpenAPI/Swagger spec
- For README: Markdown file
- For architecture: Markdown with diagrams
