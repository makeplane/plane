## API Security

Beyond the decision-tree in `references/patterns/security-testing.md` and auth-method selection in `references/patterns/auth.md`, here is implementation-level defense guidance — authentication, input validation, and data protection to apply when building the API (rate limiting itself is covered in `references/rate-limiting-implementation.md`).

### Authentication & authorization
- Choose a token strategy (JWT, OAuth 2.0, API keys) per `references/patterns/auth.md`; add role-based access control (RBAC) and, for sensitive operations, MFA.
- Short-lived access tokens (about 1 hour) plus a revocable refresh token stored server-side — don't rely on JWT expiry alone for revocation.
- Verify authorization per-request, not just authentication — check the resource belongs to the requester, not only that they're logged in (the OWASP #1: Broken Object Level Authorization).

### Input validation & injection prevention
- Validate every input against a schema (e.g., Zod) before touching business logic; prefer allowlists over blocklists.
- Always use parameterized queries or an ORM — never string-concatenate user input into a query.
- Sanitize any HTML/rich-text input before storage or render (e.g., DOMPurify with an explicit allowed-tags list) to prevent stored XSS.

### Data protection
- HTTPS/TLS everywhere; encrypt sensitive fields at rest.
- Never put sensitive data in a JWT payload — it's signed, not encrypted.
- Sanitize error responses in production: log full errors server-side, return generic messages to the client (stack traces and ORM constraint errors leak schema details).
- Apply security headers (CSP, HSTS, frame-deny, no-sniff — e.g., via Helmet.js) and lock CORS down to trusted origins.

### Common pitfalls
- **Hardcoded/weak JWT secrets** — load from environment, require a strong (256-bit+) random secret, fail startup if absent.
- **Weak password policy** — enforce length + character-class minimums, or a strength scorer (e.g., zxcvbn) rather than a naive regex alone.
- **Authentication without authorization** — a route that checks `authenticateToken` but never verifies the resource owner or role is still exploitable.

### OWASP API Security Top 10 (reference checklist)
Broken Object Level Authorization · Broken Authentication · Broken Object Property Level Authorization · Unrestricted Resource Consumption · Broken Function Level Authorization · Unrestricted Access to Sensitive Business Flows · SSRF · Security Misconfiguration · Improper Inventory Management · Unsafe Consumption of APIs.
