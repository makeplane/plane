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

### User & Profile Endpoints (V0 API)

Cross-workspace aggregation for performance (Session auth, internal use).

| Method | Path                                | Auth            | Purpose                                                    |
| ------ | ----------------------------------- | --------------- | ---------------------------------------------------------- |
| GET    | `/api/users/me/work-items/today/`   | Session + login | Open issues assigned to user, not yet overdue (≤200 items) |
| GET    | `/api/users/me/work-items/overdue/` | Session + login | Open issues assigned to user, past due (≤200 items)        |

**Parameters:**

- `?workspace=<slug>` (optional) — Filter to single workspace; default: all workspaces

**Serializer:** `UserCrossWorkspaceWorkItemSerializer` — ID-only response (minimal payload):

- `id`, `name`, `identifier`, `state_id`, `priority`, `target_date`
- `assignee_ids: UUID[]` (list of assignee IDs, not objects)
- `label_ids: UUID[]` (list of label IDs, not objects)
- `workspace_id`, `project_id`

**Filters:**

- Assignee = current user
- Active workspace membership (`workspace_member.is_active=True`)
- Active project membership (`project_member.is_active=True`)
- Project not archived
- State group in {backlog, unstarted, started} (open tasks only)
- Parent is null (excludes sub-tasks — critical for accuracy)

**Query optimization:**

- `use_read_replica=True` — read-only queries
- `select_related("workspace", "project", "state")` — joins on meta
- `prefetch_related("assignees", "labels")` — bulk-fetch relationships
- Supports DB partial index `issues_workitems_idx` on `(target_date, state_id) WHERE parent_id IS NULL AND deleted_at IS NULL AND archived_at IS NULL AND is_draft=FALSE`

**Capping:** 200-item hard limit (KISS principle; sub-task exclusion + state filter keeps real-world counts much lower).

**Feature flag:** `VITE_USE_AGGREGATE_PROFILE_ENDPOINT` (frontend env var, default `"true"`). When `"false"`, UI falls back to legacy client-side fan-out across individual workspace profile endpoints.

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

| Category             | Tasks | Examples                                                                          |
| -------------------- | ----- | --------------------------------------------------------------------------------- |
| **Notifications**    | 8     | Email notification, Slack webhook, user mention                                   |
| **Webhooks**         | 6     | Send webhook event, retry failed delivery                                         |
| **Activity Logging** | 5     | Log issue state change, activity digest                                           |
| **Exports**          | 4     | CSV export, PDF report generation                                                 |
| **Cleanup**          | 6     | Archive soft-deleted issues, expire sessions                                      |
| **Analytics**        | 3     | Generate dashboard data, report aggregation                                       |
| **Real-Time Sync**   | 5     | Update WebSocket connections, Y.js sync                                           |
| **CE-Specific**      | 4+    | Time log processing, org chart updates, analytics computation, monitoring metrics |

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

| Layer              | Tool                 | Data                                 | TTL           |
| ------------------ | -------------------- | ------------------------------------ | ------------- |
| **Browser**        | LocalStorage         | User preferences, UI state           | Session       |
| **HTTP Cache**     | ETags, Cache-Control | API responses                        | Varies        |
| **Redis Cache**    | Redis                | Workspace/project metadata, sessions | 1h            |
| **DB Query Cache** | ORM select/prefetch  | Related objects                      | Request scope |

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

**God Mode (instance admin) menu RBAC:**

