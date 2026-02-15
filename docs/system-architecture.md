# System Architecture

**Last Updated**: 2026-02-14
**Version**: 1.2.1
**Scope**: Production deployment architecture, data flows, real-time collaboration

## High-Level System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│              (Web App, Admin, Space, Desktop)                   │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS (80/443)
                       ▼
        ┌──────────────────────────────────┐
        │  Caddy Reverse Proxy (port 80)   │
        │  - TLS/HTTPS termination         │
        │  - Request routing               │
        │  - Load balancing (health checks)│
        └──┬──────────┬──────────┬─────────┘
           │          │          │
      ┌────▼──┐  ┌────▼────┐ ┌──▼────┐
      │Web    │  │Space    │ │Admin   │
      │3000   │  │3000     │ │3000    │
      └───────┘  └─────────┘ └────────┘
           │          │          │
           └──────────┴──────────┘
                      │
              ┌───────▼────────┐
              │API (8000)      │
              │Django + DRF    │
              │Gunicorn        │
              └────┬────────┬──┘
                   │        │
        ┌──────────▼──┐  ┌──▼──────────┐
        │ PostgreSQL  │  │   Redis     │
        │ (5432)      │  │  (6379)     │
        │ Users,      │  │ Cache,      │
        │ Workspaces, │  │ Sessions,   │
        │ Issues, etc │  │ Celery      │
        └─────────────┘  └─────────────┘
                │
        ┌───────▼──────────┐
        │   RabbitMQ       │
        │  (5672)          │
        │  Message Broker  │
        └────┬──────┬──────┘
             │      │
        ┌────▼──┐ ┌─▼─────┐
        │Worker │ │Beat    │
        │Celery │ │Celery  │
        │Tasks  │ │Scheduler
        └───────┘ └────────┘
                │
        ┌───────▼──────────┐
        │   MinIO (S3)     │
        │  (9000)          │
        │  File Storage    │
        └──────────────────┘

Plus Real-time Layer:
        ┌──────────────────────────┐
        │Live Server (3000)        │
        │Express.js + Hocuspocus   │
        │WebSocket/CRDT            │
        └──────────────────────────┘
```

## Request Lifecycle

### 1. HTTP Request Flow (Client → API)

```
1. Browser makes HTTP request
   ↓
2. Caddy Proxy (reverse proxy)
   - Routes based on path
   - Terminates TLS
   - Adds security headers
   ↓
3. Django Application
   - Middleware pipeline:
     a) CorsMiddleware - CORS validation
     b) SecurityMiddleware - Security headers
     c) SessionMiddleware - Session setup
     d) AuthenticationMiddleware - User detection
     e) Custom: APITokenLogMiddleware - API token logging
     f) Custom: RequestLoggerMiddleware - Request logging
   ↓
4. URL Router
   - Matches route pattern
   - Dispatches to ViewSet
   ↓
5. ViewSet/View
   - Permission checks (has access?)
   - Data fetching (ORM queries)
   - Serialization (to JSON)
   ↓
6. Response
   - JSON serialized response
   - Cache headers (if applicable)
   - Back through middleware
   ↓
7. Caddy Proxy
   - Compression (gzip)
   - Response headers
   ↓
8. Browser receives response
```

### 2. Real-Time Collaboration Flow (WebSocket)

```
1. Browser connects to /live WebSocket
   ↓
2. Live Server (Express.js + Hocuspocus)
   - Establishes WebSocket connection
   - Creates Y.js document for document ID
   ↓
3. Client sends CRDT updates
   ↓
4. Hocuspocus receives update
   - Applies to Y.js document state
   - Persists to database
   - Broadcasts to other clients via Redis pub-sub
   ↓
5. Other connected clients receive update
   ↓
6. Client-side editor applies update
   - Y.js CRDT merge algorithm
   - No conflicts (CRDTs handle merging)
   ↓
