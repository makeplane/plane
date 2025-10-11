<!-- 
Sync Impact Report:
Version change: 1.0.0 → 1.0.0 (initial constitution)
Modified principles: N/A (initial creation)
Added sections: Core Principles, Technology Standards, Development Workflow
Removed sections: N/A (initial creation)
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: None
-->

# Plane Constitution

## Core Principles

### I. User-First Design
All features MUST prioritize user experience and accessibility. Every component MUST be independently testable from a user perspective. User stories MUST be prioritized by business value and implementable as independent slices that deliver standalone value.

### II. Open Source Commitment  
All contributions MUST maintain the AGPL-3.0 license compatibility. Public APIs and interfaces MUST be designed for community extensibility. Documentation MUST be comprehensive and accessible to external contributors.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. All features or bug fixes MUST be tested by one or more unit tests before merge.

### IV. Monorepo Architecture
Multi-app structure MUST maintain clear boundaries between frontend, backend, and shared packages. Shared packages MUST be independently versioned and testable. Cross-app dependencies MUST be explicit and minimal.

### V. Performance & Scalability
System MUST handle 1000+ concurrent users without degradation. Response times MUST be <200ms for 95th percentile. Memory usage MUST be optimized for 12GB minimum requirements. All database queries MUST be optimized and indexed.

### VI. Security & Privacy
All user data MUST be encrypted in transit and at rest. Authentication MUST use industry-standard protocols. Security vulnerabilities MUST be reported responsibly through security@plane.so. Input validation MUST be implemented at all boundaries.

## Technology Standards

**Frontend**: Next.js with TypeScript, Tailwind CSS, React components
**Backend**: Django with Python 3.8+, PostgreSQL v14, Redis v6.2.7  
**Testing**: Jest, pytest, ESLint with Prettier formatting
**Deployment**: Docker containers, Kubernetes support, self-hosted options
**Performance**: <200ms p95 response time, <100MB memory per service
**Scale**: Support 10k+ users, 1M+ issues, 50+ concurrent projects

## Development Workflow

**Code Quality**: All PRs MUST pass ESLint, Prettier, and unit tests
**Documentation**: Features MUST include user documentation and API docs
**Branch Strategy**: Feature branches MUST follow `###-feature-name` pattern
**Review Process**: All changes MUST be reviewed by maintainers
**Issue Management**: Issues MUST follow naming conventions (🐛 Bug, 🚀 Feature, etc.)

## Governance

Constitution supersedes all other development practices. Amendments require documentation, community discussion, and maintainer approval. All PRs and reviews MUST verify constitution compliance. Complexity additions MUST be justified with measurable benefits.

**Version**: 1.0.0 | **Ratified**: 2024-12-09 | **Last Amended**: 2024-12-09