- `InstanceAdmin` carries `is_super_admin` + `allowed_menus` (12 grantable keys in `plane/license/menu_registry.py`; `authentication`/general/email/ai/image config screens share the grouped `settings` key — all five persist through one `InstanceConfigurationEndpoint`).
- Enforcement is **route-group / URL-prefix based and fail-closed**: `InstanceAdminMenuPermission` resolves the required menu from `request.path` via `PREFIX_MENU_MAP` (longest-prefix). Unmapped paths deny scoped admins; identity/session paths (`admins/me|session|sign-*`) are shared; super-admins bypass. Views carry no per-class menu annotation.
- Coverage is build-enforced: `plane/tests/unit/test_menu_registry_parity.py` fails if any `/api/instances/` route is unmapped, any view re-introduces the bare pre-RBAC `InstanceAdminPermission`, or the admin-app sidebar permission keys drift from the backend registry.
- Management: `POST/PATCH/DELETE /api/instances/admins/` — only super-admins mint super-admins; `administrators`-menu admins grant only subsets of their own menus and never edit their own row. Lockout guards protect the last active loginable super-admin (ghost `user=NULL` and inactive rows never count) across admin demote/delete, user deactivation, password reset, and staff deactivation.
- Admin app sidebar (`apps/admin/hooks/use-sidebar-menu/`) filters by `currentUser.allowed_menus`; a layout-level guard redirects ungranted direct navigation. UI filtering is cosmetic — the backend permission is the security boundary.

**God-mode workspace ownership:**

- Workspaces created from God Mode are owned by the **General Director** (the single active staff with `job_grade="GD"`, resolved by `plane/utils/general_director.py`) or an explicitly chosen user — never the acting instance admin, who receives no `WorkspaceMember`/`ProjectMember` row on any creation/import path (attribution `created_by` stays the actor).
- Owner precedence: explicit `owner_id`/`owner_email` > GD; unresolvable or ambiguous GD fails with 400. `GET /api/instances/workspaces/owner-options/` feeds the create-form picker (staff-directory enumeration gated behind the `staff`/`users` menu).

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

## Help Center Subsystem (Instance-Global User Guide)

### Overview

Instance-global, multilingual in-app user guide for all ~100 department workspaces. NOT per-workspace. Instance admins (God Mode) author articles and categories; all logged-in users read at `/help`.

**Design goals:** single shared guide + per-locale translations (VI/EN/KO) + Vietnamese accent-insensitive search + sanitized HTML content + instance-global image assets.

### Data Model

```
HelpCategory (global, 1 row per category)
  id, slug (globally unique), icon, display_order, created_at, updated_at

HelpCategoryTranslation (per-locale title/description)
  id, category_fk, locale (vi|en|ko), title, description_html, description_json, description_stripped, search_text

HelpArticle (global, 1 row per article)
  id, slug (globally unique), category_fk, display_order, is_published, created_by, updated_at

HelpArticleTranslation (per-locale title/content)
  id, article_fk, locale (vi|en|ko), title, description_html, description_json, description_stripped, search_text, created_at, updated_at
```

**Key fields:**

- `description_html` — Sanitized HTML served to readers (script/iframe/video dropped, style attr removed).
- `description_json` — Rich-text editor JSON, internal only (never served to reader).
- `description_stripped` — Plain text (future use: email notifications, transcripts).
- `search_text` — App-folded accent-insensitive index (NFKD + drop combining marks + `đ→d`, stored in DB column, no pg_trgm extension needed).

**Migration:** `0178_help_center.py` creates all 4 tables with soft-delete support and uniqueness constraints.

### Backend Architecture

**Split by auth layer & responsibility:**

#### Read Layer (`plane/app/` - Public, IsAuthenticated)

Files: `apps/api/plane/app/views/help_center/{base,article,category}.py`, serializers `apps/api/plane/app/serializers/help_center.py`, urls `apps/api/plane/app/urls/help_center.py`.

| Method | Endpoint                          | Auth | Purpose                                                 |
| ------ | --------------------------------- | ---- | ------------------------------------------------------- |
| GET    | `/api/help/categories/`           | auth | List published categories + top N articles per category |
| GET    | `/api/help/articles/`             | auth | List published articles (all categories), searchable    |
| GET    | `/api/help/articles/<pk>/`        | auth | Get single article (all locales, locale fallback)       |
| GET    | `/api/help/articles/slug/<slug>/` | auth | Get single article by slug (locale-resolved)            |

