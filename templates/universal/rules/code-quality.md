# Code Quality Rules

## Naming
- Use clear, intention-revealing names that describe purpose
- Avoid single-letter variables except in short loops or math
- Boolean variables/functions: prefix with is, has, can, should
- Functions: use verb-noun patterns (getUser, validateEmail)
- Be specific: use shoppingCart not cart, authService not service

## Functions & Methods
- Keep functions small and focused (ideally <20 lines)
- Single responsibility: one function does one thing well
- Limit parameters to 3; use objects for more
- Use early returns to reduce nesting
- Extract frequently-used logic into helper functions

## Complexity
- Keep cyclomatic complexity under 10
- Avoid deep nesting (>3 levels) - extract or early return
- Prefer composition over inheritance
- Limit conditional branching; consider polymorphism

## Comments & Documentation
- Write comments for "why", not "what"
- Keep comments concise and maintain with code changes
- Flag hacks with TODO/FIXME with explanation
- Document public APIs: purpose, parameters, returns, errors

## Code Smells to Avoid
- Duplicated code - extract into shared functions
- Long parameter lists - use objects or builder pattern
- Primitive obsession - create domain objects
- Dead code - remove unused functions and variables
- Magic numbers - extract to named constants

## Refactoring
- Refactor continuously as you develop
- Write tests BEFORE refactoring
- Make small, incremental changes
- Never refactor and add features in the same commit
