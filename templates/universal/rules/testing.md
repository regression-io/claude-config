# Testing Rules

## Test-Driven Development
- Write tests BEFORE implementation (Red-Green-Refactor)
- Each test verifies a single behavior
- Tests must be independent - no test depends on another
- Keep tests small: ideally <10 assertions

## Coverage Requirements
- New features must include tests
- Bug fixes must include regression tests
- Aim for >80% coverage, >90% for critical paths
- Coverage measures behavior testing, not just line coverage

## Test Quality (FIRST)
- Fast: Tests run in milliseconds
- Isolated: No shared state between tests
- Repeatable: Same results every run, no flakiness
- Self-checking: Clear pass/fail without manual verification
- Timely: Written close to implementation

## Test Pyramid
- 70% Unit tests (fast, isolated)
- 20% Integration tests (component interactions)
- 10% E2E tests (user workflows)
- Don't test implementation details - test behavior

## Naming & Organization
- Pattern: test_[unit]_[scenario]_[expected]
- Example: test_validateEmail_invalidFormat_returnsFalse
- One test file per production module
- Group related tests with describe/context blocks

## Assertions & Mocking
- One logical assertion per test
- Use specific assertion messages
- Mock external services and dependencies
- Use factories for complex test objects
