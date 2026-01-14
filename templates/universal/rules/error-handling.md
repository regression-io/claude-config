# Error Handling Rules

## Fail Fast Principle
- Validate inputs at system boundaries immediately
- Throw exceptions for unexpected states, don't return error codes
- Use assertions for programming errors (should never happen)
- Use exceptions for runtime errors (might happen)

## Exception Design
- Create specific exception types for different error categories
- Include contextual information in error messages
- Never catch generic exceptions unless re-throwing
- Clean up resources in finally blocks or use RAII/context managers

## Error Messages
- Include: what happened, why it happened, how to fix it
- Log technical details, show user-friendly messages
- Never expose stack traces or internal paths to users
- Use structured logging with correlation IDs

## Recovery Strategies
- Implement retry with exponential backoff for transient failures
- Use circuit breakers for failing dependencies
- Define fallback behavior for non-critical features
- Graceful degradation over complete failure

## Async Error Handling
- Always handle promise rejections
- Use try/catch with async/await
- Propagate errors through async boundaries properly
- Consider timeout handling for all async operations

## Logging Levels
- ERROR: System cannot perform a function (needs attention)
- WARN: Unexpected but handled (monitor for patterns)
- INFO: High-level flow (audit trail)
- DEBUG: Detailed diagnostics (development only)
