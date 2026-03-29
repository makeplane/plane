# System Architecture

**Last Updated**: 2026-03-29
**Version**: 1.2.4
**Scope**: Production deployment architecture, data flows, real-time collaboration, SSO integration

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
│  │ - Custom dashboard CRUD + widget charts       │  │
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
│   ├── Department (1:N) - Hierarchical, max 5 levels
│   │   ├── manager → User (optional)
│   │   ├── linked_project → Project (optional)
│   │   └── parent → Department (self-referential, null=root)
│   ├── StaffProfile (1:1) - Employee record per workspace
│   │   ├── user → User
│   │   ├── department → Department (optional)
│   │   └── employment_status (active/probation/resigned/suspended/transferred)
│   ├── MainTaskCategory (1:N) - Instance-level task categories
│   │   └── SubTaskCategory (1:N)
│   ├── Project (1:N)
│   │   ├── ProjectMember (1:N) → User
│   │   ├── linked_department → Department (optional, for auto-sync)
│   │   ├── is_time_tracking_enabled (Boolean, default=True)
│   │   ├── Issue (1:N)
│   │   │   ├── IssueAssignee → User (M:N)
│   │   │   ├── IssueLabel → Label (M:N)
│   │   │   ├── IssueCycle → Cycle (1:1 soft)
│   │   │   ├── IssueModule → Module (1:1 soft)
│   │   │   ├── main_task_category → MainTaskCategory (optional)
│   │   │   ├── sub_task_category → SubTaskCategory (optional)
│   │   │   ├── IssueComment (1:N)
│   │   │   ├── IssueLink (1:N)
│   │   │   ├── IssueActivity (1:N)
│   │   │   └── IssueWorkLog (1:N) - Time tracking
│   │   ├── Cycle (1:N)
│   │   │   └── CycleIssue → Issue (M:N)
│   │   ├── Module (1:N)
│   │   │   └── ModuleIssue → Issue (M:N)
│   │   ├── Page (1:N)
│   │   │   └── PageVersion (1:N)
│   │   ├── State (1:N) - e.g., "To Do", "In Progress"
│   │   ├── Label (1:N)
│   │   ├── AnalyticsDashboard (1:N) - Pro feature
│   │   │   ├── AnalyticsDashboardWidget (1:N)
│   │   │   │   └── Widget config (charts, filters)
│   │   │   └── UserFavorite (M:N, annotated as is_favorite)
│   │   ├── Dashboard (1:N) - Custom dashboards
│   │   │   ├── DashboardWidget (1:N)
│   │   │   │   └── Widget config (chart type, metrics, layout)
│   │   │   └── UserFavorite (M:N, annotated as is_favorite)
│   │   ├── IssueView (saved filters)
│   │   └── UserFavorite (M:N, annotated as is_favorite on views)
│   └── Notifications → Notification
└── UserFavorite (M:N) → Multiple favoritable entities (dashboards, cycles, modules, etc.)
```

**UserFavorite Pattern** (shared across dashboards, views, pages, cycles, modules):

- Backend annotates `is_favorite=Exists(UserFavorite.objects.filter(...))` on list queries
- Frontend reads `is_favorite` boolean flag in API response
- Favorited items appear in sidebar Favorites section
- Uses optimistic updates with rollback on error

### Database Choice Rationale

**PostgreSQL 15.7 (Primary)**:

- ACID compliance for transactional data
- Complex queries (JOINs, window functions)
- Full-text search capabilities
- JSON data type for flexible fields
- 33 models covering entire domain (includes Department, StaffProfile)

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
  ├─ Magic Link
  │  └─ Email token → session
  └─ Swing SSO (Enterprise)
     ├─ Staff ID + Swing SSO login → session
     └─ Token flow from Swing portal → session
```

### Swing SSO Integration Flow

```
Option 1: Staff ID + Password via Swing SSO
  User enters Staff ID + password
    ↓
  Frontend → /auth/swing-sso/login
    ↓
  Backend validates via Swing SSO endpoint
    ↓
  Swing SSO returns user profile
    ↓
  Backend creates/updates user in DB
    ↓
  Session created → redirect to workspace

Option 2: Token-based from Swing Portal
  Swing portal generates signed XML token
    ↓
  User redirected to /auth/swing-sso/token
    ↓
  Backend validates XML signature
    ↓
  Backend parses user info from token
    ↓
  Backend creates/updates user in DB
    ↓
  Session created → redirect to workspace
```

**Config Keys** (environment):

