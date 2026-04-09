# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │  Caddy Reverse Proxy    │
                    │  (apps/proxy)           │
                    └────┬──────┬──────┬──────┘
         ┌──────────────┬─┘      │      └┬──────────────────┐
         │              │        │       │                  │
    ┌────▼───┐  ┌──────▼──┐ ┌───▼───┐ ┌▼────────┐  ┌──────▼──┐
    │ web    │  │  admin  │ │ space │ │ live    │  │ Webhook │
    │ (3000) │  │ (3001)  │ │ (3002)│ │ (3003)  │  │ Handler │
    └─┬──────┘  └────┬────┘ └───┬───┘ └────┬────┘  └─────────┘
      │              │          │          │
      └──────────────┴──────────┴──────────┘
                     │
            ┌────────▼────────┐
            │  Django API     │
            │  (apps/api:8000)│
            │  10-layer stack │
            └────────┬────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   ┌──▼──┐      ┌───▼────┐     ┌──▼──┐
   │ PG  │      │ Redis  │     │ S3  │
   └─────┘      └────┬───┘     └─────┘
           ┌────────────┴──────────┐
           │                       │
       ┌───▼────┐          ┌──────▼─┐
       │ Cache  │          │ Session│
       │ Layers │          │ Store  │
       └────────┘          └────────┘
                     │
            ┌────────▼──────────┐
            │  RabbitMQ Broker  │
            │  (Celery Queue)   │
            └────────┬──────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼─────┐          ┌──────▼──┐
    │  Workers │          │  Beat   │
    │ (Celery) │          │Scheduler│
    └──────────┘          └─────────┘
```

## Frontend Architecture

### React Application Structure (apps/web)

```
apps/web/
├── core/                           # Upstream code (read-only)
│   ├── app/                        # Next.js app router
│   │   ├── layout.tsx              # Root layout
│   │   ├── (auth)/                 # Auth routes (login, signup)
│   │   └── (all)/[workspaceSlug]/  # Main app routes
│   │
│   ├── store/                      # MobX stores (33+)
│   │   ├── root-store.ts           # Root store
│   │   ├── workspace.store.ts      # Workspace root store
│   │   ├── project.store.ts        # Project root store
│   │   ├── issue.store.ts          # Issue root store (multi-layout)
│   │   ├── cycle.store.ts          # Cycle (sprint) store
│   │   ├── module.store.ts         # Module store
│   │   ├── page.store.ts           # Page (wiki) store
│   │   └── [other].store.ts
│   │
│   ├── hooks/                      # Custom hooks (47 total)
│   │   ├── store/                  # Store access hooks
│   │   │   ├── use-workspace.ts
│   │   │   ├── use-project.ts
│   │   │   ├── use-issue.ts
│   │   │   └── use-workflow.ts    # Reads CE store
│   │   ├── use-issue-form.ts
│   │   ├── use-drag-n-drop.ts
│   │   └── [other].ts
│   │
│   ├── services/                   # API clients (30+)
│   │   ├── api-base.ts             # Axios instance
│   │   ├── workspace.service.ts
│   │   ├── issue.service.ts
│   │   └── [other].service.ts
│   │
│   ├── components/                 # Shared components (51 dirs)
│   │   ├── layouts/
│   │   ├── modals/
│   │   ├── form/
│   │   ├── issue-layouts/          # List, Kanban, Gantt, Calendar, Sheet
│   │   └── [other]/
│   │
│   └── context/                    # React context
│       └── store-context.ts        # Provides RootStore
│
├── ce/                             # Shinhan customizations (extend core)
│   ├── store/
│   │   ├── root.store.ts           # Extends CoreRootStore
│   │   ├── workflow.store.ts       # Workflow MobX store
│   │   ├── time-tracking.store.ts  # Time tracking store
│   │   ├── ho.store.ts             # Org chart (HO) store
│   │   ├── analytics.store.ts      # Analytics dashboard store
│   │   ├── task-category.store.ts  # Task categories store
│   │   └── monitoring.store.ts     # Monitoring dashboard store
│   │
│   ├── services/
│   │   ├── workflow.service.ts
│   │   ├── time-tracking.service.ts
│   │   ├── ho.service.ts
│   │   ├── analytics.service.ts
│   │   ├── task-category.service.ts
│   │   └── monitoring.service.ts
│   │
│   └── components/
│       ├── workflow/                # Workflow UI
│       │   ├── use-workflow-drag-n-drop.ts  # Kanban DnD hook
│       │   ├── kanban-group.tsx
│       │   └── workflow-blocker-modal.tsx
│       ├── time-tracking/           # Time tracking UI
│       ├── ho/                       # Org chart UI
│       ├── analytics/                # Analytics dashboard UI
│       ├── task-category/            # Task categories admin UI
│       ├── monitoring/               # Monitoring dashboard UI
│       └── [other]/
│
├── app/                            # Old routing (gradual migration)
└── tsconfig.json                   # Path aliases
    # @/* → core/*
    # @/plane-web/* → ce/*