7. Browser renders updated content
```

### 3. Background Task Flow (Async)

```
1. API endpoint receives request
   - Task needs to run async
   ↓
2. Enqueue Celery task
   - Store in RabbitMQ queue
   ↓
3. Worker picks up from queue
   - Executes task logic
   - Database operations
   - External API calls
   - Email sending
   ↓
4. Task completes/fails
   - Result stored in Redis
   ↓
5. Client polls or receives websocket update
   - Result available
```

## Component Architecture

### Frontend Architecture (Web App)

```
┌─────────────────────────────────────────────────────┐
│             React Router v7 (SPA)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Page Components (app/routes)                 │   │
│  │ - WorkspaceHome, ProjectBoard, IssueDetail   │   │
│  │ - AnalyticsDashboard (list & detail)         │   │
│  │ - Dashboard list & widget detail pages       │   │
│  └──────┬───────────────────────────────────────┘   │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐   │
│  │ Core Components (core/components/)          │   │
│  │ - Reusable UI components                    │   │
│  │ - Page-specific sub-components              │   │
│  └──────┬───────────────────────────────────────┘   │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐   │
│  │ State Management (MobX)                     │   │
│  │ ┌────────────────────────────────────────┐  │   │
│  │ │ Root Store                             │  │   │
│  │ ├─ user.store.ts (auth, profile)              │  │   │
│  │ ├─ workspace.store.ts (workspace data)        │  │   │
│  │ ├─ project.store.ts (project list)            │  │   │
│  │ ├─ issue.store.ts (issue list)                │  │   │
│  │ ├─ issue-detail.store.ts (single issue)       │  │   │
│  │ ├─ cycle.store.ts (sprints)                   │  │   │
│  │ ├─ module.store.ts (modules)                  │  │   │
│  │ ├─ analytics-dashboard.store.ts (dashboards)  │  │   │
│  │ ├─ theme.store.ts (dark/light mode)           │  │   │
│  │ └─ [27 more stores...]                        │  │   │
│  │ └────────────────────────────────────────┘  │   │
│  └──────┬───────────────────────────────────────┘   │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐   │
│  │ Hooks Layer (core/hooks/)                   │   │
│  │ - useStore() → access stores                │   │
│  │ - Custom hooks for common patterns          │   │
│  └──────┬───────────────────────────────────────┘   │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐   │
│  │ Services Layer (core/services/)               │   │
│  │ - API calls via axios                         │   │
│  │ - workspaceService.getAll()                   │   │
│  │ - issueService.create(payload)                │   │
│  │ - analyticsDashboardService (CRUD + widgets)  │   │
│  │ - Domain-specific API wrappers                │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Backend Architecture (Django API)