- `IS_SWING_SSO_ENABLED` - Toggle SSO on/off (mutual exclusive with LDAP)
- `SWING_SSO_URL` - Swing SSO API endpoint
- `SWING_SSO_CLIENT_ID` - OAuth client ID
- `SWING_SSO_CLIENT_SECRET` - OAuth client secret
- `SWING_SSO_COMPANY_CODE` - Company identifier for multi-tenant Swing

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

**Head Office (HO) Access Control** (for multi-department organizations):

```
Instance Admin
  └─ Access all workspaces
     └─ View all issues across all departments

Department Manager
  ├─ Manage own department
  ├─ See assigned issues in managed dept
  └─ BFS traversal: Managers see descendants (sub-departments)
     └─ Useful for multi-level org hierarchies

Regular Members
  └─ Access per workspace/project role
```

**Implementation**: Permission classes in DRF check:

1. Is user workspace member?
2. Does user have required role?
3. Can user access resource?

### Workflow Enforcement (State Transitions & Approvals)

**Purpose**: Control which states an issue can move to and who can approve transitions.

**Workflow Master Toggle**:

- Each project has a `ProjectWorkflow` record with `is_live` boolean
- When `is_live=true`, enforce all workflow rules
- When `is_live=false`, all transitions allowed (backward compatibility)

**State-Level Restrictions**:

- `WorkflowStateConfig.allow_issue_creation` - Whether new issues can be created in a specific state
- HTTP 400 returned if issue creation attempted in restricted state
- Prevents issues "appearing" in end states (e.g., Done)

**Transition Rules**:

- `WorkflowTransition` defines allowed state paths (state → transition_state)
- Only transitions explicitly defined are permitted
- HTTP 403 returned for unauthorized transitions

**Approver-Level Control**:

- `WorkflowTransitionApprover` restricts who can perform a specific transition
- Can be empty (any project member), or limited to specific users
- HTTP 403 returned if current user not in approver list
- Frontend blocks drag-drop in Kanban with overlay; shows modal in other layouts

**Audit Trail**:

- `WorkflowActivity` logs all workflow config changes
- Tracks: field name, old_value, new_value, actor (who made change), timestamp
- Used for compliance and change history

**Frontend Enforcement**:

- Kanban view: Drag-drop blocked with visual overlay when transition disallowed
- Non-Kanban (List, Calendar, etc.): Modal prevents state change attempt
- Column headers show workflow indicator icon when workflow is active
- State info popup displays allowed transitions and required approvers

## Organizational Structure: Department & Staff Management

### Architecture Overview (Completed v1.2.3)

Department and Staff management has been migrated from workspace-scoped user interfaces to a centralized instance-admin layer (God-mode). The data models remain workspace-scoped, but administrative CRUD operations are now available only via the admin panel.

**Key Changes**:

1. **Data Models**: Department and StaffProfile remain workspace-scoped (no change)
2. **Admin Endpoints**: Moved to `/god-mode/` endpoints (managed via admin app)
3. **Workspace UI**: Department/Staff management pages removed from workspace settings
4. **Org Chart**: New read-only org chart page added at workspace level
5. **Auto-join Logic**: Celery task `sync_department_workspace_members` for bulk retroactive joins

### Department Model

**Hierarchical tree structure** supporting up to 6 levels:

| Field              | Type                      | Purpose                                |
| ------------------ | ------------------------- | -------------------------------------- |
| `workspace`        | FK → Workspace            | Scope (departments per workspace)      |
| `name`             | CharField(255)            | Full department name                   |
| `code`             | CharField(20)             | Department code (unique)               |
| `short_name`       | CharField(10, uppercase)  | Short code like "IT", "HR"             |
| `dept_code`        | CharField(4, 4 digits)    | Numeric department ID                  |
| `parent`           | Self-FK (nullable)        | Parent department (null = root)        |
| `level`            | PositiveSmallInt (1-6)    | Depth in hierarchy                     |
| `manager`          | FK → User (nullable)      | Department manager                     |
| `linked_project`   | FK → Project (nullable)   | Team project for auto-sync             |
| `is_active`        | Boolean                   | Department status                      |
| `linked_workspace` | FK → Workspace (nullable) | _(Legacy field for gradual migration)_ |
| `description`      | TextField                 | Department description                 |

**Key Constraints**:

- Unique per workspace: `(workspace, code)`, `(workspace, short_name)`, `(workspace, dept_code)`
- Circular parent prevention via clean() method
- Soft-delete support via `deleted_at` field
- Max 6 levels deep in hierarchy

**Admin API Endpoints** (God-mode):