```

### State Management (MobX)

**Store Hierarchy:**
```
RootStore (ce/store/root.store.ts extends CoreRootStore)
├── workspaceStore: WorkspaceRootStore
│   └── workspaces: Map<id, Workspace>
├── projectStore: ProjectRootStore
│   └── projects: Map<id, Project>
├── issueStore: IssueRootStore
│   ├── issues: Map<id, Issue>
│   ├── issueFilters: IssueFilters
│   ├── issueLayouts: "list" | "kanban" | "gantt" | "calendar" | "spreadsheet"
│   └── issueDetails: Map<id, DetailedIssue>
├── cycleStore: CycleRootStore
├── moduleStore: ModuleRootStore
├── pageStore: PageRootStore
├── workflowStore: WorkflowRootStore (CE)
│   └── workflows: Map<projectId, Workflow>
├── timeTrackingStore: TimeTrackingRootStore (CE)
│   └── timeLogs: Map<issueId, TimeLog[]>
├── hoStore: HORootStore (CE)
│   └── orgChart: OrgNode[]
├── analyticsStore: AnalyticsRootStore (CE)
│   └── dashboardData: Map<projectId, AnalyticsData>
├── taskCategoryStore: TaskCategoryRootStore (CE)
│   └── categories: Map<workspaceId, TaskCategory[]>
└── monitoringStore: MonitoringRootStore (CE)
    └── metrics: Map<projectId, MonitoringMetrics>
```

**Data Flow:**
```
User Action (click, drag, form submit)
    ↓
Hook (useIssue, useWorkflow)
    ↓
Store.action (updateIssue, moveIssueToState)
    ↓
Service.fetch (issueService.update)
    ↓
API v0 (PUT /api/v0/issues/{id}/)
    ↓
Store.runInAction (apply response data)
    ↓
Component re-renders (via observer)
```

### Issue Layouts (Multi-View, Single Store)

**Architecture:**
```
IssueRootStore (single source of truth)
├── issues: Map<id, Issue>
├── filters: IssueFilters
├── sortBy: string
└── groupBy: string

Layout Selector (in project view)
├─ List View   → ListLayout component
├─ Kanban      → KanbanLayout component (with DnD)
├─ Gantt       → GanttLayout component
├─ Calendar    → CalendarLayout component
└─ Spreadsheet → SpreadsheetLayout component

All layouts read from same store
All mutations update same store
Switching layouts = changing view, not refetching
```

**Kanban with DnD & Workflow Validation:**
```
KanbanLayout
├── KanbanGroup (per state, one per column)
│   ├── useWorkflowFDragNDrop hook
│   │   ├── Validates state transition via workflow
│   │   └── Returns: disabled flags, handleWorkFlowState
│   ├── IssueCard (Atlaskit pragmatic DnD)
│   └── onDragEnter → handleWorkFlowState(source, dest)
│
└── Blocked transition
    └── throw WORKFLOW_TRANSITION_BLOCKED
        └── unhandledrejection event
            └── WorkflowBlockerModal catches & shows reason
