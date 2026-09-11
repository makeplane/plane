---
name: api-design
description: "Master REST, GraphQL, and tRPC API design: choose the right style, model resources cleanly, define errors/versioning/pagination/auth, and generate developer-friendly documentation (OpenAPI/Swagger)."
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# API Design

Design intuitive, scalable, and maintainable APIs — REST, GraphQL, or tRPC — and document them so consumers can actually use them.

## Use this skill when

- Designing new REST, GraphQL, or tRPC APIs
- Choosing between API styles for a given consumer/use case
- Refactoring existing APIs for better usability
- Establishing API design standards for your team
- Reviewing API specifications before implementation
- Generating or updating API documentation (OpenAPI/Swagger, Postman)

## Do not use this skill when

- You only need implementation guidance for a specific framework
- You are doing infrastructure-only work without API contracts
- You cannot change or version public interfaces

## Instructions

1. Define consumers, use cases, and constraints. Use `references/patterns/api-style.md` to choose REST vs GraphQL vs tRPC vs WebSocket/gRPC.
2. Model resources or types per the chosen style — see `references/patterns/rest.md` or `references/patterns/graphql.md` (or `references/patterns/trpc.md` for TS monorepos).
3. Specify response format (`references/patterns/response.md`), errors, versioning (`references/patterns/versioning.md`), pagination, and auth strategy (`references/patterns/auth.md`).
4. Plan rate limiting (`references/patterns/rate-limiting.md`) and run a security pass (`references/patterns/security-testing.md`, OWASP API Top 10). For implementation-level depth on either, see `references/rate-limiting-implementation.md` and `references/api-security-implementation.md`.
5. Validate with examples; walk `assets/api-design-checklist.md` before implementation.
6. Document the result — see Documentation section below. For backend/frontend contract handoff docs, see `references/api-contracts-handoff.md`.

Refer to `references/implementation-playbook.md` for detailed patterns, checklists, and code samples (REST + GraphQL, pagination, error handling, HATEOAS, DataLoader).

## Patterns (quick-reference decision guides)

| File | Use for |
|------|---------|
| `references/patterns/api-style.md` | REST vs GraphQL vs tRPC decision tree |
| `references/patterns/rest.md` | Resource naming, HTTP methods, status codes |
| `references/patterns/graphql.md` | Schema design, when to use, security |
| `references/patterns/trpc.md` | TypeScript monorepo, end-to-end type safety |
| `references/patterns/response.md` | Envelope pattern, error format, pagination types |
| `references/patterns/versioning.md` | URI/header/query versioning strategy |
| `references/patterns/auth.md` | JWT, OAuth, API keys, Passkey selection |
| `references/patterns/rate-limiting.md` | Token bucket, sliding window, response headers |
| `references/patterns/security-testing.md` | OWASP API Top 10, auth/authz test approach |

For production rate-limiting implementation (algorithms, distributed/Redis, response headers), see `references/rate-limiting-implementation.md`.

For implementation-level API security guidance (auth/authz, input validation, data protection, common pitfalls), see `references/api-security-implementation.md`.

## Documentation

Generate comprehensive, developer-friendly API documentation from the finished design or an existing codebase: endpoint descriptions, request/response examples (cURL, JS, Python), auth setup, error catalogs, and OpenAPI/Swagger specs.

- Full generator workflow, examples, and pitfalls: `references/api-documentation-generator.md`
- Documentation checklist is also embedded in `assets/api-design-checklist.md`
- For backend↔frontend contract handoff documentation (API handoff docs, backend-requirements docs), see `references/api-contracts-handoff.md`

## Resources

- `references/implementation-playbook.md` — detailed REST/GraphQL patterns, checklists, templates
- `references/rest-best-practices.md` — comprehensive REST guide
- `references/graphql-schema-design.md` — GraphQL schema patterns and anti-patterns
- `references/api-documentation-generator.md` — full documentation-generation workflow
- `references/patterns/` — 9 quick-reference decision guides (api-style, rest, graphql, trpc, response, versioning, auth, rate-limiting, security-testing)
- `references/rate-limiting-implementation.md` — production rate-limiting implementation guidance
- `references/api-security-implementation.md` — implementation-level API security guidance
- `references/api-contracts-handoff.md` — backend↔frontend API contract/handoff documentation
- `assets/api-design-checklist.md` — pre-implementation review checklist (REST + GraphQL)
- `assets/rest-api-template.py` — FastAPI REST API template (pagination, filtering, error handling)
- `scripts/api_validator.py` — validates API code/OpenAPI specs for common issues: `python scripts/api_validator.py <project_path>`
