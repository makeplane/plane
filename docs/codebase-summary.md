# Plane.so Codebase Summary

**Last Updated**: 2026-03-29
**Version**: 1.2.4
**Structure**: pnpm + Turborepo monorepo

## Repository Overview

Plane.so is a comprehensive monorepo containing frontend applications, backend API, real-time collaboration server, and shared libraries. All packages use TypeScript for consistency.

```
plane.so/
├── apps/                 # Production applications (6 apps)
├── packages/             # Shared libraries (12+ packages)
├── deployments/          # Infrastructure & deployment configs
├── .claude/              # Claude Code configuration
├── docs/                 # Developer documentation
└── [Config files]
```

## Apps (6 Production Applications)

### 1. Web App (`apps/web/`)

**Purpose**: Main React SPA for workspace & project management
**Size**: ~2,074 files | ~300KB min bundle

| Component            | Details                                    |
| -------------------- | ------------------------------------------ |
| **Framework**        | React 18 + React Router v7 (SSR: disabled) |
| **Build Tool**       | Vite + TypeScript                          |
| **State Management** | MobX (33 stores)                           |
| **Styling**          | Tailwind CSS v4                            |
| **Entry Point**      | `app/entry.client.tsx`                     |
| **Routes**           | File-based routing in `app/routes/`        |

**Key Directories**:

- `app/` - React Router v7 app directory
- `core/store/` - 35 MobX domain stores (user, workspace, issue, cycle, module, analytics-dashboard, dashboard, etc.)
- `core/components/` - 50+ component directories (includes dashboards/, custom-dashboard/)
- `core/hooks/` - 50+ custom React hooks (includes use-analytics-dashboard, use-dashboard)
- `core/services/` - API integration layer (33+ service dirs, includes analytics-dashboard.service.ts, dashboard.service.ts)
- `core/layouts/` - Layout components

**Main Routes**:

- `/(home)` - Authentication & onboarding
- `/(all)/[workspaceSlug]/` - Main workspace hierarchy
- `[projectId]/` - Project-specific views (board, list, calendar, spreadsheet, gantt, timeline)
- `dashboards/` - Analytics Dashboard Pro feature (CRUD pages, widget configuration)
- `org-chart/` - Organizational chart (read-only hierarchy of departments & staff)

### 2. Admin App (`apps/admin/`)

**Purpose**: Instance administrator dashboard
**Size**: ~140 files | ~60KB min bundle

| Component            | Details                                    |
| -------------------- | ------------------------------------------ |
| **Framework**        | React 18 + React Router v7 (SSR: disabled) |
| **Build Tool**       | Vite + TypeScript                          |
| **State Management** | MobX (6 stores)                            |
| **Styling**          | Tailwind CSS v4                            |

**Features**: Instance config, OAuth setup, email settings, AI config, image settings, user management, department/staff management, monitoring

**Key Stores**: `instance`, `root`, `theme`, `user`, `workspace`, `instance-user`, `instance-department`, `instance-staff`

**User Management Feature**:

- Route: `/users` - List, create, detail pages
- Store: `instance-user.store.ts` - User CRUD state management
- Service: `instance-user.service.ts` - API integration
- Components: User list, create form, detail page, workspace assignment, password reset dialogs

**Department & Staff Management Feature**:

- Routes: `/departments`, `/staff` - List, create, detail, bulk import/export pages
- Stores:
  - `instance-department.store.ts` - Department CRUD + hierarchy management
  - `instance-staff.store.ts` - Staff CRUD + employment status management
- Services:
  - `packages/services/src/department/` - Department API integration
  - `packages/services/src/staff/` - Staff API integration
- Components: Department tree, staff table, bulk import modal, deactivation workflows

**Monitoring Feature** (Phase 1):

