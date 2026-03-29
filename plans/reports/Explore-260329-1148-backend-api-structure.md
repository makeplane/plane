# Backend API Structure Exploration — Plane.so

**Date:** 2026-03-29 | **Codebase:** `/Volumes/Data/SHBVN/plane.so` | **Focus:** apps/api/, apps/live/, apps/proxy/ | **Thoroughness:** Medium

---

## 1. APPS/API - Django Backend (port 8000)

### 1.1 Overall Structure

```
plane/
├── db/             # Data models only (no business logic)
├── app/            # Internal API v0 (session auth, frontend use)
│   ├── serializers/
│   ├── views/
│   ├── urls/
│   ├── permissions/
│   └── middleware/
├── api/            # External API v1 (API key/OAuth, public docs)
│   ├── serializers/
│   ├── views/
│   ├── urls/
│   └── middleware/
├── authentication/ # Auth providers, strategies
├── license/        # Instance-level (God Mode) admin APIs
├── bgtasks/        # ~42 Celery tasks
├── utils/          # Shared utilities, exporters, filters, permissions
├── middleware/     # Global middleware
└── settings/       # Django config
```

**Key Root URLs:**

- `/api/` → `plane.app.urls` (internal, session-based)
- `/api/v1/` → `plane.api.urls` (external, API key-based)
- `/api/public/` → `plane.space.urls` (public endpoints)
- `/api/instances/` → `plane.license.urls` (instance admin)
- `/auth/` → `plane.authentication.urls` (auth flows)

---

### 1.2 Django Apps & Key Models

#### Database Layer (`plane/db/models/`)

**42 model files, mostly project/workspace-scoped:**

| Category                  | Models                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Core**                  | User, Account, Profile (auth); Workspace, WorkspaceMember, WorkspaceBaseModel; Project, ProjectMember                               |
| **Work Items**            | Issue, IssueActivity, IssueComment, IssueReaction, IssueLink, IssueRelation, IssueBlocker, IssueMention, IssueSubscriber, IssueVote |
| **Planning**              | Cycle, CycleIssue; Module, ModuleActivity, ModuleMember, ModuleIssue, ModuleLink; State, StateGroup                                 |
| **Documentation**         | Page, PageLabel, PageLog, ProjectPage, PageVersion, Description, DescriptionVersion                                                 |
| **Time Tracking**         | **IssueWorkLog** - tracks duration_minutes, logged_by, logged_at per issue (new feature)                                            |
| **Intake**                | Intake, IntakeIssue (CRM-like feature)                                                                                              |
| **Recent Features**       | IssueWorkLog (worklog/time tracking), ModuleActivity (module changes), Department, StaffProfile (HR), Workflow (automation)         |
| **Assets & Config**       | FileAsset, Webhook, WebhookLog, AnalyticView, APIToken, ExporterHistory                                                             |
| **Views & Notifications** | IssueView, Notification, EmailNotificationLog, UserNotificationPreference, UserFavorite                                             |
| **Misc**                  | Device, Session, Label, Sticky, DeployBoard, Estimate, Integration (GitHub/Slack)                                                   |

**Base Classes:**

- `BaseModel` - created_at, updated_at, deleted_at, id (UUID)
- `WorkspaceBaseModel` - inherits BaseModel + workspace FK + custom managers (soft delete)
- `ProjectBaseModel` - inherits WorkspaceBaseModel + project FK

---

### 1.3 API Layer Architecture (Critical Split)

#### **plane/app/** (Internal API v0) - Session-Based

- **Auth:** Cookie-based (session auth via crum)
- **OpenAPI:** None (no @extend_schema decorators)
- **Serializers:** Separate set in `plane/app/serializers/`
- **Views:** BaseViewSet and BaseAPIView from `plane.app.views.base`
- **Used by:** apps/web, apps/admin frontends
- **Examples:**
  - IssueViewSet, CycleViewSet, ModuleViewSet, ProjectViewSet
  - Workspace, User, Notification endpoints
  - Issue activities, comments, links

#### **plane/api/** (External API v1) - API Key/OAuth-Based

- **Auth:** API tokens + OAuth (if configured)
- **OpenAPI:** Full support (all views use @extend_schema)
- **Serializers:** SEPARATE set from v0 in `plane/api/serializers/`
- **Views:** BaseAPIView from `plane.api.views.base`
- **Used by:** Third-party integrations, external clients
- **Examples:**
  - Issue operations (CRUD, comments, attachments)
  - Cycles, modules, intake (creation, updates, transfers)
  - Invites, members, assets
  - Sticky notes

