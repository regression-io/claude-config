# Security Review Command

Audit code for security vulnerabilities.

## Usage
```
/security-review [file|directory|--all]
```

## Security Checklist

### Input Validation
- [ ] All user input is validated
- [ ] Input length limits enforced
- [ ] Allowlists preferred over blocklists
- [ ] File uploads validated (type, size, content)

### Injection Prevention
- [ ] SQL uses parameterized queries
- [ ] Shell commands avoid user input
- [ ] HTML output is escaped
- [ ] JSON/XML parsers configured safely

### Authentication
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Session tokens are secure random
- [ ] Tokens expire appropriately
- [ ] Failed attempts are rate-limited

### Authorization
- [ ] Every endpoint checks permissions
- [ ] No privilege escalation paths
- [ ] Sensitive operations require re-auth
- [ ] Default deny for new resources

### Data Protection
- [ ] Secrets not in code or logs
- [ ] PII is encrypted at rest
- [ ] Sensitive data not in URLs
- [ ] HTTPS enforced everywhere

### Dependencies
- [ ] No known vulnerabilities (npm audit, safety)
- [ ] Dependencies are up to date
- [ ] Minimal dependency footprint

## Output Format
Report findings by severity:
- 🔴 **Critical**: Exploitable vulnerability
- 🟠 **High**: Significant security risk
- 🟡 **Medium**: Defense-in-depth issue
- 🔵 **Low**: Minor security improvement
