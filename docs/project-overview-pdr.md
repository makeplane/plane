# Plane.so - Project Overview & Product Development Requirements

**Version**: 1.2.0
**License**: AGPL-3.0
**Type**: Open-source project management platform
**Last Updated**: 2026-02-13

## Vision & Purpose

Plane is a modern, open-source project management tool designed for teams to track issues, run cycles (sprints), and manage product roadmaps without the friction of managing the tool itself. It prioritizes simplicity, flexibility, and collaboration while providing self-hosting capabilities for full data control.

## Target Users

1. **Software Development Teams** - Issue tracking, sprint planning, code organization
2. **Product Teams** - Roadmap planning, feature tracking, release cycles
3. **Startups & SMBs** - Affordable, self-hosted project management
4. **Enterprise Organizations** - Compliance, data privacy, on-premise deployment
5. **Open-source Communities** - Cost-effective collaboration platform

## Core Features

### 1. Work Items (Issues)

- Rich-text editor with file uploads
- Issue relationships (blocks, relates, duplicates)
- Assignments, mentions, watchers
- Comments with reactions
- Issue versioning & history tracking
- Sub-issues/task hierarchy

### 2. Cycles (Sprints)

- Time-boxed planning
- Issue assignment to cycles
- Burn-down charts & progress tracking
- Cycle metrics and reporting

### 3. Modules

- Break projects into deliverable components
- Module grouping of issues
- Dependency management

### 4. Views

- Customizable issue filters
- Saved views for team workflows
- Board, list, calendar, spreadsheet, Gantt, timeline views

### 5. Pages

- Wiki-style project documentation
- Rich text editing with Tiptap
- Version history
- AI-assisted content generation

### 6. Analytics

- Real-time dashboards (Pro feature)
- Custom analytics views with multiple chart types
- Trend visualization via charts (line, bar, pie, scatter)
- Dashboard favorites/pinning with unified UserFavorite system
- Multi-dashboard CRUD with widget configuration UI
- Export capabilities

### 7. Collaboration

- Real-time editing via Hocuspocus + Y.js CRDT
- Comment threads
- Activity tracking
- Notifications (in-app & email)
- Mentions & @-references

### 8. Public Sharing

- Public issue views via anchor links
- Public workspace browsing
- Read-only access for stakeholders

### 9. Authentication & Authorization

- OAuth providers (Google, GitHub, GitLab, Gitea)
- Magic link (email-based passwordless auth)
- Password-based authentication
- API tokens for programmatic access
- RBAC with workspace/project roles

### 10. Integrations

- GitHub sync (repos, issues, comments)
- Slack notifications
- Custom webhooks
- Intake board for external submissions

## Architecture Overview

### Monorepo Structure

- **Apps**: web, admin, space, live, api, proxy
- **Packages**: @plane/types, @plane/constants, @plane/utils, @plane/services, @plane/hooks, @plane/propel (UI), @plane/editor, @plane/i18n, and others
- **Build**: pnpm + Turborepo

### Tech Stack

**Frontend**:

- React 18, React Router v7
- MobX for state management
- Vite + TypeScript
- Tailwind CSS v4
- Hocuspocus + Y.js for real-time collaboration

**Backend**:

- Django 4.2 + DRF
- PostgreSQL 15.7 (primary DB)
- MongoDB 4.6 (API logs)
- Celery + RabbitMQ (async tasks)
- Redis/Valkey (cache & sessions)
- Channels (WebSocket support)

**Infrastructure**:

- MinIO (S3-compatible storage)
- Caddy (reverse proxy, auto-HTTPS)
- Docker (containerization)
- Multiple deployment options (Compose, Swarm, Kubernetes)

## Product Development Requirements (PDR)

### Functional Requirements