#### **plane/license/api/** (Instance Admin)

- **Auth:** InstanceAdminPermission (God Mode users only)
- **Scope:** Workspace/project independent (instance-level)
- **Views:** BaseAPIView from `plane.license.api.views`
- **Used by:** Instance administrators

---

### 1.4 Recent Features & Activity Tracking

#### **Time Tracking / Worklog** ✓

- **Model:** `IssueWorkLog` (ProjectBaseModel)
  - Fields: issue, logged_by, duration_minutes, description, logged_at
  - Indexes: [issue, logged_by], [project, logged_at]
- **View:** `IssueWorkLogViewSet` in `plane/app/views/issue/worklog.py`
  - Permissions: @allow_permission([ROLE.ADMIN, ROLE.MEMBER]) for create
  - Daily limit check: MAX_DAILY_MINUTES = 720 (12 hours)
  - Edit window: 60 working days (then read-only)
  - Mandatory reason field for edits/deletes
- **Activity Tracking:** Fires `issue_activity.delay()` with type:
  - `worklog.activity.created`
  - `worklog.activity.updated`
  - `worklog.activity.deleted`
- **Background Tasks:**
  - `worklog_daily_reminder()` - sends notifications + emails to users who haven't logged time
  - `worklog_export_task` - exports worklogs
  - Filter: optout via UserNotificationPreference.worklog_reminder

#### **Module Activity** ✓

- **Model:** `ModuleActivity` (ProjectBaseModel)
  - Fields: module (FK), actor (FK to User), verb, field, old_value, new_value, epoch
- **Tracked in:** Issue activities task (module changes are logged as issue activity)
- **Related:** ModuleMember (ManyToMany users in module), ModuleUserProperties (per-user module view prefs)

#### **Modules (Enhanced)** ✓

- **Model:** `Module` (ProjectBaseModel)
  - Fields: name, description, description_text, description_html, start_date, target_date
  - Status enum: BACKLOG, PLANNED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
  - Lead, Members (ManyToMany via ModuleMember), view_props, sort_order, archived_at
  - logo_props, external_source, external_id (for imports)
- **View Customization:** ModuleUserProperties (per-user filters, display_filters, display_properties, rich_filters)

#### **Opinions / Feedback** ✗

- Not found in codebase. May be future feature or named differently.

#### **Project Time Tracking Flag** ✓

- `Project.is_time_tracking_enabled` (Boolean, default True)
- Checked in IssueWorkLogViewSet.create() before allowing worklog creation

---

### 1.5 Permissions & Authorization

#### Permission Hierarchy

```
plane/app/permissions/
├── project.py
│   ├── ProjectBasePermission
│   ├── ProjectMemberPermission
│   └── ProjectEntityPermission
├── workspace.py
│   ├── WorkSpaceBasePermission (allow anyone for creation)
│   ├── WorkspaceOwnerPermission
│   ├── WorkSpaceAdminPermission
│   ├── WorkspaceEntityPermission
│   ├── WorkspaceViewerPermission
│   └── WorkspaceUserPermission
└── page.py
    └── ProjectPagePermission
```

#### ROLE Enum (in Project model)

- ADMIN = 20
- MEMBER = 15
- GUEST = 5

#### Decorator Pattern

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
def create(self, request, ...):
    # Only admins and members can create
```

---

### 1.6 Serializers (Two-Layer Pattern)

**plane/app/serializers/** (Internal v0)

- BaseSerializer (custom DRF serializer)
- IssueCreateSerializer, IssueActivitySerializer, IssueCommentSerializer, etc.
- UserSerializer, UserMeSerializer, UserLiteSerializer, etc.
- Workspace, Project, Cycle, Module, State serializers

**plane/api/serializers/** (External v1)

- SEPARATE implementations for public API
- Examples: IssueSerializer, IssueLiteSerializer, IssueCommentSerializer
- ProjectSerializer, ProjectCreateSerializer, ProjectUpdateSerializer
- CycleSerializer, ModuleSerializer (different from v0 versions)

**Patterns:**

- Write/read split: CycleWriteSerializer vs CycleSerializer
- Lite variants: ProjectLiteSerializer for list endpoints
- Nested: IssueExpandSerializer for detail/relations

---

### 1.7 Background Tasks (Celery / RabbitMQ)

**42 Celery tasks in `plane/bgtasks/`:**

| Task                           | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| **issue_activities_task**      | Issue activity tracking (field changes, mentions, reactions) |
| **issue_automation_task**      | Trigger automations on issue state changes                   |
| **worklog_reminder_task**      | Daily email/notification reminders for time tracking         |
| **worklog_export_task**        | Export worklogs to CSV/Excel                                 |
| **capacity_report.py**         | Generate capacity reports                                    |
| **notification_task**          | In-app notifications, email digests                          |
| **email_notification_task**    | Transactional emails (invites, mentions, etc.)               |
| **webhook_task**               | Trigger workspace/project webhooks                           |
| **cleanup_task**               | Delete archived/old data                                     |
| **export_task**                | Export issues, projects                                      |
| **analytic_plot_export**       | Export analytics charts                                      |
| **page_transaction_task**      | Page edit tracking (versioning)                              |
| **department_membership_task** | HR department sync                                           |
| **seed_department_staff_data** | Populate staff/HR data                                       |
| **dummy_data_task**            | Seed test data                                               |
| **exporter_expired_task**      | Cleanup expired exports                                      |

**Pattern:**

```python
from plane.bgtasks.issue_activities_task import issue_activity

