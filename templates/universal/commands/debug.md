# Debug Command

Systematically diagnose and fix issues.

## Usage
```
/debug <error-message|symptom|file:line>
```

## Debug Process

### 1. Reproduce
- Understand the exact steps to trigger the issue
- Identify inputs, environment, and preconditions
- Confirm the issue is reproducible

### 2. Isolate
- Narrow down to smallest failing case
- Binary search through code/commits if needed
- Check recent changes in the affected area

### 3. Diagnose
- Read error messages and stack traces carefully
- Add logging at key decision points
- Check assumptions about inputs/state
- Verify external dependencies (APIs, DB, files)

### 4. Fix
- Address root cause, not just symptoms
- Consider if this bug class exists elsewhere
- Write a test that catches this bug

### 5. Verify
- Confirm original issue is resolved
- Run related tests
- Check for regressions

## Common Issues

### Null/Undefined Errors
- Check function return values
- Verify data from external sources
- Use optional chaining or guards

### Async Issues
- Ensure promises are awaited
- Check for race conditions
- Verify callback order

### State Issues
- Log state at key points
- Check for unintended mutations
- Verify initialization order
