<!--
  Sync Impact Report:
  Version change: 1.1.0 → 1.1.1 (removed .cursorrules reference, file deleted)
  Modified principles: None
  Added sections: None
  Removed sections: None
  Templates requiring updates:
    ✅ plan-template.md - No changes needed
    ✅ spec-template.md - No changes needed
    ✅ tasks-template.md - No changes needed
  Files removed: .cursorrules (superseded by constitution.md)
  Follow-up TODOs: None
-->

# Plane Constitution

## Core Principles

### I. Type Safety First

TypeScript strict mode is mandatory. No `any` types unless absolutely necessary and explicitly justified. All functions MUST have explicit return types. Type safety violations must be resolved before merging. Rationale: Prevents runtime errors, improves developer experience, enables better IDE support and refactoring safety.

### II. Monorepo Architecture

The project follows a Turborepo monorepo structure with pnpm workspaces. Apps are organized in `apps/` directory (web, space, admin, live, api) and shared packages in `packages/`. All workspace dependencies MUST use `workspace:*` syntax for internal packages and `catalog:` for shared external dependencies. Rationale: Enables code sharing, consistent versioning, and efficient builds across the entire codebase.

### III. Component-Based Development

React components MUST be functional components using hooks. Class components are prohibited. Components MUST be exported as named exports with PascalCase naming. File names MUST use kebab-case (`component-name.tsx`). Components consuming MobX observables MUST use the `observer` HOC. Component structure MUST follow the established pattern: imports (React → third-party → local), types, component definition, displayName. Rationale: Ensures consistency, improves maintainability, and follows React best practices.

### IV. State Management Discipline

Global state MUST use MobX stores located in `store/` directories. Component-local state should be preferred when possible. Stores MUST be accessed via custom hooks (`use-*.tsx`). All state modifications MUST go through MobX actions to ensure reactivity and debugging. Rationale: Provides predictable state management, enables efficient reactivity, and maintains clear data flow patterns.

### V. API Design Standards

Backend APIs MUST follow RESTful conventions using Django REST Framework. ViewSets and Serializers MUST be used for all endpoints. Proper HTTP status codes (200, 201, 400, 404, etc.) MUST be used. List endpoints MUST implement pagination. Filtering, searching, and ordering MUST be supported where applicable. Breaking changes MUST be versioned. Rationale: Ensures consistent, predictable API behavior and maintainability across the codebase.

### VI. Database Optimization

The database MUST be Supabase. Django ORM MUST be used for all database queries. Queries MUST use `select_related` and `prefetch_related` to prevent N+1 problems. Frequently queried fields MUST be indexed. Multi-step operations MUST use database transactions. Migrations MUST be kept small and reversible. Supabase-specific features (realtime subscriptions, Row Level Security, etc.) SHOULD be leveraged where appropriate, but MUST follow the same ORM and transaction patterns. Rationale: Supabase provides scalable PostgreSQL infrastructure with enhanced features while maintaining compatibility with Django ORM best practices. Prevents performance degradation, ensures data consistency, and maintains database maintainability.

### VII. Testing Requirements

Unit tests MUST be written for business logic. Integration tests MUST be written for API endpoints. E2E tests MUST be written for critical user flows. Test files MUST be colocated with source files using `*.test.ts`, `*.test.tsx`, or `test_*.py` naming. Minimum coverage thresholds MUST be enforced in CI. Tests MUST be written alongside features, not as afterthoughts. Rationale: Ensures code quality, prevents regressions, and maintains confidence during refactoring.

### VIII. Security First

Sensitive data (passwords, tokens, API keys) MUST NEVER be logged. All user inputs MUST be validated and sanitized. SQL injection MUST be prevented using parameterized queries (Django ORM handles this). Proper authentication and authorization MUST be implemented for all protected resources. OWASP guidelines MUST be followed for web security. Rationale: Protects user data and system integrity from common vulnerabilities.

### IX. Code Style Consistency

TypeScript/React files MUST follow: functional components, named exports, kebab-case files, PascalCase components, explicit return types. Python/Django files MUST follow PEP 8: snake_case files, PascalCase classes, snake_case functions/variables, type hints for function signatures, docstrings for classes and public methods. Code MUST be formatted with Prettier (frontend) and Ruff (backend). Linting MUST pass before merge. Rationale: Ensures readability, maintainability, and reduces cognitive load when switching between files.

### X. Performance Standards

Code-splitting MUST be used for routes and heavy components. Images and non-critical assets MUST be lazy loaded. React Suspense MUST be used for async components. Database queries MUST be optimized (N+1 prevention, proper indexing). Caching strategies (Redis, browser cache) MUST be implemented where appropriate. Rationale: Ensures fast user experience and scalable system performance.

### XI. Accessibility Requirements

Semantic HTML elements MUST be used. Alt text MUST be provided for images. Keyboard navigation MUST work throughout the application. Color contrast MUST meet WCAG standards. ARIA labels MUST be used where necessary. Rationale: Ensures the application is usable by all users, including those using assistive technologies.

### XII. Error Handling

Try-catch blocks MUST be used for all async operations. User-friendly error messages MUST be provided. Errors MUST be logged with appropriate context. Error boundaries MUST be used for React component errors. Rationale: Provides better user experience and enables effective debugging and monitoring.

### XIII. Deployment Platform

Applications MUST be deployed to Railway. All deployment configurations MUST be version-controlled and documented. Environment-specific settings (dev, staging, production) MUST be managed through Railway's environment variable system. Deployment processes MUST be automated and reproducible. Railway-specific features (auto-deploy, preview environments, etc.) SHOULD be leveraged where appropriate. Rationale: Railway provides a consistent, scalable deployment platform with integrated infrastructure management, reducing deployment complexity and ensuring reliable application hosting.

## Development Workflow

### Git Workflow

Branch naming MUST follow: `feature/description`, `fix/description`, `chore/description`. Commit messages MUST follow Conventional Commits format. Pull requests MUST pass all CI checks (lint, type-check, tests) before merge. PR templates from `.github/` MUST be used.

### Environment Configuration

Environment variables MUST use `.env.example` files as templates. `.env` files MUST NEVER be committed. Frontend environment variables MUST be prefixed with `VITE_`. All required environment variables MUST be documented. Different configurations MUST be used for dev/staging/prod environments.

### Dependency Management

Before adding dependencies: check package size and maintenance status, prefer packages with TypeScript support, evaluate alternatives, update lock files after changes, document why the dependency is needed. Internal packages MUST use `workspace:*`. Shared external dependencies MUST use `catalog:` entries in `pnpm-workspace.yaml`.

## Governance

This constitution supersedes all other practices and coding guidelines. All PRs and reviews MUST verify compliance with these principles. Any violations of MUST principles require explicit justification and approval. Complexity additions must be justified with documented rationale.

Amendments to this constitution require:
1. Documentation of the change rationale
2. Approval from project maintainers
3. Update to version number following semantic versioning (MAJOR for backward-incompatible changes, MINOR for new principles, PATCH for clarifications)
4. Propagation of changes to all relevant templates and documentation

This constitution serves as the single source of truth for all development standards and practices. All implementation details and conventions are established within this document.

**Version**: 1.1.1 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-12-12
