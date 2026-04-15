# Codebase Summary: Plane Monorepo

## Directory Structure

```
plane/
├── apps/
│   ├── web/              # Main React frontend (3000)
│   │   ├── core/         # Upstream code (never modify)
│   │   │   ├── components/   # Shared React components (51 dirs)
│   │   │   ├── hooks/        # Custom React hooks (47 hooks)
│   │   │   ├── layouts/      # App layouts
│   │   │   ├── store/        # MobX stores (33+)
│   │   │   └── services/     # API clients (30+)
│   │   ├── ce/           # Shinhan customizations (extends core)
│   │   │   ├── store/    # CE-specific stores (workflows, time tracking)
│   │   │   ├── services/ # CE API methods
│   │   │   └── components/ # CE-specific UI
│   │   ├── app/          # Next.js app router (new layout)
│   │   ├── public/       # Static assets
│   │   └── tsconfig.json # @/* → core/, @/plane-web/* → ce/
│   │
│   ├── api/              # Django backend (8000)
│   │   ├── plane/
│   │   │   ├── db/models/    # 37 ORM models (Workspace, Project, Issue, etc.)
│   │   │   ├── app/views/    # DRF viewsets (@allow_permission decorator)
│   │   │   ├── app/serializers/ # Separate v0/v1 serializers
│   │   │   ├── utils/        # Helpers (workflow_checker, exports, etc.)
│   │   │   ├── middleware/   # 10-layer auth/logging/routing stack
│   │   │   ├── tasks/        # Celery tasks (41 tasks)
│   │   │   ├── settings/     # Django config (v0/v1 URLs)
│   │   │   └── asgi.py       # ASGI entry
│   │   ├── manage.py
│   │   └── requirements.txt
│   │
│   ├── admin/            # Instance admin panel (3001, 211 files)
│   │   └── God Mode UI for system management
│   │
│   ├── space/            # Public project pages (3002, 188 files)
│   │   └── Guest access to shared projects
│   │
│   ├── live/             # WebSocket real-time (3003, 51 files)
│   │   └── Hocuspocus + Y.js CRDT
│   │
│   └── proxy/            # Caddy reverse proxy
│       └── Caddyfile (routes to web/admin/space/live)
│
├── packages/             # Shared libraries (17 total)
│   ├── propel/           # New UI components (385 files)
│   │   └── Button, Input, Dialog, Charts, Tables, etc.
│   ├── ui/               # Legacy UI components (125 files)
│   ├── editor/           # Tiptap v2 rich text + Y.js CRDT
│   ├── types/            # Shared TypeScript interfaces (I* naming)
│   ├── services/         # API client classes (axios)
│   ├── utils/            # Helpers (date, color, markdown)
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # App constants
│   ├── shared-state/     # Cross-app MobX stores
│   ├── i18n/             # Translations (EN, KO, VI)
│   ├── logger/           # Winston logging
│   ├── decorators/       # Express.js decorators
│   ├── tailwind-config/  # Semantic color tokens + CSS vars
│   ├── typescript-config/# TS configs (base, react, node)
│   ├── eslint-plugin/    # Custom ESLint rules
│   └── codemods/         # jscodeshift transformations
│
├── .claude/              # Claude context (agents, hooks, skills)
├── plans/                # Planning & task tracking
├── docs/                 # Project documentation
├── pnpm-workspace.yaml   # pnpm monorepo config
├── turbo.json            # Turbo build orchestration
├── docker-compose.yml    # Local dev stack
└── README.md             # Getting started guide

```

## Key Files & Entry Points

### Backend (Django)

| File/Dir                                   | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `apps/api/plane/settings/base.py`          | Django core config (DB, cache, middleware)  |
| `apps/api/plane/settings/urls.py`          | API URL routing (v0, v1)                    |
| `apps/api/plane/db/models/`                | 37 ORM models (BaseModel, ProjectBaseModel) |
| `apps/api/plane/app/views/`                | 41+ DRF viewsets (@allow_permission)        |
| `apps/api/plane/app/serializers/v0/`       | Legacy serializers (session auth)           |
| `apps/api/plane/app/serializers/v1/`       | External API (API key auth, OpenAPI)        |
| `apps/api/plane/utils/workflow_checker.py` | Workflow validation logic                   |
| `apps/api/plane/tasks/`                    | Celery async tasks (41 tasks)               |
| `apps/api/manage.py`                       | Django CLI                                  |

### Frontend (React)

