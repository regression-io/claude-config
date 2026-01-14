# Security Rules

## Input Validation
- Treat all external input as hostile - validate at boundaries
- Use allowlists over blocklists for input validation
- Validate format, length, type, and range before processing
- Never trust client-side validation - always validate server-side
- Sanitize outputs for their target context (HTML, SQL, URL)

## Secrets & Credentials
- NEVER hardcode secrets, API keys, or credentials
- Use environment variables or secure vaults for secrets
- Never commit secrets to version control
- Never log sensitive data (passwords, tokens, PII)
- Rotate credentials regularly

## Authentication
- Use secure session management with appropriate timeouts
- Implement rate limiting on auth endpoints
- Use HTTPS/TLS for all authentication transmissions
- Hash passwords with bcrypt, PBKDF2, or Argon2 (never plaintext)

## Access Control
- Apply "default deny" - deny access unless explicitly authorized
- Implement principle of least privilege
- Verify authorization at every access point
- Log and audit all access to sensitive resources

## Error Handling
- Never expose stack traces or internal details to users
- Return generic error messages externally
- Log full error details internally for debugging
- Include unique error IDs for support correlation

## Data Protection
- Encrypt sensitive data in transit (TLS) and at rest
- Use strong encryption algorithms (avoid MD5, SHA1)
- Clear sensitive data from memory after use
- Sanitize logs to prevent information leakage