- Route: `/monitoring` - Dashboard with 3 tabs
- Store: Instance monitoring state (admin-only)
- Service: `instance/monitoring.service.ts` (packages/services)
- Tabs: Issue Email Logs (paginated, ~50/page), Scheduled Jobs (read-only list), Worker Health (live Celery worker stats, cached 30s)
- Backend: 3 read-only endpoints at `/god-mode/instances/monitoring/{email-logs,scheduled-jobs,worker-health}/`
- Data sources: EmailNotificationLog, django-celery-beat PeriodicTask, Celery Inspect API

### 3. Space App (`apps/space/`)

**Purpose**: Public sharing portal for workspaces/issues
**Size**: ~184 files | ~80KB min bundle

| Component            | Details                                   |
| -------------------- | ----------------------------------------- |
| **Framework**        | React 18 + React Router v7 (SSR: enabled) |
| **Build Tool**       | Vite + TypeScript (ssr: true)             |
| **State Management** | MobX (14 stores)                          |
| **Styling**          | Tailwind CSS v4                           |

**Routes**:

- `/:workspaceSlug/:projectId` - Public project views
- `/issues/:anchor` - Public issue view via anchor link

**Features**: Read-only issue browsing, public sharing, SSR for SEO

### 4. Live App (`apps/live/`)

**Purpose**: Real-time collaboration WebSocket server
**Size**: ~53 files | Node.js backend

| Component         | Details                                   |
| ----------------- | ----------------------------------------- |
| **Framework**     | Express.js + TypeScript (compiled to ESM) |
| **Real-time**     | Hocuspocus (Y.js CRDT)                    |
| **WebSocket**     | express-ws                                |
| **Message Queue** | Redis pub-sub for distributed sync        |
| **Build**         | tsdown (monorepo bundler)                 |

**Key Modules**:

- `src/hocuspocus.ts` - Hocuspocus server setup
- `src/extensions/` - 9 Hocuspocus extensions (database, logger, redis)
- `src/controllers/` - Request handlers
- `src/services/` - Business logic

**Features**: CRDT-based synchronization, PDF export, Redis-backed scaling

### 5. API App (`apps/api/`)

**Purpose**: Django REST API backend
**Size**: Large (Django project structure)

| Component     | Details                                    |
| ------------- | ------------------------------------------ |
| **Framework** | Django 4.2 + DRF 3.15                      |
| **Database**  | PostgreSQL 15.7 (primary) + MongoDB (logs) |
| **Async**     | Celery + RabbitMQ                          |
| **Cache**     | Redis/Valkey                               |
| **Storage**   | MinIO (S3-compatible)                      |

**Structure**:

- `plane/` - Main Django project
- `plane/settings/` - Django configuration (common, production, local, test)
- `plane/db/models/` - 33 model files (user, workspace, project, issue, cycle, module, page, analytics_dashboard, etc.)
- `plane/db/migrations/` - 120+ database migrations
- `plane/app/` - Legacy API v0 endpoints
- `plane/api/` - New API v1 endpoints (includes analytics_dashboard, user modules)
- `plane/authentication/` - OAuth + magic link auth + Swing SSO auth provider
- `plane/license/` - Instance admin features (user CRUD, workspace assignment)
- `plane/bgtasks/` - 36+ Celery background tasks

**Analytics Dashboard Backend** (`plane/api/analytics_dashboard.*`):

- Models: `AnalyticsDashboard`, `AnalyticsDashboardWidget` (soft-delete enabled)
- Views: Endpoints for CRUD operations + widget data aggregation
- Serializers: List, detail, create/update; dashboard responses include `is_favorite` (read-only)
- Permissions: `WorkSpaceAdminPermission` on all dashboard endpoints
- Features: Multi-dashboard management, 6 widget types, widget-level analytics filters, favorites via UserFavorite system
- Favorites: Backend annotates `is_favorite` on list queries; frontend displays in sidebar Favorites section

**Custom Dashboard Backend** (`plane/db/models/dashboard.py`, `plane/utils/dashboard_chart_aggregation.py`):