issue_activity.delay(
    type="worklog.activity.created",
    requested_data=json.dumps(...),
    actor_id=str(request.user.id),
    issue_id=str(issue_id),
    project_id=str(project_id),
    current_instance=None,
    epoch=int(timezone.now().timestamp()),
    notification=False,
)
```

---

### 1.8 URL Pattern Examples

**Internal (v0):**

```
/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-worklogs/
  → IssueWorkLogViewSet (list, create, partial_update, destroy)

/api/workspaces/{slug}/cycles/
  → CycleViewSet (CRUD)

/api/workspaces/{slug}/modules/
  → ModuleViewSet (CRUD)
```

**External (v1):**

```
/api/v1/workspaces/{slug}/projects/{project_id}/issues/
  → Issue operations (list, create, retrieve, update, partial_update, destroy)

/api/v1/workspaces/{slug}/cycles/
  → Cycle operations (create, update, transfer issues, archive)

/api/v1/workspaces/{slug}/modules/
  → Module operations (similar to cycles)
```

---

### 1.9 Custom Managers & QuerySet Optimization

**issue_objects Manager (Critical)**

- `Issue.issue_objects` instead of `Issue.objects`
- Pre-selects related: assignees, labels, cycles, modules, comments, etc.
- Prefetches subscribers, votes, reactions for N+1 prevention
- Rule: Never use `Issue.objects` for user queries

**Example from BaseViewSet:**

```python
def get_queryset(self):
    return self.filter_queryset(
        super()
        .get_queryset()
        .filter(workspace__slug=self.kwargs.get("slug"))  # Always filter by workspace
        .filter(project_id=self.kwargs.get("project_id"))
        .select_related("logged_by", "project", "workspace", "issue")
        .distinct()
    )
