# API Review Checklist (Overlay)

Additive to `base.md`. Apply when project exposes REST/GraphQL/gRPC APIs.

## Detection

Apply this overlay when any of these are true:
- Project has route definitions (Express, FastAPI, NestJS, Django, Rails, Go chi/gin)
- OpenAPI/Swagger spec file exists
- `src/routes/`, `src/api/`, `src/controllers/` directories
- GraphQL schema files in the diff

---

## Pass 1 — CRITICAL (additions to base)

### Auth & Rate Limiting
- Public endpoints missing rate limiting (login, registration, password reset)
- API keys or tokens exposed in URL query parameters (use headers)
- Missing auth middleware on new routes
- Batch/bulk endpoints without per-item authorization checks

### Input Validation
- Request body accepted without schema validation (missing Zod, Joi, Pydantic, etc.)
- Mass assignment: entire request body spread into database model
- File upload without size/type restrictions
- Array inputs without length limits (DoS via large payloads)

### Data Exposure
- Sensitive fields in API responses (password hashes, internal IDs, tokens)
- Stack traces or internal error details in production error responses
- Verbose error messages that leak schema/implementation details

---

## Pass 2 — INFORMATIONAL (additions to base)

### API Design
- List endpoints without pagination (LIMIT/OFFSET or cursor-based)
- Missing consistent error response format across endpoints
- Inconsistent naming conventions (camelCase vs snake_case in same API)
- Missing request/response content-type headers

### Observability
- New endpoints without logging/metrics
- Error paths that swallow exceptions silently
- Missing correlation/request IDs for tracing

### Versioning & Compatibility
- Breaking changes to existing response shapes without version bump
- Removed fields without deprecation notice
- Changed field types (string → number) in existing responses