```

## Backend Architecture

### Django Application Structure (apps/api)

```
apps/api/
├── plane/
│   ├── settings/
│   │   ├── base.py           # Core Django config
│   │   ├── urls.py           # API routing (v0, v1)
│   │   ├── asgi.py           # ASGI entry
│   │   └── celery.py         # Celery config
│   │
│   ├── db/
│   │   ├── models/           # 37 ORM models
│   │   │   ├── workspace.py  # Workspace, WorkspaceMember
│   │   │   ├── project.py    # Project, ProjectMember
│   │   │   ├── issue.py      # Issue, IssueLabel, IssueLink
│   │   │   ├── cycle.py      # Cycle, CycleIssue
│   │   │   ├── module.py     # Module, ModuleIssue
│   │   │   ├── page.py       # Page, PageBlock
│   │   │   ├── state.py      # State (workflow states)
│   │   │   ├── workflow.py   # WorkflowState, WorkflowTransition (CE)
│   │   │   ├── time-log.py   # TimeLog (CE)
│   │   │   └── [other].py
│   │   └── managers.py       # SoftDeletionManager, etc.
│   │
│   ├── app/
│   │   ├── views/            # DRF ViewSets (41+ endpoints)
│   │   │   ├── workspace/
│   │   │   ├── project/
│   │   │   ├── issue/
│   │   │   ├── cycle/
│   │   │   ├── module/
│   │   │   ├── page/
│   │   │   ├── workflow/     # CE endpoints
│   │   │   └── [other]/
│   │   │
│   │   ├── serializers/
│   │   │   ├── v0/           # Session auth (internal)
│   │   │   │   ├── issue.py
│   │   │   │   └── [other].py
│   │   │   └── v1/           # API key auth (external)
│   │   │       ├── issue.py
│   │   │       └── [other].py
│   │   │
│   │   ├── permissions.py    # Custom DRF permissions
│   │   └── authentication.py # API key + Session auth
│   │
│   ├── utils/
│   │   ├── workflow_checker.py   # Workflow transition validation
│   │   ├── decorators.py         # @allow_permission decorator
│   │   ├── export.py             # CSV/JSON export logic
│   │   └── [other].py
│   │
│   ├── middleware/
│   │   ├── auth.py               # Session/API key extraction
│   │   ├── logging.py            # Request/response logging
│   │   ├── workspace.py          # Workspace detection
│   │   ├── read_replica.py       # Route reads vs writes
│   │   └── [9 more layers]
│   │
│   ├── tasks/                    # Celery async tasks (41 tasks)
│   │   ├── notification.py       # Email, Slack, webhooks
│   │   ├── activity.py           # Activity logging
│   │   ├── export.py             # CSV/PDF exports to S3
│   │   └── [other].py
│   │
│   └── constants/
│       ├── roles.py              # ROLE.ADMIN, MEMBER, GUEST
│       └── [other].py
│
├── manage.py
├── requirements.txt
└── Dockerfile
```

### Request Pipeline (10-Layer Middleware)

```
HTTP Request
    ↓
1. CORS Middleware           (Domain validation)
    ↓
2. Auth Middleware           (Extract session/API key)
    ↓
3. Logging Middleware        (Winston structured logs)
    ↓
4. Workspace Detection       (Slug → workspace_id)
    ↓
5. Read-Replica Router       (Route to read/write DB)
    ↓
6. Rate Limiting            (Per user/API key)
    ↓
7. GZip Compression         (Response compression)
    ↓
8. Request Validation       (Schema validation)
    ↓
9. @allow_permission Check  (RBAC: ADMIN/MEMBER/GUEST)
    ↓
10. View Logic              (DRF serializers, queryset)
    ↓