```
┌──────────────────────────────────────────────────────┐
│        Django REST Framework (DRF)                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ URL Routing (plane/urls.py + plane/app/urls/) │  │
│  │ - /api/v0/ → legacy endpoints                 │  │
│  │ - /api/v1/ → new endpoints                    │  │
│  │ - /auth/ → authentication                     │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │ Middleware Pipeline (custom + Django default)│  │
│  │ - Authentication (user from session/token)    │  │
│  │ - Logging (RequestLoggerMiddleware)           │  │
│  │ - Rate limiting (throttle checks)             │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │ ViewSets (plane/app/views/)                   │  │
│  │ - Permission checks (who can access?)         │  │
│  │ - Serialization (ORM → JSON)                  │  │
│  │ - Analytics dashboard CRUD & aggregation      │  │
│  │ - Business logic dispatch                     │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │ Permissions (plane/app/permissions/)          │  │
│  │ - WorkspaceMemberPermission                   │  │
│  │ - ProjectMemberPermission                     │  │
│  │ - ResourceOwnerPermission                     │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │ ORM Operations (plane/db/models/)             │  │
│  │ - select_related() for JOINs                  │  │
│  │ - prefetch_related() for reverse relations    │  │
│  │ - Bulk operations for performance             │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│               ├─────────────────────┐               │
│               ▼                     ▼               │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │   PostgreSQL     │  │   Task Queue         │   │
│  │   (Primary DB)   │  │   (RabbitMQ + Celery)│   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Data Model Overview

### Core Entity Relationships

```
User
├── owns → Workspace (1:N)
│   ├── WorkspaceMember (1:N) → User
│   ├── Project (1:N)
│   │   ├── ProjectMember (1:N) → User
│   │   ├── Issue (1:N)
│   │   │   ├── IssueAssignee → User (M:N)
│   │   │   ├── IssueLabel → Label (M:N)
│   │   │   ├── IssueCycle → Cycle (1:1 soft)
│   │   │   ├── IssueModule → Module (1:1 soft)
│   │   │   ├── IssueComment (1:N)
│   │   │   ├── IssueLink (1:N)
│   │   │   └── IssueActivity (1:N)
│   │   ├── Cycle (1:N)
│   │   │   └── CycleIssue → Issue (M:N)
│   │   ├── Module (1:N)
│   │   │   └── ModuleIssue → Issue (M:N)
│   │   ├── Page (1:N)
│   │   │   └── PageVersion (1:N)
│   │   ├── State (1:N) - e.g., "To Do", "In Progress"
│   │   ├── Label (1:N)
│   │   ├── AnalyticsDashboard (1:N) - Pro feature
│   │   │   └── AnalyticsDashboardWidget (1:N)
│   │   │       └── Widget config (charts, filters)
│   │   └── IssueView (saved filters)
│   └── Notifications → Notification
└── Analytics data aggregation (via build_analytics_chart())
```

### Database Choice Rationale

**PostgreSQL 15.7 (Primary)**:
- ACID compliance for transactional data
- Complex queries (JOINs, window functions)
- Full-text search capabilities
- JSON data type for flexible fields
- 31 models covering entire domain

**MongoDB 4.6 (Secondary)**:
- API activity logs (high volume, write-heavy)
- Flexible schema for analytics
- Time-series data storage
- Sharding for large-scale logging

## Authentication & Authorization

### Authentication Methods

```
Request
  ├─ Session Cookie
  │  └─ Redis-backed session store
  ├─ Bearer Token (JWT)
  │  └─ API token for external apps
  ├─ OAuth (Google/GitHub/GitLab/Gitea)
  │  └─ OAuth adapter → session
  └─ Magic Link
     └─ Email token → session
```

### Authorization (RBAC)

**Workspace Roles**:
- Owner - Full control
- Admin - Manage members, projects
- Member - Create/edit issues
- Guest - Read-only access

**Project Roles**:
- Owner - Full control
- Admin - Manage members
- Member - Create/edit issues
- Guest - Read-only

**Implementation**: Permission classes in DRF check:
1. Is user workspace member?
2. Does user have required role?
3. Can user access resource?

## Scalability Patterns

### Horizontal Scaling

**Stateless Components** (scale via replicas):

| Component | Role | Replicas | Health Check |
|-----------|------|----------|--------------|
| Web (3000) | Frontend SPA | WEB_REPLICAS | HTTP 200 on / |
| Admin (3000) | Admin SPA | ADMIN_REPLICAS | HTTP 200 on / |
| Space (3000) | Public portal | SPACE_REPLICAS | HTTP 200 on / |
| Live (3000) | WebSocket | LIVE_REPLICAS | HTTP 200 on /health |
| API (8000) | REST server | API_REPLICAS | HTTP 200 on /health |
| Worker | Celery tasks | WORKER_REPLICAS | (managed by Celery) |

**Configuration** (docker-compose.yml):
```yaml
services:
  api:
    deploy:
      replicas: ${API_REPLICAS:-1}