- `GET /god-mode/departments/` - List all departments (filters: workspace, parent, level, is_active)
- `POST /god-mode/departments/` - Create department
- `GET /god-mode/departments/{id}/` - Retrieve department
- `PUT /god-mode/departments/{id}/` - Update department
- `DELETE /god-mode/departments/{id}/` - Soft delete department
- `GET /god-mode/departments/{id}/tree/` - Hierarchical tree view

**Workspace Org-Chart Endpoint**:

- `GET /api/v1/workspaces/{slug}/org-chart/` - Read-only organizational chart (nested JSON tree)

### StaffProfile Model

**Employee record** linked 1:1 to User, scoped per workspace:

| Field                   | Type                 | Purpose                                         |
| ----------------------- | -------------------- | ----------------------------------------------- |
| `workspace`             | FK → Workspace       | Scope to single workspace                       |
| `user`                  | ForeignKey → User    | Linked user account                             |
| `staff_id`              | CharField(8, unique) | Employee ID (unique per workspace)              |
| `department`            | FK → Department      | Current department (nullable)                   |
| `position`              | CharField(255)       | Job title                                       |
| `job_grade`             | CharField(50)        | Salary/level grade                              |
| `phone`                 | CharField(20)        | Contact phone                                   |
| `date_of_joining`       | DateField            | Hiring date                                     |
| `date_of_leaving`       | DateField            | Exit date (if applicable)                       |
| `employment_status`     | Choices (Enum)       | active/probation/resigned/suspended/transferred |
| `is_department_manager` | Boolean              | Department manager flag                         |
| `notes`                 | TextField            | Internal notes                                  |

**Employment Status Choices**:

- `active` - Currently employed
- `probation` - Probationary period
- `resigned` - Former employee
- `suspended` - Temporarily inactive
- `transferred` - Moved to different workspace

**Admin API Endpoints** (God-mode):

- `GET /god-mode/staff/` - List all staff (filters: workspace, department, employment_status)
- `POST /god-mode/staff/` - Create staff profile
- `GET /god-mode/staff/{id}/` - Retrieve staff profile
- `PUT /god-mode/staff/{id}/` - Update staff profile
- `DELETE /god-mode/staff/{id}/` - Soft delete staff profile
- `POST /god-mode/staff/{id}/transfer/` - Transfer to different department
- `POST /god-mode/staff/{id}/deactivate/` - Deactivate staff (removes WorkspaceMember roles, sets User.is_active=False)
- `POST /god-mode/staff/bulk-import/` - CSV/JSON bulk import
- `GET /god-mode/staff/export/` - Export to CSV
- `GET /god-mode/staff/stats/` - Count per department, status

**Auto-Join Logic**:

- **Trigger**: When department is first `linked_workspace=workspace_id`
- **Action**: Celery task `sync_department_workspace_members` runs async
  - Finds all staff in department and children departments
  - Adds WorkspaceMember records with role=15 (Member) for each user
  - Idempotent: skip if member already exists
- **Deactivation Workflow**:
  - Mark StaffProfile `employment_status="resigned"`
  - Removes corresponding WorkspaceMembers (where role=15 from auto-join)
  - Sets User.is_active=False across instance
  - Prevents login; user can request reactivation

### Frontend Admin Pages (God-mode)

**Admin App Routes**:

- `/god-mode/departments/` - List, create, edit, delete departments
- `/god-mode/departments/{id}/` - Detailed view with hierarchy tree
- `/god-mode/staff/` - List, create, edit, delete staff profiles
- `/god-mode/staff/{id}/` - Detailed view with department assignment

**Admin Stores**:

- `instance-department.store.ts` - MobX store for department CRUD + hierarchy
- `instance-staff.store.ts` - MobX store for staff CRUD + bulk import/export

### Frontend Workspace Pages

**Org-Chart Route** (Read-only):

- `/[workspaceSlug]/org-chart/` - Interactive organizational chart
  - Displays full department hierarchy
  - Shows staff members per department
  - Breadcrumb navigation
  - Empty state when no departments linked
  - No edit capabilities (admin-only via god-mode)

**Removed Routes** (Workspace Settings):

- `/[workspaceSlug]/(settings)/settings/departments/` - _(Moved to god-mode)_
- `/[workspaceSlug]/(settings)/settings/staff/` - _(Moved to god-mode)_

## Time Tracking (Work Logs)

**IssueWorkLog Model**: `duration_minutes` (1–720 min/day max), `logged_at` (no future dates, 7-day edit window), `logged_by` (creator; ADMIN-only edit/delete)