Response (JSON)
```

### API Versioning

**V0 API (Session Auth, Internal):**
- Used by web UI (apps/web)
- Cookie-based session
- Endpoint: `/api/v0/{resource}/`
- Serializers: `apps/api/plane/app/serializers/v0/`
- Auth: `@require_http_methods("POST")`, `@login_required`

**V1 API (API Key Auth, External):**
- Used by external integrations
- Header-based API key: `X-API-KEY`
- OpenAPI docs: `/api/v1/docs/`
- Endpoint: `/api/v1/{resource}/`
- Serializers: `apps/api/plane/app/serializers/v1/`
- Auth: Token authentication (DRF)

**Never share serializers between v0/v1**

### Database Schema

**Core Hierarchy:**
```
Workspace
├── WorkspaceMember (user, role, join_date)
├── Project
│   ├── ProjectMember (user, role)
│   ├── Issue
│   │   ├── IssueFavorite
│   │   ├── IssueLabel
│   │   ├── IssueLink (parent/duplicate/related)
│   │   ├── IssueActivity (audit trail)
│   │   └── TimeLog (CE)
│   ├── Cycle (sprints)
│   │   └── CycleIssue (M2M)
│   ├── Module (features)
│   │   └── ModuleIssue (M2M)
│   ├── State (workflow states)
│   │   └── WorkflowTransition (CE, state A → B)
│   ├── Label
│   ├── Priority
│   ├── Estimate
│   ├── Page (wiki)
│   │   └── PageBlock (nested blocks)
│   ├── PageFavorite
│   └── ProjectTemplate
│
├── Notification
├── Webhook
│   └── WebhookLog
└── Activity (audit log, workspace-level)
```

**Key Features:**
- Soft delete: `deleted_at` field with unique constraint conditions
- Audit trail: `created_by`, `updated_by` foreignkeys
- Timestamps: `created_at`, `updated_at` auto-set
- Indexing: Frequent queries indexed
- Relationships: `select_related()` + `prefetch_related()`

### Celery Task Queue

**Broker:** RabbitMQ
**Result Backend:** Redis
**Scheduler:** Celery Beat

**Task Categories (41+ tasks):**

| Category | Tasks | Examples |
|----------|-------|----------|
| **Notifications** | 8 | Email notification, Slack webhook, user mention |
| **Webhooks** | 6 | Send webhook event, retry failed delivery |
| **Activity Logging** | 5 | Log issue state change, activity digest |
| **Exports** | 4 | CSV export, PDF report generation |
| **Cleanup** | 6 | Archive soft-deleted issues, expire sessions |
| **Analytics** | 3 | Generate dashboard data, report aggregation |
| **Real-Time Sync** | 5 | Update WebSocket connections, Y.js sync |
| **CE-Specific** | 4+ | Time log processing, org chart updates, analytics computation, monitoring metrics |

**Async Patterns:**
```python
# View triggers task
@allow_permission("project.member")
def create_issue(request, workspace_slug, project_slug):
    issue = Issue.objects.create(...)
    # Fire async task
    send_issue_notification.delay(issue.id, request.user.id)
    return Response(issue_serializer.data, status=201)

# Task runs in worker
@shared_task
def send_issue_notification(issue_id, user_id):
    issue = Issue.objects.get(id=issue_id)
    user = User.objects.get(id=user_id)
    # Send email
    send_mail(...)
```

## Real-Time Architecture (apps/live)

```
WebSocket Server (Hocuspocus + Y.js CRDT)
    ↓
┌─────────────────────────────────┐
│ Shared Document State (Y.Doc)   │
│ ├─ PageBlock edits (text, rich) │
│ ├─ Issue updates (fields)       │
│ └─ Cursors/Awareness (future)   │
└─────────────────────────────────┘
    ↓
Y.js CRDT Engine (Conflict-Free)
    ↓
Broadcast to all connected clients
    ↓