**Locale resolution (read):**

1. Accept-Language header or locale param → try to fetch that translation
2. If missing → fallback to `en`
3. If en missing → use any available translation (title-bearing)
4. Response includes `resolved_locale` (used) + `matched_locale` (search match, if via search query)

**Search:**

- All 3 locale rows of matching articles scanned
- `icontains` over pre-folded `search_text` column
- Multilingual hits (e.g. Vietnamese search returns matching VI/EN/KO articles)
- Results ranked by relevance (exact match > partial)

#### Write Layer (`plane/license/api/` - God Mode Admin Only)

Files: `apps/api/plane/license/api/views/help_center.py`, urls `apps/api/plane/license/api/urls/help_center.py` (mounted under `/api/instances/help/...`).

| Method | Endpoint                                          | Auth              | Purpose                                 |
| ------ | ------------------------------------------------- | ----------------- | --------------------------------------- |
| GET    | `/api/instances/help/categories/`                 | InstanceAdminPerm | List all categories (draft + published) |
| POST   | `/api/instances/help/categories/`                 | InstanceAdminPerm | Create category                         |
| PATCH  | `/api/instances/help/categories/<id>/`            | InstanceAdminPerm | Update category (icon, order)           |
| DELETE | `/api/instances/help/categories/<id>/`            | InstanceAdminPerm | Soft-delete category                    |
| GET    | `/api/instances/help/articles/`                   | InstanceAdminPerm | List all articles                       |
| POST   | `/api/instances/help/articles/`                   | InstanceAdminPerm | Create article                          |
| PATCH  | `/api/instances/help/articles/<id>/`              | InstanceAdminPerm | Update article (category, order, title) |
| DELETE | `/api/instances/help/articles/<id>/`              | InstanceAdminPerm | Soft-delete article                     |
| POST   | `/api/instances/help/articles/<id>/publish/`      | InstanceAdminPerm | Publish one locale translation          |
| POST   | `/api/instances/help/articles/translate/`         | InstanceAdminPerm | Upsert translation (VI/EN/KO)           |
| POST   | `/api/instances/help/articles/<id>/upload-image/` | InstanceAdminPerm | Upload inline image (FileAsset)         |

**Publishing:** Requires at least one locale's translation to have a non-empty title. Publishing OVERWRITES the previous translation destructively (no version history).

### Frontend Architecture

**Reader (`apps/web/app/(all)/help/*`, auth-gated):**

- Route: `/help` (global, no workspace prefix, under `(all)` layout)
- Components: `apps/web/ce/components/help-center/*`
  - `help-center-home.tsx` — Featured articles grid + search box
  - `help-article-view.tsx` — Single article reader
  - `help-article-toc.tsx` — Table of contents
  - `help-search-box.tsx` — Search box with live results
  - `locale-fallback-notice.tsx` — Notice when reader's locale unavailable
- Store: `apps/web/ce/store/help-center/*`
  - `help-center.store.ts` — Root store
  - `category.store.ts` — Fetch categories
  - `article.store.ts` — Fetch articles, search, locale resolution
- Service: `apps/web/ce/services/help-center.service.ts` — API calls
- Types: `apps/web/ce/types/help-center.ts`

**Authoring (`apps/admin/(all)/(dashboard)/help-center`, God Mode only):**

- Route: `/help-center` in admin panel (English-only UI)
- Components: `apps/admin/app/(all)/(dashboard)/help-center/components/*`
- Store: `apps/admin/store/instance-help-center.store.ts`
- Custom toolbar: fixed buttons for formatting, image insert, preview toggle
- Image uploads: instance-global `FileAsset` (entity_type=HELP_ARTICLE_CONTENT, workspace_id=NULL)

### Content Pipeline (Markdown-Source → Injected Assets)

**Source-to-reader flow:**

