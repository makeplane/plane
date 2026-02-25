# Plane.so Codebase Summary

**Last Updated**: 2026-02-18
**Version**: 1.2.2
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
- `core/store/` - 33 MobX domain stores (user, workspace, issue, cycle, module, analytics-dashboard, etc.)
- `core/components/` - 50+ component directories (includes dashboards/)
- `core/hooks/` - 49+ custom React hooks (includes use-analytics-dashboard)
- `core/services/` - API integration layer (31+ service dirs, includes analytics-dashboard.service.ts)
- `core/layouts/` - Layout components

**Main Routes**:

- `/(home)` - Authentication & onboarding
- `/(all)/[workspaceSlug]/` - Main workspace hierarchy
- `[projectId]/` - Project-specific views (board, list, calendar, spreadsheet, gantt, timeline)
- `dashboards/` - Analytics Dashboard Pro feature (CRUD pages, widget configuration)

### 2. Admin App (`apps/admin/`)

**Purpose**: Instance administrator dashboard
**Size**: ~109 files | ~50KB min bundle

| Component            | Details                                    |
| -------------------- | ------------------------------------------ |
| **Framework**        | React 18 + React Router v7 (SSR: disabled) |
| **Build Tool**       | Vite + TypeScript                          |
| **State Management** | MobX (5 stores - minimal)                  |
| **Styling**          | Tailwind CSS v4                            |

**Features**: Instance config, OAuth setup, email settings, AI config, image settings

**Key Stores**: `instance`, `root`, `theme`, `user`, `workspace`

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
- `plane/api/` - New API v1 endpoints (includes analytics_dashboard module)
- `plane/authentication/` - OAuth + magic link auth
- `plane/bgtasks/` - 36+ Celery background tasks

**Analytics Dashboard Backend** (`plane/api/analytics_dashboard.*`):

- Models: `AnalyticsDashboard`, `AnalyticsDashboardWidget` (soft-delete enabled)
- Views: Endpoints for CRUD operations + widget data aggregation
- Serializers: List, detail, create/update; dashboard responses include `is_favorite` (read-only)
- Permissions: `WorkSpaceAdminPermission` on all dashboard endpoints
- Features: Multi-dashboard management, 6 widget types, widget-level analytics filters, favorites via UserFavorite system
- Favorites: Backend annotates `is_favorite` on list queries; frontend displays in sidebar Favorites section

**API Versions**:

- `/api/` and `/api/v0/` - Legacy endpoints (under `plane.app`)
- `/api/v1/` - New endpoints (under `plane.api`) + analytics dashboard endpoints
- `/api/public/` - Public/shared space APIs
- `/auth/` - Authentication endpoints

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

### Time Tracking / Work Log Feature

**Backend**:

- **IssueWorkLog Model** (`plane/db/models/worklog.py`)
  - Tracks time logged by members on issues
  - Fields: `issue` (FK), `logged_by` (FK), `duration_minutes` (int), `description` (text), `logged_at` (date)
  - Indexes on `(issue, logged_by)` and `(project, logged_at)` for performance
  - Related name: `issue.issue_worklogs`

- **Issue.estimate_time Field** (`plane/db/models/issue.py`)
  - New PositiveIntegerField on Issue model
  - Stores time estimate in minutes
  - Nullable field for optional usage

- **Project.is_time_tracking_enabled Flag** (`plane/db/models/project.py`)
  - Boolean field defaulting to `True`
  - Controls worklog feature availability per project

- **IssueWorkLogViewSet** (`plane/app/views/issue/worklog.py`)
  - CRUD endpoints with permission checks (ROLE.ADMIN, ROLE.MEMBER)
  - `create`, `partial_update`, `destroy` actions
  - Checks `is_time_tracking_enabled` before allowing operations
  - Logs worklog activities via `issue_activity.delay()`

**Frontend**:

- **WorklogStore** (`apps/web/core/store/worklog.store.ts`)
  - MobX store managing worklog state per issue
  - Methods: `fetchWorklogs()`, `createWorklog()`, `updateWorklog()`, `deleteWorklog()`, `fetchProjectSummary()`
  - Helpers: `getWorklogsForIssue()`, `getTotalMinutesForIssue()`
  - Optimistic updates with rollback on error

- **WorklogService** (`apps/web/core/services/worklog.service.ts`)
  - API integration layer for worklog endpoints
  - Methods: `listWorklogs()`, `createWorklog()`, `updateWorklog()`, `deleteWorklog()`, `getProjectSummary()`

- **Components**:
  - **WorklogModal** - Modal for creating/editing worklogs
  - **IssueWorklogProperty** - Displays worklog data on issue detail
  - **TimeTrackingReportPage** - Project-level time tracking report with filters/summary/table

- **Route**: `/:workspaceSlug/projects/:projectId/time-tracking`
  - Located in `(detail)/[projectId]/time-tracking/`
  - Page component displays `TimeTrackingReportPage`

- **Sidebar Nav**: "Time Tracking" sidebar item under project navigation

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

- **@plane/i18n** (3 strictly supported languages)
  - MobX + intl-messageformat integration
  - Supported: English (`en`), Vietnamese (`vi`), Korean (`ko`)
  - Rule: All 3 locales MUST be updated simultaneously.

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

| Metric                     | Value                       |
| -------------------------- | --------------------------- |
| Frontend Apps              | 4 (web, admin, space, live) |
| Backend Apps               | 2 (api, proxy)              |
| Shared Packages            | 12+                         |
| Total Files (approx)       | 3,100+                      |
| Database Models            | 34 (includes IssueWorkLog)  |
| Django Migrations          | 120+                        |
| Celery Tasks               | 36+                         |
| MobX Stores (web)          | 34 (includes WorklogStore)  |
| MobX Stores (admin)        | 5                           |
| MobX Stores (space)        | 14                          |
| API v0 Modules             | 18 URL modules              |
| API v1 Modules             | 25 URL modules              |
| Supported Languages (i18n) | 3 (en, vi, ko)              |
| Docker Compose Services    | 13                          |
| Deployment Methods         | 4                           |

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

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/codebase-summary.md`
**Lines**: ~520
**Status**: Updated with Time Tracking feature
