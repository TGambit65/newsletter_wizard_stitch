# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Measures Implemented

### Authentication & Authorization
- JWT-based authentication via Supabase Auth
- Row-Level Security (RLS) policies on all database tables
- Role-based access control (owner, admin, member roles)
- Session management with secure token handling

### API Security
- API keys are hashed using SHA-256 before storage
- Rate limiting implemented on all edge functions (configurable per key)
- CORS headers properly configured
- Input validation on all endpoints

### Data Protection
- All data encrypted in transit (TLS/HTTPS)
- Database encryption at rest via Supabase
- Sensitive data (API keys) never logged or exposed
- Parameterized queries prevent SQL injection

### Security Headers
All edge functions include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Audit Logging
Security-sensitive operations are logged to the `audit_logs` table:
- API key creation/revocation
- Resource deletions
- Permission changes
- Authentication events

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to the repository maintainers
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will work with you to understand and address the issue.

## Security Best Practices for Users

1. **API Keys**: Store API keys securely, never commit to version control
2. **Environment Variables**: Use `.env` files locally, secure secrets management in production
3. **Access Control**: Apply principle of least privilege when assigning roles
4. **Regular Audits**: Review audit logs periodically for suspicious activity
5. **Updates**: Keep dependencies updated to patch known vulnerabilities