| Requirement               | Priority | Status  | Details                                                       |
| ------------------------- | -------- | ------- | ------------------------------------------------------------- |
| Multi-workspace support   | Critical | Shipped | Users can create/manage multiple workspaces                   |
| Role-based access control | Critical | Shipped | Workspace & project-level roles (Owner, Admin, Member, Guest) |
| Issue full lifecycle      | Critical | Shipped | Create, update, assign, comment, close, archive               |
| Real-time collaboration   | High     | Shipped | WebSocket-based simultaneous editing                          |
| Public sharing            | High     | Shipped | Share issues/workspaces publicly via links                    |
| Analytics & reporting     | High     | Shipped | Dashboard views, trend charts, burn-down tracking             |
| OAuth authentication      | High     | Shipped | Google, GitHub, GitLab, Gitea providers                       |
| File uploads              | Medium   | Shipped | Attach files to issues, store in S3/MinIO                     |
| API access                | Medium   | Shipped | REST API v1 with token-based auth                             |
| Self-hosting              | Critical | Shipped | Docker/Kubernetes deployment options                          |

### Non-Functional Requirements

| Requirement         | Target                | Details                                                         |
| ------------------- | --------------------- | --------------------------------------------------------------- |
| **Scalability**     | Horizontal            | Stateless services, Redis cache, DB connection pooling          |
| **Performance**     | <2s avg response      | Pagination, caching, optimized queries                          |
| **Availability**    | 99.5% uptime          | Health checks, graceful degradation, no single point of failure |
| **Security**        | SOC2 Ready            | RBAC, encryption, rate limiting, audit logs                     |
| **Data Privacy**    | GDPR Compliant        | Data sovereignty, self-hosting, encryption at rest              |
| **Maintainability** | TypeScript throughout | 200 LOC file limit, modular architecture, comprehensive testing |

### Success Metrics

1. **User Adoption**: 10K+ self-hosted deployments by 2026-Q3
2. **API Usage**: 1M+ API requests/day from integrations
3. **Collaboration**: 80%+ of issues have comments/activity within 7 days
4. **Performance**: 95th percentile response time <1s
5. **Uptime**: 99.9% SLA compliance
6. **Community**: 500+ contributors, 50K+ GitHub stars

## Deployment Models

1. **Plane Cloud** - SaaS multi-tenant (managed)
2. **Docker Compose** - Single server, ideal for teams <100
3. **Docker Swarm** - Cluster deployment with load balancing
4. **Kubernetes** - Cloud-native with Helm charts
5. **All-in-One** - Single container with all services (demo/PoC)

## Key Constraints & Dependencies

**Constraints**:

- AGPL-3.0 license requires source sharing for modifications
- PostgreSQL 15.7+ required (no legacy DB support)
- Real-time features require WebSocket support
- File uploads limited to 5MB per request (configurable)

**External Dependencies**:

- OAuth providers (Google, GitHub, GitLab, Gitea)
- Email service for notifications (SMTP)
- S3-compatible storage (MinIO or AWS S3)
- Message broker (RabbitMQ 3.13.6+)

## Roadmap & Priorities

### Current Phase (v1.2.x)

- Stability & performance optimization
- Community Edition feature parity
- Enhanced analytics
- Mobile app improvements

### Near-term (v1.3-v1.4)

- Advanced automation rules
- Custom fields & workflows
- Improved import/export tools
- Better integration ecosystem

### Future (v2.0)

- AI-powered issue summarization
- Predictive analytics
- Advanced resource planning
- Mobile-first redesign

## Repository Structure

```
plane.so/
├── apps/
│   ├── web/              React SPA main dashboard
│   ├── admin/            Instance admin panel
│   ├── space/            Public sharing portal (SSR)
│   ├── live/             Real-time collab server
│   ├── api/              Django REST API
│   └── proxy/            Caddy reverse proxy
├── packages/             Shared utilities & types
├── docs/                 Developer documentation
├── deployments/          Deployment configurations
├── CONTRIBUTING.md       Contribution guidelines
└── README.md             Getting started
```

## Getting Started

**For Users**: [Plane Cloud](https://app.plane.so) or [Self-hosted Deployment](https://developers.plane.so/self-hosting)

**For Developers**: See [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/deployment-guide.md](./deployment-guide.md)

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/project-overview-pdr.md`
**Lines**: ~320
**Status**: Final