- Models: `Dashboard`, `DashboardWidget` (soft-delete enabled, project-scoped)
- Views: `/api/workspaces/{slug}/dashboards/` CRUD, `/widgets/` sub-endpoints, `/charts/` data aggregation
- Features: Custom dashboard creation, widget layout management (grid), chart type selection, metric aggregation, favorites via UserFavorite
- Utilities: `dashboard_chart_aggregation.py` handles data computation for charts (counts, metrics, grouping)
- Favorites: Same UserFavorite pattern as AnalyticsDashboard

**Admin User Management Backend** (`plane/license/api/user.*`):

- Views: `InstanceUserViewSet` - List (paginated), create, retrieve, update, reset password, add to workspace
- Serializers: User creation, detail, list with workspace info
- Permissions: Instance admin only
- Features: User CRUD, password reset, workspace assignment

**Admin Monitoring Backend** (`plane/license/api/monitoring.*`):

- Endpoints: 3 read-only monitoring endpoints (GET-only, paginated/cached, admin-only)
  - `EmailLogMonitoringEndpoint` - Issue email notification logs (paginated, 50/page, filters: date_from, date_to, entity_name)
  - `ScheduledJobMonitoringEndpoint` - Celery scheduled tasks (read-only, displays schedule, last_run, run_count)
  - `WorkerHealthMonitoringEndpoint` - Live Celery worker stats (cached 30s, shows active tasks, pool info, uptime)
- Serializers: Email logs with receiver/triggered_by details, scheduled job display metadata, worker stats
- Permissions: `InstanceAdminPermission` (role >= 15)
- Data sources: `EmailNotificationLog` model, `django-celery-beat.PeriodicTask`, Celery Inspect API

**API Versions**:

- `/api/` and `/api/v0/` - Legacy endpoints (under `plane.app`)
- `/api/v1/` - New endpoints (under `plane.api`) + analytics dashboard endpoints
- `/api/public/` - Public/shared space APIs
- `/auth/` - Authentication endpoints
- `/god-mode/instances/` - Admin instance endpoints (user management, monitoring, configuration)

### 6. Proxy App (`apps/proxy/`)

**Purpose**: Reverse proxy for routing requests
**Size**: ~5 files (config-based)

| Component      | Details                                                |
| -------------- | ------------------------------------------------------ |
| **Technology** | Caddy 2.10 reverse proxy                               |
| **Plugins**    | caddy-dns/cloudflare, caddy-dns/digitalocean, caddy-l4 |
| **Config**     | Caddyfile (declarative)                                |

**Routes**:

- `/spaces/*` → space:3000
- `/god-mode/*` → admin:3000
- `/live/*` → live:3000
- `/api/*` → api:8000
- `/auth/*` → api:8000
- `/{BUCKET_NAME}/*` → plane-minio:9000 (S3)
- `/*` → web:3000 (frontend)

### Time Tracking / Work Log Feature (v1.2.4)

**Backend**: IssueWorkLog model with issue-level CRUD endpoints. Project-level endpoints: worklogs list, analytics timesheet (week-grid), capacity heatmap + day details, CSV export. Cross-workspace timesheet shows ALL assigned issues. Capacity heatmap color-coded (green/yellow/red).

**Frontend**: 3 MobX stores (WorklogStore, ProjectWorklogStore, CEWorklogStore). 13 components: timesheet (5), analytics (4), capacity (4). Recharts donut charts (innerRadius 45%, 8-color palette). 11 new type interfaces. Route: `/:workspaceSlug/projects/:projectId/.../worklogs`

### Task Categories System (v1.2.4)

Instance-level 2-tier categorization (MainTaskCategory → SubTaskCategory). Models in `plane/db/models/task_category.py` (migrations 0158-0160). Issue model adds optional `main_task_category`, `sub_task_category` FK fields. Admin API: full CRUD at `/task-categories/main/`, `/task-categories/sub/`. Workspace API: read-only at `/workspaces/<slug>/task-categories/`. Frontend: TaskCategoryStore, task-category-property.tsx (2-tier dropdown), spreadsheet columns, i18n support.