1. **Markdown source** — `apps/api/plane/db/fixtures/help_center/` (categories.yaml + article markdown files)
2. **Loader** (`apps/api/plane/db/fixtures/help_center/loader.py`) — parses frontmatter, renders markdown → HTML, sanitizes with hardened allowlist (drops `<script>`, `<iframe>`, `<video>`, `<style>` attributes), **escapes raw HTML as text**, post-sanitizes to inject screenshot markers (`{{screenshot:NAME}}` → `<p data-help-screenshot="NAME"></p>` or span variant)
3. **Database storage** — sanitized HTML in `HelpArticleTranslation.description_html`, never re-sanitized on read
4. **Instance-global asset injection** — once per instance, `inject_help_screenshots` command uploads captured PNGs as workspace-less `FileAsset` (entity_type=HELP_ARTICLE_CONTENT), replaces markers with `<img src="/api/assets/v2/static/{id}/">`, asset IDs minted at upload (instance-specific, not in git)
5. **Reader** — served sanitized HTML + injected images, no post-processing

**Idempotency:** Seeding the content is additive (never deletes); re-seeding restores raw markers (requires re-inject). Re-injecting images supersedes prior assets per (article, screenshot-name).

### Content Security & Sanitization

**HTML sanitization** (`plane/app/serializers/help_center.py`, library `nh3`):

- Allowlist: `<p>`, `<h1>`–`<h6>`, `<strong>`, `<em>`, `<u>`, `<s>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<code>`, `<pre>`, `<img>`, `<br>`, `<hr>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>`
- Drop: `<script>`, `<iframe>`, `<video>`, `<object>`, `<embed>`, `on*` attributes, `style` attribute (hardened vs. general content, style unsafe for broadcast security)
- Keep: `rel` on `<a>` (for anti-tabnabbing `rel="noopener noreferrer"`)

**Read path:** Reader served sanitized `description_html` ONLY. `description_json` (editor state) never exposed.

### Inline Images (Global Asset Management)

- Model: `FileAsset` with `entity_type=HELP_ARTICLE_CONTENT`, `workspace_id=NULL` (instance-global)
- Endpoint: `/api/assets/v2/static/{id}/` (`StaticFileAssetEndpoint`, AllowAny, serves public by ID, 404 on soft-deleted/not-uploaded)
- Authoring: God Mode only; editor toolbar `Insert Image` button triggers upload flow
- Image metadata stored in `description_json` (custom editor extension)
- Metadata fields: `id`, `source` (S3 URL or local path), `width`, `height`, `aspectRatio`, `alignment` (left|center|right)
- **Intentional limitation:** No `alt` attribute support in the custom image editor extension. Workaround: descriptive caption paragraph below images.

### Discovery (Reader Entry Points)

1. **Help (?) menu item** in workspace top nav → navigates to `/help`
2. **Cmd+K quick action** — "Help Center" command pushes `/help` (global, no workspaceSlug)
3. **Inline help links** in UI (future) — contextual `/help/a/:articleSlug`

**Intentional:** No help search results group in global Cmd+K. All help search happens in-page at `/help`.

### Management Command

`apps/api/plane/db/management/commands/seed_help_center.py` — **Idempotent, instance-global, run ONCE per instance**:

```bash
python manage.py seed_help_center
```

**Behavior:**

- Checks if seeded already (by checking for existence of seed marker in DB)
- If yes, skips (idempotent)
- If no: seeds 5 categories + 5 articles in all 3 locales
- Content uses "Shinhan Workspace" terminology (not "Plane")
- Publishes all translations (is_published=True)

---

## Business Calendar Subsystem

> Plan: `plans/260428-1427-vietnam-working-day-holiday-management/`
> Research: `plans/reports/researcher-260428-1412-vietnam-working-day-holiday-management.md`

### Overview

Manual, god-mode source-of-truth for Vietnamese working-day rules. No third-party calendar API, no auto-import. Instance admins define schedules, holidays, and day overrides via the `/calendar` admin UI; Celery tasks consult the service at invocation time.

