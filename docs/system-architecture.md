# System Architecture

**Last Updated**: 2026-03-02
**Version**: 1.2.3
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
│   ├── Project (1:N)
│   │   ├── ProjectMember (1:N) → User
│   │   ├── linked_department → Department (optional, for auto-sync)
│   │   ├── is_time_tracking_enabled (Boolean, default=True)
│   │   ├── Issue (1:N)
│   │   │   ├── IssueAssignee → User (M:N)
│   │   │   ├── IssueLabel → Label (M:N)
│   │   │   ├── IssueCycle → Cycle (1:1 soft)
│   │   │   ├── IssueModule → Module (1:1 soft)
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

### Department Model

**Hierarchical tree structure** supporting up to 5 levels:

| Field            | Type                     | Purpose                           |
| ---------------- | ------------------------ | --------------------------------- |
| `workspace`      | FK → Workspace           | Scope (departments per workspace) |
| `name`           | CharField(255)           | Full department name              |
| `code`           | CharField(20)            | Department code (unique)          |
| `short_name`     | CharField(10, uppercase) | Short code like "IT", "HR"        |
| `dept_code`      | CharField(4, 4 digits)   | Numeric department ID             |
| `parent`         | Self-FK (nullable)       | Parent department (null = root)   |
| `level`          | SmallIntField (1-5)      | Depth in hierarchy                |
| `manager`        | FK → User (nullable)     | Department manager                |
| `linked_project` | FK → Project (nullable)  | Team project for auto-sync        |
| `is_active`      | Boolean                  | Department status                 |

**Key Constraints**:

- Unique per workspace: `(workspace, code)`, `(workspace, short_name)`, `(workspace, dept_code)`
- Circular parent prevention in `.clean()` method
- Soft-delete support via `deleted_at` field

**API Endpoints**:

- `GET /api/v1/workspaces/{slug}/departments/` - List (filters: parent, level, is_active)
- `POST /api/v1/workspaces/{slug}/departments/` - Create
- `GET /api/v1/workspaces/{slug}/departments/tree/` - Hierarchical tree (nested JSON)
- `GET /api/v1/workspaces/{slug}/departments/{id}/` - Retrieve
- `PUT /api/v1/workspaces/{slug}/departments/{id}/` - Update
- `DELETE /api/v1/workspaces/{slug}/departments/{id}/` - Soft delete

### StaffProfile Model

**Employee record** linked 1:1 to User, scoped per workspace:

| Field                   | Type                 | Purpose                                         |
| ----------------------- | -------------------- | ----------------------------------------------- |
| `workspace`             | FK → Workspace       | Scope to single workspace                       |
| `user`                  | OneToOne → User      | Linked user account                             |
| `staff_id`              | CharField(8, unique) | Employee ID (unique per workspace)              |
| `department`            | FK → Department      | Current department (nullable)                   |
| `position`              | CharField(255)       | Job title                                       |
| `job_grade`             | CharField(50)        | Salary/level grade                              |
| `phone`                 | CharField(20)        | Contact phone                                   |
| `date_of_joining`       | DateField            | Hiring date                                     |
| `date_of_leaving`       | DateField            | Exit date (if applicable)                       |
| `employment_status`     | Choices              | active/probation/resigned/suspended/transferred |
| `is_department_manager` | Boolean              | Auto-join children projects                     |
| `notes`                 | TextField            | Internal notes                                  |

**Employment Status Choices**:

- `active` - Currently employed
- `probation` - Probationary period
- `resigned` - Former employee
- `suspended` - Temporarily inactive
- `transferred` - Moved to different workspace

**Auto-Sync Feature**:

- When staff marked as department manager: automatically added to linked_project and child departments' projects
- Reverse: when removed from department, auto-removed from project (if last department affiliation)

**API Endpoints**:

- `GET /api/v1/workspaces/{slug}/staff/` - List (filters: department, employment_status)
- `POST /api/v1/workspaces/{slug}/staff/` - Create
- `GET /api/v1/workspaces/{slug}/staff/{id}/` - Retrieve
- `PUT /api/v1/workspaces/{slug}/staff/{id}/` - Update
- `DELETE /api/v1/workspaces/{slug}/staff/{id}/` - Soft delete
- `POST /api/v1/workspaces/{slug}/staff/{id}/transfer/` - Transfer to different department
- `POST /api/v1/workspaces/{slug}/staff/{id}/deactivate/` - Set employment_status to resigned
- `POST /api/v1/workspaces/{slug}/staff/bulk-import/` - CSV/JSON bulk import
- `GET /api/v1/workspaces/{slug}/staff/export/` - Export to CSV
- `GET /api/v1/workspaces/{slug}/staff/stats/` - Count per department, status

**Frontend Components** (Workspace Settings):

- **Department Management** - Create, edit, delete, reorder, view hierarchy
- **Staff Management** - CRUD staff, assign departments, manage status
- **Bulk Import/Export** - Import employees from CSV, export staff list
- **Dashboard** - Staff count, active/inactive ratio per department

