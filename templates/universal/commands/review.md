# Code Review Command

Review code changes for quality, security, and best practices.

## Usage
```
/review [file|directory|--staged|--branch <name>]
```

## Review Checklist

### Correctness
- [ ] Logic is correct and handles edge cases
- [ ] Error handling is comprehensive
- [ ] No off-by-one errors or boundary issues
- [ ] Race conditions considered (if concurrent)

### Security
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] SQL/command injection prevented
- [ ] Authentication/authorization correct

### Quality
- [ ] Code is readable and well-named
- [ ] Functions are focused (single responsibility)
- [ ] No code duplication
- [ ] Complexity is manageable

### Testing
- [ ] New code has tests
- [ ] Edge cases are tested
- [ ] Tests are meaningful (not just coverage)

### Documentation
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed

## Output Format
Provide findings grouped by severity:
- 🔴 **Critical**: Must fix before merge
- 🟡 **Warning**: Should fix or justify
- 🔵 **Suggestion**: Consider for improvement
- ✅ **Good**: Notable positive patterns