```

### Caching Strategy

**Layer 1 - Browser Cache**:
- Static assets (CSS, JS) with cache headers
- Service Worker for offline support

**Layer 2 - CDN Cache** (optional):
- Static files cached at edge
- Configurable TTL

**Layer 3 - Redis Cache**:
- Session storage
- Computed results
- Rate limit counters
- Celery task results

**Layer 4 - Database Query Cache**:
- ORM select_related/prefetch_related
- Materialized views (if needed)

### Database Connection Pooling

**PostgreSQL** (via Django):
- Default pool: 5 connections
- Maximum: 1000 (configured)
- Min idle: monitored
- Connection timeout: 5s

**Redis** (via django-redis):
- Connection pool enabled
- Max connections: 50

## Real-Time Collaboration System

### CRDT (Conflict-free Replicated Data Type)

**Technology**: Y.js CRDT + Hocuspocus

**Flow**:
```
User A edits document
  ↓
Y.js generates update (diff)
  ↓
Hocuspocus sends to server
  ↓
Server persists to DB
  ↓
Redis pub-sub broadcasts to other clients
  ↓
User B's Y.js merges update automatically
  ↓
No conflicts, no manual merging needed
```

### Benefits of CRDTs

- **Conflict-free**: Automatic merge of concurrent edits
- **Offline-first**: Works without server connection
- **Scalable**: No central merge authority needed
- **Fast**: Local operations (no waiting for server)

## Monitoring & Observability

### Logging

**Request Logging** (RequestLoggerMiddleware):
- All HTTP requests logged to JSON
- Fields: method, path, status, duration, user_id, ip

**API Token Logging** (APITokenLogMiddleware):
- External API requests tracked
- Fields: token, request body, response, timestamp
- Storage: PostgreSQL + MongoDB

**Application Logging**:
- Django logger at DEBUG level (dev) / WARNING (prod)
- Celery task logging per task
- Error tracking via Sentry (optional)

### Error Tracking

**Optional Integrations**:
- Sentry - Error monitoring & alerting
- Scout APM - Performance monitoring
- PostHog - Product analytics
- OpenTelemetry - Distributed tracing

## Security Architecture

### TLS/HTTPS

- Caddy auto-provisions certificates (Let's Encrypt)
- DNS providers: CloudFlare, DigitalOcean
- ACME challenge support

### Request Validation

- Input validation (Zod schemas)
- Rate limiting (per user/IP)
- CSRF tokens (Django middleware)
- CORS whitelist enforcement

### Data Protection

- Password hashing (Django default: PBKDF2)
- Session encryption (secure cookies)
- API tokens stored as hashes
- HTML sanitization (nh3 library)

## Deployment Architecture

### Docker Compose (Single Server)

```
Services:
├─ web (port 3000)
├─ admin (port 3000)
├─ space (port 3000)
├─ live (port 3000)
├─ api (port 8000)
├─ worker (background)
├─ beat-worker (scheduler)
├─ postgres (port 5432)
├─ redis (port 6379)
├─ rabbitmq (port 5672)
├─ minio (port 9000)
└─ proxy (port 80/443)

Volumes:
├─ pgdata (PostgreSQL persistence)
├─ redisdata (Redis persistence)
├─ uploads (MinIO storage)
└─ logs (application logs)
```

### Kubernetes Deployment

- Helm chart with customizable replicas
- StatefulSets for database/storage
- Deployments for stateless services
- Horizontal Pod Autoscaler (HPA) for scaling

## Performance Optimization

### Frontend

- Code splitting (React.lazy)
- Tree-shaking (ES modules)
- Asset compression (gzip, brotli)
- Image optimization (webp)
- Bundle size: <500KB (gzipped)

### Backend

- Query optimization (select_related, prefetch_related)
- Database indexing on frequently queried fields
- Pagination (default 20 items/page)
- Response compression (gzip)
- API response caching where applicable

### Infrastructure

- Load balancing (Caddy health checks)
- Connection pooling (DB, Redis)
- Async tasks (long-running operations)
- Cache strategy (3-tier caching)

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/system-architecture.md`
**Lines**: ~420
**Status**: Final