**Design goals:** deterministic (same inputs → same result), fail-open (calendar errors never block critical background jobs), cache-backed (TTL 1 day, signal-invalidated on any data change).

### Data Model

```
WorkSchedule (1) ──────────┬── Holiday (N)
  id, name                 │     id, schedule_fk, date, name
  week_pattern[7] bool     │
  timezone (Asia/HCM)      └── DayOverride (N)
  is_default bool                id, schedule_fk, date
  country_code "VN"              type WORKDAY|HOLIDAY
  workspace_fk (null=instance)   reason, swap_with_date
```

**Resolution priority** (highest wins):

1. `DayOverride` for the date → WORKDAY or HOLIDAY
2. `Holiday` for the date → not working
3. `week_pattern[weekday]` → True/False

### Service

`plane/utils/business_calendar/service.py` — `BusinessCalendarService` (all class methods, no state):

| Method                 | Signature                              | Purpose                   |
| ---------------------- | -------------------------------------- | ------------------------- |
| `is_working_day`       | `(d, schedule_id=None) → bool`         | Core predicate            |
| `next_working_day`     | `(d, schedule_id=None) → date`         | Skip to next working date |
| `add_business_days`    | `(d, n, schedule_id=None) → date`      | Walk forward/back N days  |
| `working_days_between` | `(start, end, schedule_id=None) → int` | Count half-open interval  |

**Cache:** `calendar:{schedule_id}:{year}` → serialised holiday+override dict, TTL 86400 s.

**Signal invalidation** (`plane/db/models/business_calendar.py`):

- `Holiday` post_save/post_delete → `cache.delete(calendar:{schedule_id}:{year})`
- `DayOverride` post_save/post_delete → same
- `WorkSchedule` post_delete (hard) → year-range sweep; post_save with `deleted_at` set → same

Signals auto-imported in `plane/db/apps.py` `ready()`.

### API

Instance-admin layer at `plane/license/api/` — requires `InstanceAdminPermission`.

| Method           | Path                                                      | Action                          |
| ---------------- | --------------------------------------------------------- | ------------------------------- |
| GET/POST         | `/api/instances/calendar/schedules/`                      | List / create schedules         |
| GET/PATCH/DELETE | `/api/instances/calendar/schedules/{id}/`                 | Retrieve / update / soft-delete |
| GET/POST         | `/api/instances/calendar/schedules/{id}/holidays/`        | List / bulk-create holidays     |
| DELETE           | `/api/instances/calendar/schedules/{id}/holidays/{hid}/`  | Delete holiday                  |
| GET/POST         | `/api/instances/calendar/schedules/{id}/overrides/`       | List / create overrides         |
| DELETE           | `/api/instances/calendar/schedules/{id}/overrides/{oid}/` | Delete override                 |
| POST             | `/api/instances/calendar/schedules/{id}/copy-year/`       | Bulk-copy one year to another   |
| GET              | `/api/instances/calendar/schedules/default/`              | Resolve instance default        |

### UI

`apps/admin` — route `/calendar`:

- Workweek toggle panel (Mon–Sun checkboxes per schedule)
- Holidays grid (date + name, inline add/delete, grouped by month)
- Overrides table (date, type WORKDAY/HOLIDAY, reason, swap-with link)
- Copy-year action (clone all holidays/overrides from year A to year B)

### Celery Integration

`plane/utils/celery_helpers.py` — `working_day_required()` decorator factory:

```python
@shared_task          # outermost — Celery registers it
@working_day_required()  # inner — guard runs at invocation
def archive_and_close_old_issues(): ...
```

**Fail-open:** if `BusinessCalendarService` raises, logs exception and runs task anyway.
**Log on skip:** `INFO plane.utils.celery_helpers "Skip {task}: {date} (VN) is not a working day"`.

---

**Last Updated:** 2026-05-30
**Version:** 1.3