### Head Office (HO) API (v1.2.4)

Cross-workspace issue management for multi-department organizations. Instance Admins see all workspaces; Department Managers see managed departments (BFS hierarchy traversal). `HoIssueListView`: 18-column read-only datasheet with filtering/sorting. `HoCategorySummaryView`: aggregated work item counts. Frontend: HoIssueStore, HoIssueService, 12 components, TanStack React Table. Endpoints: `/api/ho/issues/`, `/api/ho/category-summary/`. Access: admin app dashboard.

### Workspace Default Views (v1.2.4)

IssueView model `is_default` flag (migrations 0145-0146). Auto-seeded on workspace creation. Custom columns: bank-wide-project, project-lead, department, progress, completed-date, total-log-time, reference-link, project-name. Frontend: workspace-views page, default view selector, 8+ custom spreadsheet columns. Store enhancement: IssueViewStore with default view management.

## Packages (Shared Libraries)

### Core Type System

- **@plane/types** (116 files) - TypeScript definitions & interfaces (includes `analytics-dashboard.ts`: widget types, enums, interfaces for all dashboard/widget operations)

### Constants & Configuration

- **@plane/constants** (56 files) - Enums, config values, site metadata (includes `analytics-dashboard.ts`: widget type options, metric options, position configs, chart property mappings)

### Utilities

- **@plane/utils** (40+ modules)
  - String utilities (slugification, truncation, parsing)
  - Array utilities (filtering, grouping, sorting)
  - Color utilities (RGB/HEX conversion, contrast)
  - Date utilities (formatting, timezone handling)
  - File utilities (size formatting, validation)
  - Filter utilities (query builders, operators)

### API Integration

- **@plane/services** (55 files)
  - Axios wrapper with interceptors
  - Per-domain service layer (workspace, project, issue, cycle, etc.)
  - Authentication token handling
  - Error handling & retry logic

### React Hooks

- **@plane/hooks** (4 hooks)
  - `useHashScroll` - Hash-based scroll restoration
  - `useLocalStorage` - Persistent state management
  - `useOutsideClickDetector` - Click-outside detection
  - `usePlatformOS` - OS detection

### UI Component Libraries

#### Modern Library

- **@plane/propel** (386 files) - Modern UI component library
  - Built with Base UI, Recharts, Framer Motion
  - Successor to @plane/ui
  - Components: buttons, inputs, tables, charts, etc.

#### Legacy Library

- **@plane/ui** (126 files) - Legacy UI components
  - Being superseded by propel
  - Still in use in many parts of codebase

### Rich Text Editor

- **@plane/editor** (231 files)
  - Tiptap-based editor with real-time collaboration
  - Y.js integration for CRDT sync
  - Markdown support
  - Collaborative editing via Hocuspocus

### Internationalization (i18n)

- **@plane/i18n** (19 languages)
  - MobX + intl-messageformat integration
  - Supported: English, Spanish, French, German, Chinese, Japanese, Korean, etc.

### State Management

- **@plane/shared-state**
  - MobX store patterns with Zod validation
  - Type-safe state management

### Logging & Instrumentation

- **@plane/logger** - Winston logging middleware
- **@plane/decorators** - Express.js controller/route decorators

### Build & Configuration

- **@plane/tailwind-config** - Shared Tailwind CSS v4 config with CSS variables
- **@plane/typescript-config** - Shared TypeScript configs
  - base, nextjs, react-library, node-library variants
- **@plane/eslint-config** - Shared ESLint rules (9.0 flat config)

### Code Transformation

- **@plane/codemods** - jscodeshift-based code transformations for migrations

## Technology Stack Summary