ClientA, ClientB, ClientC receive updates
```

**Characteristics:**
- Operational Transform (CRDT): No conflict on concurrent edits
- Websocket upgrade from HTTP
- Y.js Awareness for presence (cursors, user colors)
- Persistent state: Y.js IndexedDB adapter
- Scalable: Y.js can scale to 10k+ users per document

## Reverse Proxy (Caddy)

```
caddy reverse proxy (apps/proxy)
    ↓
Route by Host/Path:
├── /api/* → :8000 (Django API)
├── /live/* → :3003 (Websocket)
├── /admin* → :3001 (Admin panel)
├── /space/* → :3002 (Public projects)
└── /* → :3000 (React web)
```

**Responsibilities:**
- TLS/SSL termination
- Load balancing
- Rate limiting
- Static file caching
- Gzip compression

## Data Flow Diagram: Creating an Issue

```
User submits form
    ↓
useIssueForm hook (useMemo)
    ↓
issueService.createIssue (POST /api/v0/issues/)
    ↓
Django View (IssueViewSet.create)
    ├─ @allow_permission("project.member")
    ├─ Serializer validation
    ├─ Issue.objects.create()
    ├─ Fire Celery task: send_issue_notification.delay()
    └─ Return IssueSerializer(issue)
    ↓
issueStore.addIssue(response)
    ├─ issues.set(id, new_issue)
    ├─ runInAction()
    └─ Notify observers
    ↓
List/Kanban/Gantt view re-renders
    ↓
New issue appears in all layouts
```

## Scalability & Performance

### Caching Strategy

| Layer | Tool | Data | TTL |
|-------|------|------|-----|
| **Browser** | LocalStorage | User preferences, UI state | Session |
| **HTTP Cache** | ETags, Cache-Control | API responses | Varies |
| **Redis Cache** | Redis | Workspace/project metadata, sessions | 1h |
| **DB Query Cache** | ORM select/prefetch | Related objects | Request scope |

### Database Optimization

- **Indexing:** Frequent filter fields indexed
- **Denormalization:** Count fields cached (issue_count on project)
- **Query optimization:** No N+1 queries (select_related, prefetch_related)
- **Read replicas:** Middleware routes reads to replicas
- **Connection pooling:** Psycopg2 pool (10-20 connections)

### Frontend Optimization

- **Code splitting:** Route-based chunks (Next.js)
- **Image optimization:** WebP, lazy loading
- **Tree shaking:** Unused code removed (Webpack)
- **Kanban virtualization:** Only visible items rendered
- **MobX optimization:** Fine-grained reactivity

## Security

### Authentication & Authorization

**Authentication:**
- V0 API: Django session (cookie-based)
- V1 API: API Key (header-based)
- CSRF protection: Token validation

**Authorization (RBAC):**
```python
@allow_permission("workspace.member")  # User is workspace member
@allow_permission("project.member")    # User is project member
@allow_permission("workspace.admin")   # User is workspace admin
```

Roles per level:
- Workspace: ADMIN, MEMBER, GUEST
- Project: ADMIN, MEMBER, GUEST

### Data Security

- **Soft delete:** Data preserved, not deleted
- **Audit trail:** All changes logged (created_by, updated_by)
- **API scoping:** Queries filtered by workspace slug
- **S3 upload:** Pre-signed URLs, no direct access
- **Secrets:** Env vars (never hardcoded)

## Monitoring & Observability

**Logging:**
- Winston structured JSON logs
- Correlation IDs for request tracing
- Log levels: ERROR, WARN, INFO, DEBUG
- Central log aggregation (future)

**Metrics:**
- APM: Request duration, error rates
- Database: Query count, execution time
- Celery: Task success/fail rates
- Redis: Cache hit rates

**Health Check:**
- Endpoint: `/health`
- Checks: DB connection, Redis, RabbitMQ
- Response: JSON status

---

**Last Updated:** 2026-04-08
**Version:** 1.1