**Feature Flag**: `Project.is_time_tracking_enabled` gates all UI (sidebar nav, route, buttons, properties)

**Key Endpoints**:

- `GET/POST /api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/` - Issue-level CRUD
- `PATCH/DELETE /api/v1/.../worklogs/{id}/` - Update/delete (ADMIN, 7-day window)
- `GET /api/v1/.../worklogs/summary/` - Project/workspace summaries
- `GET /api/v1/.../timesheet-grid/` - Timesheet matrix (member × date)
- `POST /api/v1/.../bulk/` - Batch operations
- `POST /api/workspaces/{slug}/projects/{pid}/worklogs/export/` - Async CSV/XLSX export

**Celery Tasks**:

- `worklog_daily_reminder` (UTC 10:00) - Daily notification opt-in via `UserNotificationPreference.worklog_reminder`
- `worklog_export_task` - Generates archive, uploads to S3, tracks via `ExporterHistory`

See [`worklog-specification.md`](./worklog-specification.md) for comprehensive details.

## Scalability Patterns

**Horizontal Scaling**: Web, Admin, Space, Live, API are stateless; scale via replicas. Worker scales independently via Celery. Health checks: HTTP 200 on `/` (apps) or `/health` (API/Live).

**Caching Strategy** (4 layers):

1. Browser - Static assets with cache headers
2. CDN - Edge caching (optional)
3. Redis - Sessions, computed results, rate limiters
4. Database - ORM query caching (select_related/prefetch_related)

**Connection Pooling**:

- PostgreSQL: Default 5, max 1000, timeout 5s
- Redis: Enabled, max 50 connections

## Admin User Management System

**Frontend** (`apps/admin`): User list/create/detail pages with workspace assignment & password reset dialogs

**Backend** (`plane/license/api`): InstanceUserViewSet with CRUD + password reset + workspace assignment

**Authorization**: All instance endpoints use `InstanceAdminPermission` (checks `user.role >= 15`)

**Workflows**: Create user (auto-password), reset password, add to workspace, manage roles

## Admin Monitoring Dashboard (Phase 1)

Instance administrators monitor health, email delivery, and background jobs at `/monitoring` (role >= 15).

**Dashboard Tabs**:

1. **Email Logs** - Paginated EmailNotificationLog (50 items/page, filters: date range, entity type)
2. **Scheduled Jobs** - Celery PeriodicTask list (schedule, last run, run count)
3. **Worker Health** - Live Celery stats (active tasks, pool info, uptime), cached 30s, frontend auto-refreshes

**Backend Endpoints** (`plane/license/api/monitoring.py`):

- `EmailLogMonitoringEndpoint` - Paginated email logs with receiver/actor details
- `ScheduledJobMonitoringEndpoint` - Periodic task list
- `WorkerHealthMonitoringEndpoint` - Celery Inspect API query

**Permissions**: Instance admin only (`InstanceAdminPermission`)

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

**Logging**:

- HTTP requests: RequestLoggerMiddleware (method, path, status, duration, user_id, ip)
- API tokens: APITokenLogMiddleware (tracked in PostgreSQL + MongoDB)
- Application: Django (DEBUG/dev, WARNING/prod), Celery per-task

**Optional Integrations**: Sentry (errors), Scout APM (performance), PostHog (analytics), OpenTelemetry (tracing)

## Security Architecture

**TLS/HTTPS**: Caddy auto-provisions (Let's Encrypt), DNS: CloudFlare/DigitalOcean

**Request Validation**: Input (Zod), rate limiting (per user/IP), CSRF tokens, CORS whitelist

**Data Protection**: Password hashing (PBKDF2), session encryption, API tokens (hashed), HTML sanitization (nh3)

## Deployment Architecture

**Docker Compose** (single server): 13 services (web, admin, space, live, api, worker, beat, postgres, redis, rabbitmq, minio, proxy)

**Kubernetes**: Helm chart with StatefulSets (DB/storage), Deployments (stateless), HPA for scaling

## Performance Optimization

**Frontend**: Code splitting (React.lazy), tree-shaking, compression (gzip/brotli), images (webp), bundle <500KB

**Backend**: Query optimization (select_related/prefetch_related), indexing, pagination (20 items/page), compression, caching

**Infrastructure**: Load balancing (Caddy), connection pooling (DB/Redis), async tasks (Celery), multi-tier caching

---

**Last Updated**: 2026-03-29
**Version**: 1.2.4
**Lines**: 728
**Status**: Final (condensed to ≤800 LOC) | **Related**: `/docs/breaking-changes.md`, `/docs/worklog-specification.md`