| Layer                | Technology           | Key Packages                                  |
| -------------------- | -------------------- | --------------------------------------------- |
| **Frontend Build**   | Vite, TypeScript     | vite, @vitejs/plugin-react                    |
| **UI Framework**     | React 18             | react, react-dom, react-router-v7             |
| **State Management** | MobX                 | mobx, mobx-react, mobx-utils                  |
| **Styling**          | Tailwind CSS v4      | tailwindcss, postcss                          |
| **API Client**       | Axios + SWR          | axios, swr                                    |
| **Form Handling**    | React Hook Form      | react-hook-form (7.51.5)                      |
| **Tables**           | TanStack Table       | @tanstack/react-table (8.21.3)                |
| **Charts**           | Recharts             | recharts (2.12.7)                             |
| **Drag & Drop**      | Pragmatic DnD        | @atlaskit/pragmatic-drag-and-drop             |
| **Date Handling**    | date-fns             | date-fns (4.1.0)                              |
| **Theming**          | next-themes          | next-themes (0.4.6)                           |
| **Rich Text**        | Tiptap + Y.js        | @tiptap/core, y.js, yjs-protocols             |
| **Real-time**        | Hocuspocus           | @hocuspocus/server, y.js                      |
| **Backend**          | Django               | django (4.2.28), djangorestframework (3.15.2) |
| **Async**            | Celery               | celery (5.4.0), django-celery-beat            |
| **Database**         | PostgreSQL + MongoDB | psycopg (3.3.0), pymongo (4.6.3)              |
| **Cache**            | Redis                | redis (5.0.4), django-redis (5.4.0)           |
| **Message Queue**    | RabbitMQ             | amqp (via celery)                             |
| **Storage**          | MinIO (S3)           | boto3 (1.34.96), django-storages              |
| **Testing**          | Vitest               | vitest (4.0.8+)                               |

## Common Design Patterns

### UserFavorite Pattern

**Unified favorites system** (used for dashboards, views, pages, cycles, modules, projects):

**Backend**:

- `UserFavorite` model tracks user-favorited entities (polymorphic content type)
- List endpoints annotate `is_favorite=Exists(UserFavorite.objects.filter(user=request.user, entity=obj))`
- Returns read-only `is_favorite: boolean` in serialized responses

**Frontend**:

- MobX stores track favorite state in component state
- Sidebar displays favorited items in dedicated "Favorites" section
- Uses optimistic updates: update UI immediately, rollback on API error (same pattern as Views)

**Applied to**:

- AnalyticsDashboard (is_favorite in list API)
- IssueView (is_favorite in list API)
- Page (is_favorite in list API)
- Cycle, Module, Project (via app/views, is_favorite annotated)

## File Organization Patterns

### Frontend Apps

```
apps/[app]/
├── app/                 # React Router v7 app directory
│   ├── (route-group)/   # Grouped routes
│   ├── components/      # Page-level components
│   ├── error.tsx        # Error boundary
│   ├── not-found.tsx    # 404 page
│   ├── root.tsx         # Root layout
│   └── entry.client.tsx # Client entry
├── core/
│   ├── store/          # MobX stores (domain models)
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service layer
│   ├── layouts/        # Common layouts
│   ├── lib/            # Utility functions
│   ├── constants/      # App constants
│   └── types/          # Local type definitions
├── ce/                 # Community Edition overrides
├── ee/                 # Enterprise Edition features
├── styles/             # Global CSS
└── public/             # Static assets
```

### Backend (Django)

```
apps/api/
├── plane/              # Main Django package
│   ├── settings/       # Configuration
│   ├── middleware/     # Global middleware
│   ├── authentication/ # Auth system
│   ├── app/            # Legacy v0 APIs
│   ├── api/            # New v1 APIs
│   ├── db/
│   │   ├── models/     # 31 model files
│   │   └── migrations/ # 120+ migrations
│   ├── bgtasks/        # 36+ Celery tasks
│   └── utils/          # Utilities
├── requirements/       # Dependency specs
└── bin/               # Docker entrypoints
```

## Key Statistics

