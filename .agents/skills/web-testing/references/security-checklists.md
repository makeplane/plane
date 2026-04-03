# Security Checklists

## Authentication Security

- [ ] Strong auth mechanism (OAuth 2.0, JWT, OIDC)
- [ ] No basic auth or custom schemes
- [ ] Password policy enforced (12+ chars, complexity)
- [ ] MFA/2FA for sensitive operations
- [ ] Account lockout after failed attempts (5-10)
- [ ] Secure password reset (token expiration)
- [ ] Default credentials removed/disabled
- [ ] API keys not in code/version control
- [ ] Session tokens cryptographically generated
- [ ] Logout invalidates session/token

## API Security

- [ ] HTTPS/TLS enforced for all endpoints
- [ ] API versioning strategy in place
- [ ] Rate limiting implemented
- [ ] Auth required (API key or OAuth token)
- [ ] Input validation on all parameters
- [ ] Output encoding/sanitization
- [ ] CORS headers properly configured
- [ ] Pagination limits prevent enumeration
- [ ] Proper HTTP status codes (401 vs 403)
- [ ] Error messages don't expose internals

## Session Management

- [ ] Session IDs cryptographically random
- [ ] Cookies: HttpOnly, Secure, SameSite flags
- [ ] Session timeout (idle + absolute)
- [ ] Session invalidation on logout
- [ ] Session fixation protection (regenerate on login)
- [ ] CSRF tokens for state-changing ops
- [ ] Session data server-side (not in cookies)

## Input Validation

- [ ] Whitelist validation (allow only expected)
- [ ] Type validation (string, number, date)
- [ ] Length validation (min/max)
- [ ] Format validation (regex for email, URL)
- [ ] SQL parameters use prepared statements
- [ ] NoSQL queries use safe APIs
- [ ] Command execution avoided/validated
- [ ] XML external entities disabled (XXE)
- [ ] JSON parsing safe (no eval)
- [ ] ReDoS-safe regex patterns

## Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- [ ] CSP configured (restrict resource loading)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options (DENY or SAMEORIGIN)
- [ ] HSTS enabled with appropriate max-age
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy set
- [ ] Server/X-Powered-By headers removed
- [ ] CORS: No wildcard on credentialed endpoints

## Verify Headers

```bash
# Check security headers
curl -I https://example.com

# Use securityheaders.com
# Use observatory.mozilla.org
```