| File/Dir                                    | Purpose                                      |
| ------------------------------------------- | -------------------------------------------- |
| `apps/web/app/`                             | Next.js app router entry (layouts, pages)    |
| `apps/web/core/store/`                      | MobX root + 33+ feature stores               |
| `apps/web/core/hooks/store/`                | Store hooks (useWorkspace, useProject, etc.) |
| `apps/web/core/services/`                   | API client classes (axios)                   |
| `apps/web/core/components/`                 | Reusable React components (layouts, modals)  |
| `apps/web/ce/store/root.store.ts`           | CE root store (extends CoreRootStore)        |
| `apps/web/ce/components/workflow/`          | Workflow UI + DnD hook                       |
| `apps/web/ce/store/workflow.store.ts`       | Workflow MobX store                          |
| `apps/web/core/hooks/store/use-workflow.ts` | Workflow hook (reads CE store)               |
| `apps/web/tsconfig.json`                    | Path aliases (@/_, @/plane-web/_)            |

### Packages

| Package      | Key Files    | Purpose                                             |
| ------------ | ------------ | --------------------------------------------------- |
| **propel**   | src/index.ts | New Tailwind v4 components                          |
| **types**    | src/index.ts | TypeScript interfaces (IWorkspace, IIssue, etc.)    |
| **services** | src/         | API client classes (WorkspaceService, IssueService) |
| **editor**   | src/index.ts | Rich text editor (Tiptap + Y.js)                    |
| **i18n**     | src/locales/ | Translations (en.json, ko.json, vi.json)            |

## Core Concepts

### ORM Models (Backend)

**Base Hierarchy:**

```
BaseModel (id, created_at, updated_at)
  ├─ ProjectBaseModel (project_id, project foreign key)
  └─ WorkspaceBaseModel (workspace_id, workspace foreign key)
```

**37+ Models Include:**

- **Workspace, Project, ProjectMember**
- **Issue, IssueFavorite, IssueLabel, IssueLink, IssueActivity**
- **Cycle (sprints), Module, CycleIssue, ModuleIssue**
- **State (workflow states), Notification**
- **Page (wiki), PageBlock, PageFavorite**
- **Webhook, WebhookLog, WebhookEventLog**
- **Label, Priority, Estimate, Project Template**
- **WorkflowState, WorkflowTransition** (CE: state transitions, approvals)
- **TimeLog** (CE: time tracking, estimates, logged hours)
- **WebSocketConnection** (CE: real-time collaboration)
- **Analytics, AnalyticsData** (CE: dashboards, reports)
- **TaskCategory** (CE: admin task categorization)
- **MonitoringMetric** (CE: admin monitoring dashboard)

**Key Patterns:**

- Soft-delete: `deleted_at` field, `SoftDeletionManager` ORM
- Audit trail: `created_by`, `updated_by` foreign keys
- Uniqueness with soft-delete: `UniqueConstraint(condition=Q(deleted_at__isnull=True))`

### MobX Stores (Frontend)

**Root Store:**

```
RootStore (extends CoreRootStore in CE)
  ├─ workspaceStore → WorkspaceRootStore
  ├─ projectStore → ProjectRootStore
  ├─ issueStore → IssueRootStore (list, kanban, gantt, calendar, spreadsheet)
  ├─ cycleStore → CycleRootStore
  ├─ moduleStore → ModuleRootStore
  ├─ pageStore → PageRootStore
  ├─ workflowStore (CE) → WorkflowRootStore (workflow state transitions)
  ├─ timeTrackingStore (CE) → TimeTrackingRootStore (estimates, logged hours)
  ├─ hoStore (CE) → HORootStore (org chart / department hierarchy)
  ├─ analyticsStore (CE) → AnalyticsRootStore (dashboards, reports)
  ├─ taskCategoryStore (CE) → TaskCategoryRootStore (admin task categories)
  └─ monitoringStore (CE) → MonitoringRootStore (admin monitoring dashboard)
```

**Store Pattern:**

```typescript
makeObservable(this, {
  items: observable,
  error: observable,
  fetchItems: action,
  updateItem: action.bound,
  asyncFetch: flow, // for async
});

// Async mutations must use runInAction
runInAction(() => {
  this.items = data;
});
```

### API Architecture

**V0 API (Session Auth, Internal):**

- Used by web UI
- Cookie-based session
- `/api/v0/` routes
- Python serializers: `apps/api/plane/app/serializers/v0/`

**V1 API (API Key Auth, External):**

- External integrations
- Header-based API key: `X-API-KEY`
- OpenAPI docs: DRF Spectacular
- `/api/v1/` routes
- Separate serializers: `apps/api/plane/app/serializers/v1/`

**Common Patterns:**

