# Commit Command

Create well-structured git commits.

## Usage
```
/commit [--amend] [message]
```

## Process

### 1. Review Changes
- Run `git status` and `git diff`
- Verify all changes are intentional
- Check for accidental file inclusions

### 2. Stage Changes
- Stage related changes together
- Use `git add -p` for partial staging if needed
- Exclude generated files, secrets, debug code

### 3. Write Message
Format:
```
type(scope): brief description

Longer explanation if needed:
- What changed
- Why it changed
- Any breaking changes or migration notes

Refs: #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no logic change)
- `refactor`: Code change (no feature/fix)
- `test`: Adding/fixing tests
- `chore`: Maintenance tasks

### 4. Verify
- Run tests before committing
- Review the final diff one more time
- Ensure commit message accurately describes changes

## Don'ts
- Don't commit broken code
- Don't include unrelated changes
- Don't commit secrets or credentials
- Don't use vague messages ("fix", "update", "wip")
