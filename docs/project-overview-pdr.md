# Plane: Project Overview & Product Development Requirements

## Executive Summary

**Plane** is an open-source project management platform forked from `makeplane/plane` and customized by Shinhan Bank. It provides workspace-level collaboration, issue tracking, sprint management, and customizable workflows with real-time collaboration capabilities.

**Origin:** Fork of `github.com/makeplane/plane`
**Repository:** `github.com/shbvn/plane.git`
**Tech Stack:** React 18 + Router v7 + MobX | Django 4.2 + DRF + PostgreSQL + Celery
**Primary Deployment:** Docker-based (Caddy reverse proxy + multi-app architecture)
**Current Date:** 2026-04-02

## Core Capabilities

### Issue Management

- Multi-layout issue views: List, Kanban, Gantt, Calendar, Spreadsheet
- Hierarchical organization: Workspace → Project → Issue
- Issue states, labels, priorities, assignees, dates
- Soft-delete support for data safety

### Sprint Management (Cycles)

- Named iterations with start/end dates
- Issue-to-cycle associations
- Sprint analytics and burndown

### Feature Planning (Modules)

- Modules for feature/epic grouping
- Issue-to-module relationships
- Module-level progress tracking

### Custom Workflows (CE)

- Workflow state transitions with validation
- Workflow blockers for approval workflows
- Error handling for blocked transitions (unhandled rejection)
- Workflow rule editing per project

### Real-Time Collaboration

- WebSocket support (apps/live, Hocuspocus + Y.js CRDT)
- Shared document editing (Page edits, Issue field updates)
- Real-time cursor positions (planned)

### Wiki/Pages

- Static page creation within projects
- Markdown-based content with Y.js real-time sync

### Time Tracking (CE)

- Time estimates and logged hours per issue
- Time analytics and burndown tracking
- Timesheet reports (weekly, monthly)
- Team capacity planning

### Organization Chart (HO - CE)

- Bank department hierarchy visualization
- Multi-level employee management
- Column-specific sorting and multi-select filtering
- Drill-down analytics by team/role
- Org chart export (PDF, PNG)

### Analytics Dashboard (CE)

- Sprint burndown charts and velocity tracking
- Project metrics and team productivity
- Custom report builder
- Scheduled report delivery (email)
- Export to PDF/Excel

### Admin Features (CE)

- Task category management
- Monitoring dashboard (system health, metrics)
- Staff management
- Bank-wide project visibility (cross-team)

## Product Development Requirements (PDR)

### Functional Requirements (In Scope)

#### 1. Workspace Management

- **Req:** Multi-workspace support per user
- **Req:** Workspace members with ROLE.ADMIN/MEMBER/GUEST permissions
- **Req:** Workspace slug-based routing
- **Acceptance:** Users can create, invite, and manage workspace members

#### 2. Project Management

- **Req:** Projects within workspaces with state (active/archived)
- **Req:** Issue hierarchies: parent/child tasks
- **Req:** Soft-delete support with `deleted_at` tracking
- **Acceptance:** Projects support CRUD with proper role-based access control

#### 3. Issue Lifecycle

- **Req:** States (Backlog, Todo, In Progress, Done, etc.)
- **Req:** Custom state workflow per project
- **Req:** Issue transitions validated via workflow rules (Shinhan)
- **Req:** Blocked transitions raise `WORKFLOW_TRANSITION_BLOCKED` errors
- **Acceptance:** State transitions respect workflow rules; blockers are caught via unhandled rejection handler

#### 4. Multi-Layout Issue Views

- **Req:** List, Kanban, Gantt, Calendar, Spreadsheet layouts
- **Req:** Single MobX store, multiple UI renderers
- **Req:** Kanban drag-and-drop with workflow state validation
- **Acceptance:** All layouts sync with store; DnD respects workflow rules

#### 5. Cycle & Module Associations

- **Req:** Issues assigned to cycles (sprints) and modules (features)
- **Req:** Bulk actions (assign cycles, add to module)
- **Acceptance:** UI reflects associations; queries correctly filter by cycle/module

#### 6. Real-Time Collaboration

- **Req:** WebSocket server for live editing (apps/live)
- **Req:** Y.js CRDT for conflict-free edits
- **Req:** Shared document state across clients
- **Acceptance:** Multiple users editing same page/issue concurrently with no conflicts

#### 7. API Versioning

- **Req:** V0 API (session auth, internal)
- **Req:** V1 API (API key auth, external, OpenAPI)
- **Acceptance:** V0 used by web UI; V1 documented and available to external integrations

#### 8. CE Customizations (Shinhan)

- **Req:** Workflows with blockers and transition validation
- **Req:** Time tracking (estimates, logged hours)
- **Req:** Organization chart (HO) with column sorting/filtering
- **Acceptance:** All CE features toggle via env flags; core code unmodified

### Non-Functional Requirements

#### Performance

- **Req:** Sub-second response for issue list queries
- **Req:** Kanban column rendering < 1s (Atlaskit pragmatic DnD)
- **Req:** Concurrent WebSocket connections: 10k+ users
- **Acceptance:** Load tests pass; no N+1 queries in ORM

