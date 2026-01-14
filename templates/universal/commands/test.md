# Test Command

Run and analyze tests.

## Usage
```
/test [file|pattern] [--coverage] [--watch]
```

## Test Workflow

### Run Tests
- Run all tests: verify nothing is broken
- Run specific tests: when working on a feature
- Run with coverage: identify untested code

### Analyze Failures
1. Read the failure message carefully
2. Identify which assertion failed
3. Check test setup and preconditions
4. Compare expected vs actual values
5. Debug the code or fix the test

### Write New Tests
For each unit:
1. Test the happy path
2. Test edge cases (empty, null, boundary)
3. Test error conditions
4. Test integration points

### Test Quality Checks
- Tests should fail when code is broken
- Tests should pass when code is correct
- Tests should be fast and isolated
- Tests should be readable as documentation

## Coverage Guidelines
- Aim for >80% line coverage
- 100% coverage on critical paths
- Coverage measures tested code, not code quality
- Focus on meaningful tests, not coverage numbers

## Common Test Issues
- **Flaky tests**: Fix timing issues, mock external deps
- **Slow tests**: Move to integration suite, use mocks
- **Brittle tests**: Test behavior, not implementation