| Metric                     | Value                                                          |
| -------------------------- | -------------------------------------------------------------- |
| Frontend Apps              | 4 (web, admin, space, live)                                    |
| Backend Apps               | 2 (api, proxy)                                                 |
| Shared Packages            | 12+                                                            |
| Total Files (approx)       | 3,200+                                                         |
| Database Models            | 39 (adds MainTaskCategory, SubTaskCategory)                    |
| Django Migrations          | 163+ (adds 0158-0160 task categories, 0145-0146 default views) |
| Celery Tasks               | 36+                                                            |
| MobX Stores (web)          | 38 (adds TaskCategoryStore, CEWorklogStore, HoIssueStore)      |
| MobX Stores (admin)        | 5                                                              |
| MobX Stores (space)        | 14                                                             |
| API v0 Modules             | 18 URL modules                                                 |
| API v1 Modules             | 28 URL modules (adds task-categories, HO endpoints)            |
| Admin API Modules          | 5 (includes task-categories admin CRUD)                        |
| Time-tracking Components   | 13 (timesheet, analytics, capacity)                            |
| Supported Languages (i18n) | 19                                                             |
| Docker Compose Services    | 13                                                             |
| Deployment Methods         | 4                                                              |

## Dependency Management

**Package Manager**: pnpm 10.24+
**Workspace Configuration**: `pnpm-workspace.yaml`

**Monorepo Benefits**:

- Shared types via @plane/\* packages
- Consistent tooling (ESLint, TypeScript, Tailwind)
- Unified version management
- Efficient CI/CD with Turborepo

**Build System**: Turborepo 2.6+

- Parallel builds across packages
- Incremental builds with caching
- Cross-workspace dependency tracking

## Development Environment

**Node.js**: 18+ LTS recommended
**Python**: 3.9+ (for Django backend)
**Package Manager**: pnpm (preferred)

**Key Scripts** (from root package.json):

- `pnpm install` - Install all dependencies
- `pnpm build` - Build all packages
- `pnpm dev` - Start development servers
- `pnpm check:lint` - Run ESLint
- `pnpm fix:lint` - Auto-fix ESLint issues
- `pnpm test` - Run tests (Vitest)

**Docker Support**:

- Multi-stage builds for optimized images
- Services defined in `deployments/cli/community/docker-compose.yml`

## Deployment Artifacts

**Docker Images**:

- `plane-frontend` - apps/web built image
- `plane-admin` - apps/admin built image
- `plane-space` - apps/space built image
- `plane-live` - apps/live built image
- `plane-backend` - apps/api + Celery workers
- `plane-proxy` - apps/proxy (Caddy)

**Deployment Methods**:

- Docker Compose (single server)
- Docker Swarm (cluster)
- Kubernetes + Helm (cloud-native)
- All-in-One (single container)

---

### Swing SSO Authentication

**Backend** (`plane/authentication/provider/credentials/`):

- `swing_sso.py` - Swing SSO provider (magic link, staff ID login, mutual exclusive with LDAP)
- `swing_sso_token.py` - Swing SSO token flow (XML redirect from Swing portal)
- Config keys: IS_SWING_SSO_ENABLED, SWING_SSO_URL, SWING_SSO_CLIENT_ID, SWING_SSO_CLIENT_SECRET, SWING_SSO_COMPANY_CODE
- Views: Auth endpoints for login, callback, token validation
- Admin UI: God-mode config page with toggle, form, test auth modal

**Frontend** (`apps/web/`):

- Staff ID login with Swing SSO branch
- Login form variant for Swing SSO flow
- Token SSO redirect flow handling

---

### Priority System (v1.2.3)

**Backend Models** (`plane/db/models/`):

- **Issue.PRIORITY_CHOICES**: `(urgent, high, medium, low)` - 4 levels (removed "none")
- **Default**: `priority="medium"` in Issue, IssueVersion, DraftIssue models
- **Migration 0131**: `migrate_none_priority_to_medium.py` - Updates all existing `priority="none"` → `"medium"` in Issue, IssueVersion, DraftIssue tables

**Backend Utilities** (`plane/utils/`):