```

---

## 2. APPS/LIVE - WebSocket Realtime Server (port 3000)

### 2.1 Stack & Architecture

**Tech Stack:**

- Framework: Express.js + express-ws (WebSocket)
- Realtime: Hocuspocus (Y.js-based CRDT)
- Persistence: PostgreSQL (via @hocuspocus/extension-database)
- Caching: Redis (via @hocuspocus/extension-redis)
- Logging: Sentry + @plane/logger
- PDF Export: React PDF (@react-pdf/renderer)
- Document Format: TipTap (rich text editor with Y.js)

**Directory Structure:**

```
live/src/
├── controllers/          # HTTP/WS endpoint handlers
│   ├── collaboration.controller.ts    # WebSocket @/collaboration
│   ├── document.controller.ts         # Document ops
│   ├── pdf-export.controller.ts       # PDF generation
│   ├── health.controller.ts           # Health checks
│   └── index.ts
├── extensions/          # Hocuspocus plugins
│   ├── database.ts      # PostgreSQL persistence
│   ├── redis.ts         # Redis cache layer
│   ├── logger.ts        # Logging extension
│   ├── title-sync.ts    # Auto-sync page titles
│   ├── title-update/    # Title update debouncing
│   ├── force-close-handler.ts
│   └── index.ts
├── services/            # Business logic
│   ├── api.service.ts   # HTTP client to Django API
│   ├── user.service.ts  # User context (from JWT)
│   └── page/            # Page/document service
├── lib/
│   ├── auth.ts          # JWT verification (onAuthenticate)
│   ├── auth-middleware.ts
│   ├── stateless.ts     # Handling absent persistence
│   ├── pdf/             # PDF generation (colors, styles, mark-renderers)
│   └── errors.ts
├── schema/
│   └── pdf-export.ts    # Zod schemas for validation
├── types/
│   ├── index.ts
│   └── admin-commands.ts
├── hocuspocus.ts        # Hocuspocus server singleton manager
├── redis.ts             # Redis connection manager
├── start.ts             # Entry point (startup, shutdown handlers)
└── env.ts               # Environment config
```

### 2.2 Key Controllers

#### **CollaborationController**

- Route: `/collaboration`
- Method: @WSDecorator("/")
- Handles WebSocket connections for real-time document collaboration
- Uses Hocuspocus server to manage Y.js CRDT sync
- Error handling: ws.close(1011) on connection errors

#### **DocumentController**

- CRUD operations on documents/pages
- Sync with Django API via ApiService

#### **PDFExportController**

- Route: `/pdf-export`
- Generates PDF from page content
- Uses @react-pdf/renderer
- Handles mark rendering (complex formatting)

#### **HealthController**

- Basic health check endpoint

### 2.3 Hocuspocus Extensions

**Hocuspocus** = Y.js CRDT server framework (vs. raw socket management)

| Extension               | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| **database**            | Persist document state to PostgreSQL               |
| **redis**               | Cache recent edits in Redis (faster access)        |
| **logger**              | Debug logging via @plane/logger                    |
| **title-sync**          | Auto-update page title when document changes       |
| **title-update**        | Debounce title updates (prevent N database writes) |
| **force-close-handler** | Graceful disconnect management                     |

**Config:**

```typescript
new Hocuspocus({
  name: serverName,
  onAuthenticate, // JWT validation
  onStateless, // Handle missing persistence
  extensions: getExtensions(),
  debounce: 10000, // 10s batch updates to DB
});
```

### 2.4 Authentication Flow

**JWT-Based:**

1. Client connects to `/collaboration` with token in query params
2. `onAuthenticate` hook validates JWT
3. Extracts user context (workspace, project, page)
4. Attaches to Hocuspocus context
5. Subsequent operations check permissions

**Middleware:** `auth-middleware.ts` for HTTP routes

---

### 2.5 PDF Export Feature

- React PDF renderer (not Puppeteer)
- Schema validation with Zod
- Custom styling: colors.ts, styles.ts, mark-renderers.ts
- Handles complex TipTap marks (bold, italic, links, mentions, etc.)

---

## 3. APPS/PROXY - Reverse Proxy (Caddy)

### 3.1 Purpose & Architecture

**Caddy HTTP server** = All requests route through single entry point

- SSL/TLS termination
- Request body size limits
- Reverse proxy to backend services
- Static file serving (MinIO S3)

### 3.2 Caddyfile Configuration

**File:** `Caddyfile.ce` (Community Edition config)

```
{$SITE_ADDRESS} {
  request_body { max_size {$FILE_SIZE_LIMIT} }

  redir /spaces /spaces/ permanent
  reverse_proxy /spaces/* space:3000          # Public/guest pages

  redir /god-mode /god-mode/ permanent
  reverse_proxy /god-mode/* admin:3000        # Instance admin panel

  reverse_proxy /live/* live:3000             # WebSocket collaboration

  reverse_proxy /api/* api:8000               # Django backend
  reverse_proxy /auth/* api:8000              # Auth endpoints (same backend)
  reverse_proxy /static/* api:8000            # Static files from Django

  reverse_proxy /{$BUCKET_NAME}/* plane-minio:9000  # S3-compatible storage

  reverse_proxy /* web:3000                   # Frontend (catch-all)
}
```

**Service Routing Summary:**
| Path | Service | Port | Purpose |
|------|---------|------|---------|
| `/spaces/` | space | 3000 | Public workspace/project pages |
| `/god-mode/` | admin | 3000 | Instance admin panel |
| `/live/` | live | 3000 | WebSocket collaboration |
| `/api/`, `/auth/` | api | 8000 | Django backend |
| `/static/` | api | 8000 | Django static assets |
| `/{BUCKET}` | minio | 9000 | S3-compatible file storage |
| `/` | web | 3000 | Frontend (React) |

**ACE Features:**

- Custom headers: X-Forwarded-For, X-Real-IP (trusted proxies)
- SSL/TLS via Let's Encrypt (configurable ACME_CA)
- File size limits per $FILE_SIZE_LIMIT
- Cert email via $CERT_EMAIL

---

## 4. CE (Community Edition) Patterns

### 4.1 Identified CE Overrides

No explicit `/ce/` directories in apps/api (unlike apps/web and apps/space).

**However, runtime features disabled/enabled via:**

- `ENABLE_DRF_SPECTACULAR` env var (controls OpenAPI docs)
- `ENABLE_READ_REPLICA` env var (PostgreSQL read replicas)
- Settings in `plane/settings/common.py`

### 4.2 License / Instance Control

**plane/license/** module provides:

- Instance-level admin APIs (InstanceAdminPermission)
- License validation logic
- Instance configuration helpers
- Email config retrieval for tasks

---

## 5. Key Architectural Patterns

### 5.1 Activity Tracking Pipeline

```
User Action → View Saves Model → Celery task fired with JSON payload
            → issue_activity.delay() with type, requested_data, current_instance, actor_id
            → issue_activities_task.py processes diffs
            → IssueActivity records created (field, old_value, new_value)
            → Notifications sent to subscribers
```

### 5.2 Soft Deletes & Logical Deletion

```python
class ProjectBaseModel(WorkspaceBaseModel):
    deleted_at = models.DateTimeField(null=True)  # Soft delete flag

    # Managers handle filtering automatically
    def delete(self):
        self.deleted_at = timezone.now()
        self.save()
```

### 5.3 Workspace/Project Scoping (Critical)

All views MUST filter by workspace slug:

```python
.filter(workspace__slug=self.kwargs.get("slug"))
```

### 5.4 N+1 Prevention

- Issue model has custom `issue_objects` manager with select_related/prefetch_related
- All views use `.select_related()` and `.prefetch_related()` for common relations

---

## 6. Technology Stack Summary

| Layer              | Technology                      |
| ------------------ | ------------------------------- |
| **Backend API**    | Django 4.2 + DRF 3.15           |
| **Database**       | PostgreSQL 15.7                 |
| **Cache**          | Redis/Valkey                    |
| **Task Queue**     | RabbitMQ + Celery               |
| **Realtime**       | Hocuspocus + Y.js (CRDT)        |
| **Live Server**    | Express.js + express-ws         |
| **Authentication** | Session (crum) + JWT + API Keys |
| **Proxy**          | Caddy HTTP server               |
| **File Storage**   | S3-compatible (MinIO)           |
| **PDF Export**     | React PDF (@react-pdf/renderer) |
| **Logging**        | Sentry + custom loggers         |

---

## 7. Key Takeaways

### API Layers (Critical Understanding)

- **v0 (plane/app):** Frontend internal API, session-based, no OpenAPI
- **v1 (plane/api):** Public API, API key/OAuth, full OpenAPI docs
- **Never mix serializers** between layers

### Recent Features Implemented

1. **Time Tracking (Worklog)** - Fully featured with daily limits, edit windows, reminders
2. **Module Activity** - Change tracking for modules
3. **Enhanced Modules** - Rich text descriptions, member assignment, status workflow
4. **HR Features** - Department, StaffProfile models + tasks

### Missing / Undiscovered

- **Opinions/Feedback** - Not found in codebase (future feature?)
- **User opinions on issues** - Could be tracked as IssueReaction or separate model

### Deployment Considerations

- Single Caddy proxy entry point with service routing
- Separate containers: api (Django), live (Node), web (React), space (React)
- MinIO for S3-compatible storage
- PostgreSQL + Redis for persistence and caching
- RabbitMQ for async tasks

---

## 8. File Paths (Key Reference)

### Django Backend

- **Models:** `/apps/api/plane/db/models/` (42 files)
- **Internal API (v0):** `/apps/api/plane/app/`
  - Views: `views/` (issue, workspace, module, cycle, etc.)
  - Serializers: `serializers/`
  - URLs: `urls/`
- **External API (v1):** `/apps/api/plane/api/`
  - Views: `views/` (separate implementations)
  - Serializers: `serializers/` (separate from v0)
  - URLs: `urls/`
- **Instance Admin:** `/apps/api/plane/license/`
- **Background Tasks:** `/apps/api/plane/bgtasks/` (42 task files)
- **Utilities:** `/apps/api/plane/utils/` (filters, exporters, permissions)

### Live Server

- **Source:** `/apps/live/src/`
- **Controllers:** `controllers/` (collaboration, document, pdf-export, health)
- **Services:** `services/` (api, user, page)
- **Extensions:** `extensions/` (database, redis, logger, title-sync)
- **Libraries:** `lib/` (auth, pdf, errors)

### Proxy

- **Caddy Config:** `/apps/proxy/Caddyfile.ce` (CE version)

---

**End of Report**
