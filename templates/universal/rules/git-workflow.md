# Git Workflow Rules

## Branch Strategy
- main/master: Always deployable, protected
- feature/*: New features, branch from main
- fix/*: Bug fixes, branch from main
- release/*: Release preparation (if needed)

## Commit Messages
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep subject under 72 characters
- Use imperative mood ("Add feature" not "Added feature")
- Body explains what and why, not how

## Commit Best Practices
- One logical change per commit
- Commit working code only (tests pass)
- Never commit secrets, credentials, or API keys
- Review diff before committing

## Pull Request Guidelines
- Small, focused PRs (<400 lines when possible)
- Clear description of changes and motivation
- Link to related issues
- Include test plan or verification steps
- Request review from relevant code owners

## Code Review
- Review for correctness, clarity, and maintainability
- Check for security issues and edge cases
- Suggest improvements, don't demand
- Approve when satisfied, not when perfect

## Merge Strategy
- Squash for feature branches (clean history)
- Merge commit for release branches (preserve context)
- Rebase only for local cleanup before push
- Never force push to shared branches