**Frontend Routes**:

- `/[workspaceSlug]/(settings)/settings/departments/` - Department tree UI
- `/[workspaceSlug]/(settings)/settings/staff/` - Staff table + management

## Time Tracking (Work Logs)

See [`worklog-specification.md`](./worklog-specification.md) for comprehensive validation rules, API details, and feature flag gating.

### Quick Reference

**IssueWorkLog Model**:

- `duration_minutes`: 1–1440 min per entry, max 720 min per user per day
- `logged_at`: No future dates, within 7 working days (Mon–Fri) of today
- `logged_by`: Team member; ADMIN-only edit/delete with 7-day edit window

**Key Constraints**: 12h/day limit (720 min), 7-day edit window (ADMIN only), feature flag per project, daily reminder opt-in

**Project Flag**:

### Feature Flag Gating

All time tracking UI is gated behind `is_time_tracking_enabled`:

| Component             | Gating Method                                       | Behavior                       |
| --------------------- | --------------------------------------------------- | ------------------------------ |
| **Sidebar nav**       | `shouldRender: !!project?.is_time_tracking_enabled` | Menu item hidden when disabled |
| **Route guard**       | `time-tracking/layout.tsx` check                    | Direct URL shows EmptyState    |
| **"Log Time" button** | Check in `worklog-create-button.tsx`                | Shows info popup when disabled |
| **Worklog property**  | Component unmount when disabled                     | Removed from issue sidebar     |

**Backend enforcement** (independent of frontend):

- API returns 400 error if worklog create attempted on disabled project
- ViewSet checks `is_time_tracking_enabled` before allowing operations

### API Endpoints (Core)

| Endpoint                                                               | Method | Purpose                                         |
| ---------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `/api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/`      | GET    | List worklogs for issue                         |
| `/api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/`      | POST   | Create worklog entry                            |
| `/api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/` | PATCH  | Update worklog (ADMIN, 7-day window)            |
| `/api/v1/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/` | DELETE | Delete worklog (ADMIN, 7-day window)            |
| `/api/v1/workspaces/{slug}/projects/{pid}/worklogs/summary/`           | GET    | Project summary (by member/issue)               |
| `/api/v1/workspaces/{slug}/time-tracking/summary/`                     | GET    | Workspace summary                               |
| `/api/v1/workspaces/{slug}/time-tracking/timesheet-grid/`              | GET    | Timesheet matrix (member × date)                |
| `/api/v1/workspaces/{slug}/time-tracking/bulk/`                        | POST   | Batch create/update/delete                      |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/`                      | GET    | List project worklogs with pagination & filters |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/export/`               | POST   | Trigger async worklog export (CSV/XLSX)         |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/export/`               | GET    | List export history for project                 |

### Celery Tasks

**Daily Reminder**:

- **Task**: `worklog_daily_reminder` (UTC 10:00)
- Targets users in time-tracking-enabled projects who haven't logged today
- Opt-out via `UserNotificationPreference.worklog_reminder`

**Export Task**:

- **Task**: `worklog_export_task` — generates CSV/XLSX archive with optional filters
- Status: `queued` → `processing` → `completed` / `failed`
- Output uploaded to S3 with presigned URL (7-day validity)

### Worklog Pagination & Export

| Endpoint                                                 | Method | Purpose                                                                                |
| -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/`        | GET    | List with pagination, filters (member_id, issue_id, date range), ordered by -logged_at |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/export/` | POST   | Trigger async CSV/XLSX export                                                          |
| `/api/workspaces/{slug}/projects/{pid}/worklogs/export/` | GET    | List export history with download URLs                                                 |

## Scalability Patterns

### Horizontal Scaling

**Stateless Components** (scale via replicas):

| Component    | Role          | Replicas        | Health Check        |
| ------------ | ------------- | --------------- | ------------------- |
| Web (3000)   | Frontend SPA  | WEB_REPLICAS    | HTTP 200 on /       |
| Admin (3000) | Admin SPA     | ADMIN_REPLICAS  | HTTP 200 on /       |
| Space (3000) | Public portal | SPACE_REPLICAS  | HTTP 200 on /       |
| Live (3000)  | WebSocket     | LIVE_REPLICAS   | HTTP 200 on /health |
| API (8000)   | REST server   | API_REPLICAS    | HTTP 200 on /health |
| Worker       | Celery tasks  | WORKER_REPLICAS | (managed by Celery) |

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

## Admin User Management System

Instance administrators can manage users and workspace assignments via admin app.

**Frontend** (`apps/admin`): User list, create form, detail view with workspace assignment & password reset dialogs

**Backend** (`plane/license/api`): InstanceUserViewSet with CRUD + password reset + workspace assignment endpoints

**Workflows**: Create user (auto-generate password), reset password, add user to workspace, manage workspace roles

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

**Last Updated**: 2026-03-04
**Status**: Final | **Related**: `/docs/breaking-changes.md`