- `order_queryset.py`: `PRIORITY_ORDER = ["urgent", "high", "medium", "low"]`
- `grouper.py`: Priority grouping returns 4 levels
- `analytics_plot.py`: Priority ordering excludes "none"
- `filters/converters.py`: `DEFAULT_VALID_CHOICES["priority"]` = 4 levels only
- Requests filtering by `priority=none` return HTTP 400

**Frontend Types** (`packages/types/`):

- **TIssuePriorities**: Still includes "none" for type safety (edge case backward compatibility)
- **PriorityIcon**: Component continues supporting "none" (won't be called post-migration)

**Frontend Constants** (`packages/constants/`):

- `PRIORITY_OPTIONS = ["urgent", "high", "medium", "low"]` - 4 options, no "none"
- Priority dropdown selectors removed "none" option

**Data Migration**:

- Migration command: `python manage.py migrate db` (runs 0131 automatically)
- All database "none" values converted to "medium" in one atomic transaction
- Irreversible migration (no reverse path)

### Workflow Enforcement Feature

**Backend Models** (`plane/db/models/workflow.py`):

- **ProjectWorkflow** - Master toggle for workflow enforcement (is_live boolean per project)
- **WorkflowStateConfig** - Per-state configuration for whether new issues can be created in a state
- **WorkflowTransition** - Defines allowed state transitions (state → transition_state)
- **WorkflowTransitionApprover** - Restricts who can perform specific transitions (user-level authorization)
- **WorkflowActivity** - Audit log for workflow configuration changes (field, old_value, new_value, actor)
- **Migration 0133**: `0133_workflow_models.py` - Creates all 5 models with unique constraints

**Backend API Endpoints** (`plane/app/views/workflow.py` and `plane/app/urls/workflow.py`):

- `GET /api/workspaces/{slug}/workflow-states/?project_id={id}` - List state configs (flat dict by state UUID)
- `PATCH /api/workspaces/{slug}/workflow-states/{state_id}/` - Update allow_issue_creation flag
- `GET /api/workspaces/{slug}/projects/{id}/workflow/` - Fetch project workflow master toggle
- `PATCH /api/workspaces/{slug}/projects/{id}/workflow/` - Toggle is_live flag
- `POST /api/workspaces/{slug}/projects/{id}/workflow/reset/` - Reset workflow to defaults
- `GET /api/workspaces/{slug}/projects/{id}/workflow/activity/` - Fetch audit log
- `POST /api/workspaces/{slug}/projects/{id}/workflow-transitions/` - Create state transition
- `DELETE /api/workspaces/{slug}/projects/{id}/workflow-transitions/{id}/` - Delete transition
- `POST /api/workspaces/{slug}/projects/{id}/workflow-transitions/{id}/approvers/` - Add approver to transition
- `DELETE /api/workspaces/{slug}/projects/{id}/workflow-transitions/{id}/approvers/{id}/` - Remove approver

**Enforcement** (`plane/app/views/issue/issue.py` - IssueViewSet):

- HTTP 403: Unauthorized state transition (transition not allowed or user not in approver list)
- HTTP 400: Issue creation in restricted state (WorkflowStateConfig.allow_issue_creation = false)
- Checks `ProjectWorkflow.is_live` before applying restrictions

**Frontend Store** (`apps/web/ce/store/workflow.store.ts`):

- **WorkflowStore** - MobX store managing workflow state per project
- Observable: `workflowByProject` (map of project ID to workflow data), `blockerModal` (UI state)
- Actions: `fetchWorkflow()`, `updateIsLive()`, `updateStateConfig()`, `addTransition()`, `removeTransition()`, `addApprovers()`, `removeApprover()`, `resetWorkflow()`, `fetchActivity()`
- Helpers: `isLive()`, `isTransitionAllowed()`, `getTransitionReviewers()`
- Blocker modal methods: `openBlockerModal()`, `closeBlockerModal()`

**Frontend Service** (`apps/web/ce/services/workflow.service.ts`):

- `getWorkflowStates()`, `getProjectWorkflow()`, `updateProjectWorkflow()`
- `updateWorkflowStateConfig()`, `addTransition()`, `deleteTransition()`
- `addApprover()`, `deleteApprover()`, `resetWorkflow()`, `getWorkflowActivity()`

**Frontend Components** (`apps/web/ce/components/`):

- **workflow-disabled-overlay.tsx** - Kanban drag-block overlay when drag blocked
- **workflow-disabled-message.tsx** - Message shown when workflow is disabled on drop
- **workflow-drag-blocker-card.tsx** - Blocker card UI in Kanban
- **workflow-blocker-modal.tsx** - Modal shown in non-Kanban layouts to prevent transition
- **workflow-state-info-popup.tsx** - Popup showing transition rules and approvers
- **workflow-indicator-icon.tsx** - Icon displayed on column headers showing workflow active
- **projects/settings/workflows/workflow-state-card.tsx** - UI for state config editing
- **workflow/use-workflow-drag-n-drop.ts** - Hook for drag-drop blocking logic
- **workflow/workflow-group-tree.tsx** - Tree view of workflow transitions

**Frontend Route**:

- `/settings/projects/{projectId}/workflows` - Settings page for configuring workflow states, transitions, and approvers

**CE Pattern**: All workflow code isolated in `apps/web/ce/` and `apps/api/plane/` (no core modifications)

---

### Opinion Removal Feature (v1.2.4)

**Deprecated**: Opinion model completely removed.

**Removed Models**:

- Opinion (formerly tracked opinion data on issues)
- All related API endpoints

**Migrations**:

- Migration 0134: `0134_remove_opinion_feature.py` - Drops opinion tables

**Frontend Changes**:

- Opinion component removed from issue detail sidebar
- Opinion API service methods deleted
- No backward compatibility (feature removed entirely)

---

### Due Date Change Reason Tracking (v1.2.4)

**Backend**:

- New optional `reason` field in issue update API
- Required when updating `target_date` or `completed_at`
- Stored in IssueActivity for audit trail
- Migration 0135: Adds reason column to issue-related tables

**API Changes**:

- PATCH `/api/v1/issues/{id}/` accepts reason in body
- Reason logged in activity stream with timestamp and actor

---

### Spreadsheet Enhancements (v1.2.4)

**Frontend Components** (`apps/web/core/components/spreadsheet/`):

- Non-sortable columns support in spreadsheet config
- Sort order key handling: Fixed column reordering logic
- Custom field rendering: Enhanced type support in spreadsheet cells

**API Changes**:

- Spreadsheet column metadata includes `is_sortable` flag
- GET `/api/v1/projects/{id}/views/{viewId}/` returns enhanced metadata

---

### Module Activity Tracking (v1.2.4)

**Backend Model** (`plane/db/models/module-activity.py`):

- New `ModuleActivity` model logs all module changes
- Fields: module (FK), change_type (create/update/delete), field, old_value, new_value, actor, timestamp
- Related name: `module.activities`

**Backend API**:

- Endpoint: GET `/api/v1/projects/{id}/modules/{id}/activity/`
- Returns paginated activity stream with actor details
- Filters: date_from, date_to, change_type

**Frontend**:

- Module detail page: Activity tab displays changes
- Activity rendering: Shows field diffs with before/after values
- MobX store: `module.store.ts` caches activity data with pagination

---

### Default View Per Project (v1.2.4)

**Backend Model** (`plane/db/models/project.py`):

- Field: `default_view` (FK to IssueView, nullable)
- Tracks workspace's preferred view for this project
- Auto-updated when view is marked as default

**Frontend**:

- Project settings: Default view dropdown selector
- Project board: Breadcrumb respects default_view per project
- Project lead display: Enhanced in project list views

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/codebase-summary.md`
**Lines**: ~730
**Status**: Updated with v1.2.4 features (opinion removal, due date reasons, spreadsheet enhancements, module activity)