#### Scalability

- **Req:** Horizontal scaling via Celery task queue
- **Req:** Redis caching for frequently accessed data
- **Req:** Multi-read-replica support (middleware routes reads)
- **Acceptance:** 100+ concurrent users per workspace

#### Security

- **Req:** Role-based access control (RBAC) at workspace/project levels
- **Req:** API key authentication with scoping
- **Req:** CORS whitelisting
- **Req:** Rate limiting via middleware
- **Acceptance:** Unauthenticated requests denied; cross-origin requests validated

#### Availability

- **Req:** Graceful degradation if Redis unavailable
- **Req:** Database connection pooling
- **Req:** S3 fallback for file uploads
- **Acceptance:** Service remains operational during partial outages

#### Maintainability

- **Req:** <200 LOC per code file (modular design)
- **Req:** <150 LOC per React component
- **Req:** Kebab-case file naming with descriptive names
- **Req:** YAGNI/KISS/DRY principles
- **Acceptance:** New developers understand codebase structure in <2 hours

### Constraints

#### Technology

- **Django 4.2** with DRF (no migration to newer versions without planning)
- **React 18** with Router v7 (no legacy Router usage)
- **MobX** for state management (not Redux)
- **Tailwind v4** with semantic color tokens
- **pnpm 10.24+** (not npm/yarn)
- **Turbo 2.6.3** for monorepo tasks
- **PostgreSQL** (primary DB; soft-deletes for data preservation)

#### Architectural

- **CE Pattern:** New features in `apps/web/ce/` and `apps/api/`; never modify `core/` except hooks/layouts
- **API Pattern:** Separate serializers for v0/v1
- **Store Pattern:** MobX with `makeObservable` and `runInAction` for async
- **Type Export:** All types in `packages/types/src/` as `.ts` files (not `.d.ts`)
- **Service Auth:** @allow_permission decorator for all views

#### Operational

- **Docker-based deployment** with Caddy reverse proxy
- **Multi-app architecture:** web (port 3000), admin (3001), space (3002), live (3003)
- **Celery RabbitMQ broker** (no sync task processing)
- **No force-push to preview/develop** (PR + 1 review required)
- **Branch pattern:** {user}/{type}/{desc} → develop → preview

### Out of Scope

- Self-hosted backend for external users (API v1 only)
- iOS/Android native apps
- AI-powered features
- Advanced reporting beyond current scope
- Custom webhook processors (webhooks sent, not processed)

## Success Metrics

| Metric                             | Target | Measurement            |
| ---------------------------------- | ------ | ---------------------- |
| **Issue list load time**           | <500ms | Performance monitoring |
| **API response time (p95)**        | <200ms | APM (v1 endpoints)     |
| **Test coverage**                  | >80%   | CI/CD pipeline         |
| **Deployment time**                | <10min | Docker build + push    |
| **Uptime**                         | 99.5%  | Monitoring dashboard   |
| **Max concurrent users/workspace** | 100+   | Load test results      |

## Adoption & Release Plan

### Current Phase

- **Phase:** Feature development + CE customization
- **Status:** Workflows, Time Tracking, HO (org chart) complete
- **Next:** Analytics refinement, performance optimization

### Release Channels

- **Preview:** Staging environment (develop branch)
- **Main:** Production (preview branch)
- **Hotfixes:** Cherry-pick to both branches

### Support Model

- **Internal:** Shinhan Bank internal teams
- **External:** Community (optional, downstream of makeplane/plane)

## Dependency Management

### External Services

| Service           | Purpose               | Status                   |
| ----------------- | --------------------- | ------------------------ |
| **PostgreSQL**    | Primary DB            | Required                 |
| **Redis**         | Caching/sessions      | Required                 |
| **RabbitMQ**      | Celery broker         | Required                 |
| **S3-compatible** | File uploads          | Required                 |
| **WebSocket**     | Real-time (apps/live) | Optional but recommended |

### Development Tooling

| Tool        | Version | Purpose            |
| ----------- | ------- | ------------------ |
| **Node.js** | 22.18+  | JavaScript runtime |
| **pnpm**    | 10.24+  | Package manager    |
| **Python**  | 3.11+   | Backend runtime    |
| **Docker**  | Latest  | Containerization   |

## Documentation Structure

- **README.md** (root) — Getting started, setup
- **docs/codebase-summary.md** — File structure & key modules
- **docs/code-standards.md** — Coding conventions & patterns
- **docs/system-architecture.md** — System design & data flow
- **docs/design-guidelines.md** — UI/UX, Tailwind, component libs
- **docs/deployment-guide.md** — Docker, Caddy, env vars
- **docs/project-roadmap.md** — Current development phases

## Key Contacts & Roles

- **Project Lead:** ngocyt001 (ngoc-feat/\*)
- **Tech Leads:** TBD
- **Backend Owner:** apps/api/
- **Frontend Owner:** apps/web/
- **Devops:** Docker/Caddy/Infrastructure

---

**Last Updated:** 2026-04-08
**PDR Version:** 1.1