- `@allow_permission("workspace.member")` — Role check
- `project__workspace__slug=slug` — Always scope queries
- Paginate responses (LimitOffsetPagination)
- Error codes: 400 (validation), 403 (permission), 404 (not found)

### Middleware Stack (10 Layers)

1. CORS — Domain validation
2. Auth — Session/API key extraction
3. Request logging — Winston + correlation IDs
4. Workspace detection — Slug-based
5. Read-replica routing — Reads → replica, writes → primary
6. Rate limiting — Per-user/API-key
7. GZip compression
8. Request validation
9. Response formatting
10. Error handling

### Celery Tasks (41 Tasks)

**Categories:**

- **Notifications:** email, Slack, webhook delivery
- **Webhooks:** send events, retry logic
- **Activities:** log issue/project changes
- **Exports:** CSV, JSON exports to S3
- **Cleanup:** soft-delete archival, session expiry
- **Analytics:** report generation (CE)

**Broker:** RabbitMQ
**Task routing:** Celery beat for scheduled tasks
**Redis:** Task result backend

### WebSocket Real-Time (apps/live)

**Stack:** Hocuspocus + Y.js CRDT

- Shared document state across clients
- Conflict-free edits (CRDT resolution)
- WebSocket server (port 3003)
- Y.js awareness for cursor positions (future)

## Design Patterns

### CE Pattern (Customization Extension)

**Rule:** Never modify `core/`; extend via `ce/`

**Store Extension Example:**

```typescript
// core/store/issue-root.store.ts
export class IssueRootStore {}

// ce/store/root.store.ts
export class RootStore extends CoreRootStore {
  workflowStore: WorkflowRootStore;
  constructor() {
    super();
    this.workflowStore = new WorkflowRootStore(this);
  }
}
```

**Hook Pattern:**

```typescript
// core/hooks/store/use-workflow.ts
export function useWorkflow() {
  const { workflowStore } = useContext(StoreContext);
  return workflowStore; // CE or core
}
```

### Drag-and-Drop (Kanban)

**Hook:** `useWorkflowFDragNDrop` in `ce/components/workflow/use-workflow-drag-n-drop.ts`

- Called per Kanban column in `kanban-group.tsx`
- Returns: `workflowDisabledSource`, `isWorkflowDropDisabled`, `handleWorkFlowState`, etc.
- On `onDragEnter`: `handleWorkFlowState(sourceGroupId, destGroupId)`
- Validates state transitions via workflow rules

### Error Handling (Workflow 403)

**Issue:** Blocked transitions raise errors in promises (unhandled rejection)
**Solution:** `WorkflowBlockerModal` in project layout catches via:

```javascript
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason.code === "WORKFLOW_TRANSITION_BLOCKED") {
    showBlockerModal(e.reason);
  }
});
```

### Type Management

**Convention:** All types in `packages/types/src/` as `.ts` files (not `.d.ts`)

```typescript
// packages/types/src/workspace.ts
export interface IWorkspace {
  id: string;
  name: string;
  slug: string;
}

// packages/types/src/index.ts
export * from "./workspace";
export * from "./project";
// ...
```

**Naming:** `I*` prefix for interfaces/types

- `IWorkspace`, `IProject`, `IIssue`, `IPageBlock`, etc.

### i18n (Internationalization)

**Locales:** `packages/i18n/src/locales/`

- `en.json` — English
- `ko.json` — Korean
- `vi.json` — Vietnamese

**Usage:**

```typescript
import { useI18n } from "@plane/i18n";

const { t } = useI18n();
t("workspace.settings.title");
```

**Format:** ICU MessageFormat for plurals/gender

```json
{
  "issues.count": "{count, plural, =0 {No issues} one {1 issue} other {# issues}}"
}
```

## Performance Considerations

- **Issue list:** <500ms load (indexed queries, pagination)
- **Kanban:** <1s render (Atlaskit pragmatic DnD, virtualization)
- **Real-time:** Y.js debouncing, WebSocket heartbeat (30s)
- **Caching:** Redis for workspace/project metadata
- **Queries:** Always use `select_related()`, `prefetch_related()` in Django
- **No N+1:** API responses pre-computed in serializers

## Testing

**Backend:** Django test suite + pytest

```bash
cd apps/api && python run_tests.py
```

**Frontend:** Vitest + React Testing Library

```bash
pnpm test
```

**Coverage Targets:** >80% (code, integration)

## Monitoring & Logging

- **Backend:** Winston (structured JSON logs)
- **Frontend:** Console logs + error tracking (TBD)
- **APM:** Request tracing via correlation IDs
- **Health checks:** `/health` endpoint (Django)

---

**Last Updated:** 2026-04-08
**Version:** 1.1
