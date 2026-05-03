<!-- refreshed: 2026-05-03 -->

# Architecture

**Analysis Date:** 2026-05-03

## System Overview

Plane is a four-tier system: a **Caddy proxy** routes traffic to a **React Router v7 SPA** (web/admin/space), a **Hocuspocus + Express collaboration server** (live), and a **Django REST + Celery monolith** (api). Postgres, Valkey/Redis, RabbitMQ, and S3-compatible storage sit beneath them.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         BROWSERS / CLIENTS                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Caddy reverse proxy   `apps/proxy/Caddyfile.ce`                              │
│  /api/* /auth/* → api  •  /live/* → live  •  /spaces/* → space                │
│  /god-mode/* → admin   •  else → web                                          │
└──────────────────────────────────────────────────────────────────────────────┘
        │                 │                    │                       │
        ▼                 ▼                    ▼                       ▼
┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  ┌──────────────────┐
│  web (3000)  │  │ admin (3001) │  │   space (3002)     │  │   live (3000)    │
│ React Router │  │ React Router │  │   React Router     │  │ Hocuspocus +     │
│ + MobX       │  │ + MobX       │  │   + MobX           │  │ Express + Yjs    │
│ `apps/web`   │  │ `apps/admin` │  │   `apps/space`     │  │ `apps/live`      │
└──────┬───────┘  └──────┬───────┘  └──────┬─────────────┘  └──────┬───────────┘
       │                 │                  │                       │
       │  REST/Axios     │                  │                       │ HTTP fetch/store
       │  (cookie auth)  │                  │                       │ to /api/v1/...
       └────────┬────────┴──────────────────┴───────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Django REST API (port 8000)                               │
│   `apps/api/plane/urls.py` →                                                  │
│     /api/        → `plane.app.urls`        (in-app, cookie-auth)              │
│     /api/v1/     → `plane.api.urls`        (external token API)               │
│     /api/public/ → `plane.space.urls`      (anonymous deploy boards)          │
│     /api/instances/ → `plane.license.urls` (instance/license)                 │
│     /auth/      → `plane.authentication.urls`                                 │
│   Layers per request: URLConf → ViewSet/APIView → Serializer → Model          │
└──────┬───────────────────────────────┬────────────────────────────────────────┘
       │ ORM                           │ .delay()
       ▼                               ▼
┌──────────────────┐           ┌────────────────────────────────────────┐
│  Postgres 15     │           │  Celery worker + beat                  │
│  `plane.db.models`│          │  RabbitMQ broker • Valkey result/cache │
│                  │           │  `apps/api/plane/bgtasks/*.py`         │
└──────────────────┘           └────────────┬───────────────────────────┘
                                            │ HTTP / model_activity
                                            ▼
                                   external webhooks, email, storage

┌──────────────────────────────────────────────────────────────────────────────┐
│  Valkey / Redis  ◄───── live ──────►  fan-out across replicas                 │
│  (`@hocuspocus/extension-redis` in `apps/live/src/extensions/redis.ts`)       │
│  S3-compatible storage  ◄────── api ──── file assets                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component             | Responsibility                                                                 | File                                                                            |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Caddy proxy           | Single ingress, path-based fan-out to web/admin/space/live/api                 | `apps/proxy/Caddyfile.ce`                                                       |
| `apps/web`            | Main product SPA (workspaces, projects, issues, cycles, modules, pages)        | `apps/web/app/root.tsx`, `apps/web/app/routes.ts`                               |
| `apps/admin`          | Instance "god mode" admin SPA — first-admin registration, instance settings    | `apps/admin/app/root.tsx`                                                       |
| `apps/space`          | Public/guest views for shared issues and deploy boards                         | `apps/space/app/root.tsx`                                                       |
| `apps/live`           | Hocuspocus realtime collaboration server (Yjs persistence + Redis fan-out)     | `apps/live/src/server.ts`, `apps/live/src/hocuspocus.ts`                        |
| `apps/api` (Django)   | REST API, business rules, Celery scheduler/worker host                         | `apps/api/plane/urls.py`, `apps/api/plane/celery.py`                            |
| MobX root store       | Composed reactive store wired into every observer component                    | `apps/web/ce/store/root.store.ts` (extends `apps/web/core/store/root.store.ts`) |
| `@plane/services`     | Cross-app HTTP service classes (issue, cycle, module, etc.)                    | `packages/services/src/`                                                        |
| `@plane/shared-state` | MobX stores shared across web/space/admin (work item filters, user, workspace) | `packages/shared-state/src/store/`                                              |
| `@plane/types`        | TypeScript types shared across all apps                                        | `packages/types/src/`                                                           |
| `@plane/editor`       | Tiptap-based rich text editor and Yjs binding helpers                          | `packages/editor/`                                                              |

## Pattern Overview

**Overall:** Layered monorepo combining an SSR-capable React Router v7 SPA, a stateless realtime collaboration sidecar, and a Django Rest Framework monolith with Celery for async work. Inside each tier the code follows a strict layering pattern.

**Key Characteristics:**

- **CE / core / plane-web split** in every frontend app: `@/*` → `core/*` (open code), `@/plane-web/*` → `ce/*` (Community Edition; in private forks the alias resolves to `ee/*` instead). Enterprise injection happens by replacing the alias target at TS/Vite resolution time, not at runtime.
- **MobX observable graph rooted in a single `RootStore`** instantiated once at module load (`apps/web/core/lib/store-context.tsx` exports a singleton; `StoreProvider` exposes it via React context). Every reactive component is wrapped with `observer()` from `mobx-react`.
- **Service classes wrap Axios** and live in `apps/<app>/core/services/` plus the cross-app `@plane/services`. Stores own service instances — components never call `axios` directly.
- **Django views are class-based** (`BaseAPIView` / `BaseViewSet` in `apps/api/plane/app/views/base.py`), filtered through `BaseSessionAuthentication`, with all heavy or fan-out work pushed to Celery via `task.delay(...)`.
- **Yjs documents live in Postgres**: the `Database` Hocuspocus extension fetches and stores Yjs binary blobs through the Django REST API, with Redis used for cross-instance sync via `@hocuspocus/extension-redis`.

## Layers

### Frontend (`apps/web`, `apps/admin`, `apps/space`)

**Routes (`apps/<app>/app/routes.ts`, `apps/<app>/app/routes/*`):**

- Purpose: Declarative React Router v7 route tree; merges `coreRoutes` and `extendedRoutes`.
- Location: `apps/web/app/routes.ts` (entry), `apps/web/app/routes/core.ts`, `apps/web/app/routes/extended.ts`, `apps/web/app/routes/redirects/*`.
- Contains: Calls to `layout()` / `route()` / `index()` from `@react-router/dev/routes`. The `(group)/page.tsx` folder convention is **purely cosmetic** — only paths declared here become routes.
- Depends on: `apps/web/app/(all)/...` for layouts and pages.
- Used by: `react-router build` / `react-router dev`.

**Pages & Layouts (`apps/web/app/(all)/...`, `apps/web/app/(home)/...`):**

- Purpose: Page components and nested layouts referenced from `routes.ts`.
- Pattern: Each `layout.tsx` holds an `<Outlet />`; `page.tsx` files are thin wrappers that mount `core/components/...` roots.
- Auth: `apps/web/app/(all)/layout.tsx` and `[workspaceSlug]/layout.tsx` enforce session and workspace context before rendering children.

**Components (`apps/<app>/core/components/<feature>/`):**

- Purpose: All UI for a feature. Domain-organized (e.g. `issues`, `cycles`, `modules`, `pages`, `gantt-chart`, `analytics`).
- Pattern: Components are wrapped in `observer()` and read from MobX stores via `useAppRouter` / direct `useStore` hooks (`apps/web/core/hooks/store/`).
- Depends on: `@plane/ui`, `@plane/propel`, `@plane/editor` for primitives; local `core/store/*`; services injected through stores.

**Hooks (`apps/<app>/core/hooks/`):**

- Purpose: Reusable React hooks — store accessors (`hooks/store/use-*.ts`), DOM/UX utilities (`use-debounce`, `use-keypress`, `use-platform-os`), and feature-specific (`use-issues-actions`, `use-page-operations`).
- Used by: Components throughout `core/components/`.

**Stores (`apps/web/ce/store/root.store.ts` → `apps/web/core/store/`):**

- Purpose: MobX-observable application state. Single graph rooted at `RootStore` (CE) which extends `CoreRootStore`.
- Hierarchy:
  - `core/store/root.store.ts` defines `CoreRootStore` and instantiates ~25 substores in its constructor (router, instance, user, workspaceRoot, projectRoot, memberRoot, cycle, module, issue, state, label, dashboard, analytics, projectPages, theme, projectInbox, projectEstimate, multipleSelect, workspaceNotification, favorite, stickyStore, editorAssetStore, workItemFilters, powerK, …).
  - `ce/store/root.store.ts` extends it with CE-only stores (e.g. `timelineStore`).
  - Domain root stores (`issue/root.store.ts`, `workspace/index.ts`, `member/index.ts`, `project/index.ts`) compose feature-specific substores.
- Reset: `CoreRootStore.resetOnSignOut()` reinstantiates substores rather than clearing them.
- Depends on: `@plane/services`, `@plane/shared-state`, app-local `services/`.

**Services (`apps/<app>/core/services/*.service.ts` and `@plane/services`):**

- Purpose: HTTP wrappers; each domain has a class extending `APIService` (`apps/web/core/services/api.service.ts`).
- `APIService` wraps an Axios instance with `withCredentials: true` and a 401 interceptor that redirects to `/?next_path=...`.
- Cross-app services live in `@plane/services` (`packages/services/src/`); web/space-specific subclasses are in app-local `services/`.

**Cross-cutting libs (`apps/web/core/lib/`):**

- `lib/store-context.tsx` — singleton `RootStore`, `StoreContext`, `StoreProvider` consumed by `apps/web/app/provider.tsx`.
- `lib/wrappers/store-wrapper`, `lib/wrappers/instance-wrapper` — bootstrap routines that hydrate the store from server data before the rest of the app mounts.
- `lib/b-progress`, `lib/app-rail`, `lib/polyfills` — top-bar progress, app shell rail, and runtime polyfills.

### Realtime collaboration (`apps/live`)

**HTTP entry (`apps/live/src/server.ts`):**

- Express app initialized in `Server` class. Registers `helmet`, `compression`, `cors`, `loggerMiddleware`, then mounts decorator-registered controllers under `env.LIVE_BASE_PATH`.
- Controllers (`apps/live/src/controllers/`): `collaboration.controller.ts` (websocket upgrade), `document.controller.ts` (admin ops), `health.controller.ts`, `pdf-export.controller.ts`. Registered via `@plane/decorators` `registerController`.

**Hocuspocus (`apps/live/src/hocuspocus.ts`):**

- `HocusPocusServerManager` is a singleton holding a single `Hocuspocus` instance with `onAuthenticate`, `onStateless` and a list of extensions.
- Extensions (`apps/live/src/extensions/index.ts`, executed in order):
  1. `Logger` — request/lifecycle logging.
  2. `Database` — `fetch`/`store` callbacks that hit Django via `getPageService(documentType, context)`.
  3. `Redis` — extends `@hocuspocus/extension-redis`; also subscribes to a `hocuspocus:admin` channel for cross-instance commands.
  4. `TitleSyncExtension` — keeps page titles in sync with Y document state.
  5. `ForceCloseHandler` — must come after Redis; reacts to admin force-close broadcasts.

**Auth (`apps/live/src/lib/auth.ts`):**

- `onAuthenticate` parses the cookie+userId from the Hocuspocus token, hydrates `HocusPocusServerContext` (`workspaceSlug`, `projectId`, `documentType`, `userId`, `cookie`), and calls `UserService.currentUser(cookie)` against the Django API to verify identity.

**Services (`apps/live/src/services/page/handler.ts`):**

- `getPageService(documentType, context)` returns a typed service per document type (currently `project_page` → `ProjectPageService`). Each service extends `PageCoreService` which extends `APIService`, talking back to Django over HTTPS using the user's cookie.

### Django backend (`apps/api`)

**URL fan-out (`apps/api/plane/urls.py`):**

- `/api/` → `plane.app.urls` (UI-facing, cookie auth, full feature set)
- `/api/v1/` → `plane.api.urls` (external API token surface, narrower set of endpoints)
- `/api/public/` → `plane.space.urls` (anonymous public deploy boards)
- `/api/instances/` → `plane.license.urls`
- `/auth/` → `plane.authentication.urls`
- `""` → `plane.web.urls` (catch-all health/static glue)

**Within each app (e.g. `plane.app`):**

1. **URLs** — `apps/api/plane/app/urls/__init__.py` aggregates per-domain `urls/<domain>.py` modules into a single `urlpatterns` list.
2. **Views** — `apps/api/plane/app/views/<domain>/*.py`, sub-classed from `BaseAPIView` / `BaseViewSet` (`apps/api/plane/app/views/base.py`).
   - `BaseViewSet` mixes in `TimezoneMixin` (sets `tzdata` from `request.user.user_timezone`), `ReadReplicaControlMixin` (per-view read-replica routing), DRF `ModelViewSet`, and `BasePaginator` (`apps/api/plane/utils/paginator.py`).
   - Authentication: `BaseSessionAuthentication` (`apps/api/plane/authentication/session.py`).
   - Permissions: `IsAuthenticated` plus `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ...])` decorator from `apps/api/plane/app/permissions/`.
   - Filtering: `DjangoFilterBackend`, `SearchFilter`, plus custom `ComplexFilterBackend` / `IssueFilterSet` (`apps/api/plane/utils/filters/`).
3. **Serializers** — `apps/api/plane/app/serializers/<domain>.py`, all extending `BaseSerializer` from `apps/api/plane/app/serializers/base.py`.
4. **Models** — `apps/api/plane/db/models/<domain>.py`, extending `BaseModel` (`apps/api/plane/db/models/base.py`) which itself extends the `AuditModel` mixin (`apps/api/plane/db/mixins.py`) for `created_by`/`updated_by`/`created_at`/`updated_at`/`deleted_at` and soft-delete behavior. UUID primary keys throughout.
5. **bgtasks** — `apps/api/plane/bgtasks/*.py`. Each module owns a clearly scoped Celery task. Views fire-and-forget tasks with `task.delay(...)`.

**Celery (`apps/api/plane/celery.py`):**

- One `Celery("plane")` app, configured from Django settings under the `CELERY` namespace.
- Beat schedule registered in code (`app.conf.beat_schedule`) — covers email batching, hard-delete, archive-and-close, exporter cleanup, page/issue version cleanup, license tracer, etc.
- Scheduler: `django_celery_beat.schedulers.DatabaseScheduler` (DB-backed, editable via admin).
- Logs via `pythonjsonlogger.JsonFormatter` attached on `after_setup_logger` / `after_setup_task_logger` signals.

**Settings (`apps/api/plane/settings/`):**

- `common.py` (base) → `local.py` (dev / Docker compose), `production.py`, `test.py`, plus topical mixins (`redis.py`, `mongo.py`, `storage.py`, `openapi.py`).
- `DJANGO_SETTINGS_MODULE` defaults to `plane.settings.production` in `celery.py`; the migrator container uses `--settings=plane.settings.local`.

**Other Django apps inside `apps/api/plane/`:**

- `authentication/` — credentials + OAuth providers (`provider/credentials`, `provider/oauth`), session adapter, custom rate limiting; views split between `views/app` (web) and `views/space` (public).
- `analytics/` — analytic plot endpoints, separate from `app/views/analytic`.
- `license/` — instance/license model + DRF surface, plus its own `bgtasks/` (`tracer.py`) and `migrations/`.
- `middleware/` — `db_routing.py` (read replica), `logger.py`, `request_body_size.py`.
- `throttles/` — DRF throttle classes (e.g. `asset.py`).
- `seeds/` — bootstrap data.
- `web/` — minimal Django app for non-API HTML/static glue.
- `space/` — public deploy-board endpoints; mirrors `app/` layout (`urls/`, `views/`, `serializer/`).

## Data Flow

### Primary Request Path: "Create a work item"

1. User clicks "Create" inside `apps/web/core/components/issues/issue-modal/modal.tsx`. The modal collects form fields via `react-hook-form`.
2. Submit handler dispatches into a MobX store action — typically `rootStore.issue.projectIssues.createIssue(workspaceSlug, projectId, payload)` (`apps/web/core/store/issue/project/issue.store.ts`).
3. `ProjectIssues.createIssue` calls `this.issueService.createIssue(...)` where `issueService` is an `IssueService` instance (`apps/web/core/services/issue/issue.service.ts`) extending `APIService` (`apps/web/core/services/api.service.ts`).
4. Axios sends `POST /api/workspaces/<slug>/projects/<projectId>/issues/` with `withCredentials: true`. Caddy in production routes `/api/*` → `api:8000`; in `pnpm dev` the browser hits Django directly at `VITE_API_BASE_URL`.
5. Django routes the request via `apps/api/plane/urls.py` → `plane.app.urls.issue` → `IssueViewSet.as_view({"post": "create"})` (`apps/api/plane/app/views/issue/base.py:391`).
6. `IssueViewSet.create` (a) checks permissions via `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`, (b) instantiates `IssueCreateSerializer` with project context, (c) `serializer.save()` writes to Postgres through `Issue` model managers (`apps/api/plane/db/models/issue.py`).
7. Side-effects are queued as Celery tasks:
   - `issue_activity.delay(...)` → `apps/api/plane/bgtasks/issue_activities_task.py` (audit trail + notifications).
   - `model_activity.delay(...)` → `apps/api/plane/bgtasks/webhook_task.py` (outbound webhooks).
   - `issue_description_version_task.delay(...)` → `apps/api/plane/bgtasks/issue_description_version_task.py`.
8. Django returns the annotated work item (`.values(...)` projection with `cycle_id`, `module_ids`, `attachment_count`, etc.) at HTTP 201.
9. The store action receives the response and calls `runInAction(() => set(this.issuesMap, issue.id, issue))` (`apps/web/core/store/issue/issue.store.ts:61`). MobX notifies every `observer()`-wrapped consumer (lists, kanban, gantt, peek view) and the UI re-renders.

### Secondary Flow: "Edit a page (collaborative)"

1. User opens a page; `apps/web/core/components/pages/...` mounts a Tiptap editor from `@plane/editor`.
2. The editor opens a websocket to the live server: `wss://.../live/...?workspaceSlug=...&projectId=...&documentType=project_page`.
3. Hocuspocus calls `onAuthenticate` (`apps/live/src/lib/auth.ts`) which validates the user's cookie against Django's `/api/users/me/` via `UserService.currentUser`.
4. On first connect, the `Database` extension (`apps/live/src/extensions/database.ts`) calls `getPageService(documentType, context).fetchDescriptionBinary(pageId)` — Django returns the stored Yjs binary. If empty, `getBinaryDataFromDocumentEditorHTMLString` converts legacy HTML to Yjs and stores it back.
5. CRDT updates from all connected clients are merged in-memory by Hocuspocus and broadcast across replicas via the `Redis` extension.
6. After 10 s of debounce (`HocusPocusServerManager`), the `Database` extension calls `service.updateDescriptionBinary(pageId, payload)` — Django persists `description_binary`, `description_html`, `description_json` together.
7. `TitleSyncExtension` separately syncs page title field changes back to the Django API.
8. `ForceCloseHandler` listens on the Redis admin channel; if the document is too large (HTTP 413) or admin-closed, it broadcasts a stateless message that drops every client cleanly.

**State Management:**

- Server-of-record is Postgres (Django ORM).
- Web/admin/space caches state in MobX `RootStore` (per-tab, in-memory).
- Live server keeps Yjs documents in memory + Redis pub-sub for fan-out; persistence is debounced into Postgres via the Django REST surface.
- SWR (`@plane/constants` `WEB_SWR_CONFIG`) wraps fetch hooks for cacheable read paths.

## Key Abstractions

**`APIService` (frontend HTTP base):**

- Purpose: Shared Axios wrapper with cookie credentials and 401 interceptor.
- File: `apps/web/core/services/api.service.ts` (and parallel base classes in admin/space).
- Pattern: Subclassed per domain (`IssueService`, `CycleService`, …). Subclasses construct with a base URL (usually `API_BASE_URL` from `@plane/constants`).

**`CoreRootStore` / `RootStore` (MobX root):**

- Purpose: Single observable graph for the whole app.
- File: `apps/web/core/store/root.store.ts` (open) extended by `apps/web/ce/store/root.store.ts` (CE).
- Pattern: Constructor instantiates every substore with `this` (or `this as RootStore`) so substores can read sibling state.

**`IIssueRootStore` (issue feature root):**

- Purpose: Composes per-context issue stores (`projectIssues`, `cycleIssues`, `moduleIssues`, `workspaceIssues`, `profileIssues`, `archivedIssues`, `workspaceDraftIssues`, …) plus `issueDetail`/`epicDetail`.
- File: `apps/web/core/store/issue/root.store.ts`.
- Each pair has a filter store and an issues store; both extend `BaseIssuesStore` / `BaseIssuesFilterStore` in `apps/web/core/store/issue/helpers/`.

**`BaseAPIView` / `BaseViewSet` (Django):**

- Purpose: Shared DRF base with timezone activation, read-replica routing, and exception → JSON normalization.
- File: `apps/api/plane/app/views/base.py`.
- Pattern: All endpoints subclass these. `model = …`, `serializer_class = …`, `permission_classes = …`. `handle_exception` translates `IntegrityError`, `ValidationError`, `ObjectDoesNotExist`, `KeyError` into typed JSON responses.

**`BaseModel` (Django ORM):**

- Purpose: UUID primary keys + `AuditModel` mixin (created_by/updated_by/created_at/updated_at + soft-delete via `SoftDeletionManager`).
- File: `apps/api/plane/db/models/base.py`, mixin in `apps/api/plane/db/mixins.py`.
- Pattern: Uses `crum.get_current_user()` to auto-populate authorship on every save unless `disable_auto_set_user=True`.

**`HocusPocusServerContext` (live):**

- Purpose: Per-connection context (`cookie`, `userId`, `workspaceSlug`, `projectId`, `documentType`) populated in `onAuthenticate` and consumed by extensions and services.
- File: `apps/live/src/types/`.

## Entry Points

**`apps/web` (and admin/space) — browser SPA:**

- Location: `apps/web/app/entry.client.tsx`, `apps/web/app/root.tsx`, `apps/web/app/routes.ts`.
- Triggers: Vite/React Router dev server (`react-router dev --port 3000`) or built static bundle served by `serve` (production).
- Responsibilities: Mount `<AppProvider>` (theme + i18n + Toast + StoreProvider + SWR + InstanceWrapper) → `<Outlet />` driven by route config.

**`apps/live` — collaboration server:**

- Location: `apps/live/src/start.ts` (process bootstrap) → `apps/live/src/server.ts` (`Server` class) → `apps/live/src/hocuspocus.ts` (`HocusPocusServerManager`).
- Triggers: `tsdown` build + `node dist/start.js` (or `pnpm dev` watch mode). Listens on `env.PORT` (default 3000) under `env.LIVE_BASE_PATH`.
- Responsibilities: Initialize Redis → start Hocuspocus → mount controllers → expose `/health` + `/document/...` HTTP routes.

**`apps/api` — Django + Celery:**

- WSGI: `apps/api/plane/wsgi.py` (gunicorn entry in `apps/api/bin/docker-entrypoint-api.sh`).
- ASGI: `apps/api/plane/asgi.py`.
- Celery worker/beat: `apps/api/plane/celery.py` invoked by `apps/api/bin/docker-entrypoint-worker.sh` / `docker-entrypoint-beat.sh`.
- Migrator: `apps/api/bin/docker-entrypoint-migrator.sh` (uses `plane.settings.local`).
- Manage commands: `apps/api/manage.py`, custom commands in `apps/api/plane/db/management/commands/`.

## Architectural Constraints

- **Threading:**
  - Web/admin/space SPAs are single-threaded React event loops; web also opts into a comlink web worker for parsing-heavy editor content (`comlink` dep + `apps/web/core/hooks/use-parse-editor-content.ts`).
  - `apps/live` is a single-process Node event loop; horizontal scaling happens at the proxy/load-balancer layer with Redis carrying CRDT updates.
  - Django runs synchronous request workers; async work is delegated to Celery, never run in-process.
- **Global state:**
  - Frontend: `apps/web/core/lib/store-context.tsx` exports a module-level `rootStore` singleton — it is intentionally not per-request safe and has `enableStaticRendering(typeof window === "undefined")` guard for SSR.
  - Live: `HocusPocusServerManager` and `redisManager` (`apps/live/src/redis.ts`) are singletons.
  - Django: `crum` thread-local for current user; `redis_instance()` factory in `apps/api/plane/settings/redis.py`.
- **CE/EE boundary:** All enterprise-only code must sit behind `@/plane-web/*` so the open-source build resolves to the `ce/` stub. Direct imports from a hypothetical `ee/` directory are **not allowed** in `core/`.
- **Routing source-of-truth:** `apps/web/app/routes.ts` is the only place new routes are registered; the `(group)/page.tsx` filenames mean nothing on their own.
- **Auth:** The `apps/api` is the single identity authority. `apps/live` re-validates every websocket against `/api/users/me/`; the SPA depends on the cookie set by `/auth/`.
- **`pnpm dev` has no Vite proxy** — `apps/web/vite.config.ts` only sets `server.host`. CORS must be enabled in the Django settings used during development.

## Anti-Patterns

### Calling Axios directly from a component

**What happens:** A component imports `axios` and posts to `/api/...` to skip the store/service layer.
**Why it's wrong:** It bypasses MobX so peers don't observe the change, skips the 401 redirect interceptor in `APIService`, and produces ad-hoc URL strings that drift from the Django routes.
**Do this instead:** Add a method to the relevant service (`apps/web/core/services/...`) and call it from a store action. See `IssueService.createIssue` invoked by `ProjectIssues.createIssue` in `apps/web/core/store/issue/project/issue.store.ts`.

### Importing enterprise code without the `@/plane-web/*` alias

**What happens:** Code under `core/` does `import { … } from "@/store/timeline"` (relative to `core/`) when `timeline` only exists in `ce/`.
**Why it's wrong:** It breaks the OSS build because `core/` has no `timeline` module; in private forks it also bypasses the `ee/` alias swap.
**Do this instead:** Always import enterprise-gated symbols through `@/plane-web/...`. See `import { TimeLineStore } from "./timeline"` inside `apps/web/ce/store/root.store.ts`, while `core/store/root.store.ts` imports CE substores via `@/plane-web/store/*`.

### Doing heavy work synchronously in a Django view

**What happens:** A view loops over thousands of issues to send notifications or fire webhooks before returning a response.
**Why it's wrong:** Holds a Postgres connection and request worker; multiplies p95 latency; makes retries impossible.
**Do this instead:** Push the work into `apps/api/plane/bgtasks/<area>_task.py` and call `task.delay(...)` from the view. See `IssueViewSet.create` enqueuing `issue_activity.delay`, `model_activity.delay`, `issue_description_version_task.delay` (`apps/api/plane/app/views/issue/base.py:407-475`).

### Using `next/*` imports outside the compat shim

**What happens:** A new component imports from `next/router` (or other unmapped `next/*` paths) instead of using React Router.
**Why it's wrong:** Vite only aliases `next/link`, `next/navigation`, and `next/script` (`apps/web/vite.config.ts:26-31`); anything else fails to resolve at build time.
**Do this instead:** Prefer React Router primitives (`<Link>`, `useNavigate`, `useLocation` from `react-router`) in new code. The compat shim exists only to avoid mass-rewriting legacy code.

### Mutating MobX observables outside `runInAction` / actions

**What happens:** A handler calls `store.someMap[id] = newValue` directly inside an async callback.
**Why it's wrong:** Triggers a MobX strict-mode warning, fragments reactions, and risks partial UI updates between awaits.
**Do this instead:** Wrap mutations in `runInAction(() => { … })` or declare an `@action`. See the `addIssue` action in `apps/web/core/store/issue/issue.store.ts:61` for the canonical pattern.

## Error Handling

**Strategy:** Layered — the closer to the user, the more user-friendly. Each layer normalizes errors before re-throwing.

**Frontend:**

- `APIService` interceptor (`apps/web/core/services/api.service.ts`) redirects to `/?next_path=...` on HTTP 401.
- Domain services rethrow `error.response.data` (or the full response for relation/link endpoints) so callers get JSON body shapes.
- React error boundaries: `apps/web/app/root.tsx` exports `ErrorBoundary` → `CustomErrorComponent` (`apps/web/app/error/`).
- `apps/web/app/not-found.tsx` is the catch-all React Router 404 leaf.

**Live:**

- `apps/live/src/lib/errors.ts` defines `AppError` with `code`, `statusCode`, `context`. Every catch block wraps unknowns into `AppError`.
- `apps/live/src/utils/broadcast-error.ts` pushes user-visible errors back to the editor as stateless messages.
- Force-close path: oversized documents (HTTP 413) trigger `forceCloseDocumentAcrossServers` (`apps/live/src/extensions/force-close-handler.ts`) so every replica drops the doc in lockstep.

**Django:**

- `BaseViewSet.handle_exception` in `apps/api/plane/app/views/base.py` maps `IntegrityError`/`ValidationError`/`ObjectDoesNotExist`/`KeyError` to typed 4xx responses, logs the rest with `log_exception` (`apps/api/plane/utils/exception_logger.py`).
- Custom 404 view: `plane.app.views.error_404.custom_404_view` (registered as `handler404` in `apps/api/plane/urls.py`).
- Celery tasks call `log_exception` and let Celery's retry policies handle transient failures.

## Cross-Cutting Concerns

**Logging:**

- Frontend: app-level `@plane/logger` package + `console` in dev.
- Live: `@plane/logger` `logger` instance + `loggerMiddleware` in `apps/live/src/server.ts`.
- Django: stdlib `logging` configured in `plane.settings.common`; Celery loggers use `pythonjsonlogger.JsonFormatter` (`apps/api/plane/celery.py:84-97`); HTTP requests logged via `apps/api/plane/middleware/logger.py`.

**Validation:**

- Frontend: `react-hook-form` for form validation; `@plane/types` enums and union types as the schema source.
- Backend: DRF serializers per domain (`apps/api/plane/app/serializers/<domain>.py`); model-level validators via Django `MinValueValidator`/`MaxValueValidator`/custom `validators` in model fields.

**Authentication:**

- Cookie session (`BaseSessionAuthentication` in `apps/api/plane/authentication/session.py`) for the SPA + live server.
- API tokens (`apps/api/plane/db/models/api.py` `APIToken`, exposed under `/api/v1/`) for external integrations.
- OAuth + magic-link providers under `apps/api/plane/authentication/provider/`.
- Live re-validates cookies on every websocket open (`apps/live/src/lib/auth.ts`).

**Authorization:**

- `apps/api/plane/app/permissions/` — `ROLE` enum + `allow_permission` decorator (`base.py`) plus per-scope permission classes (`project.py`, `workspace.py`, `page.py`).
- Frontend mirrors role checks via member stores (`apps/web/core/store/member/`) and gating helpers in `apps/web/core/components/<feature>/...`.

**Internationalization:**

- `@plane/i18n` `TranslationProvider` mounted in `apps/web/app/provider.tsx`. Translation JSON in `packages/i18n/src/locales/<lang>/translations.json` using IntlMessageFormat ICU syntax.

**Telemetry:**

- Sentry env vars wired through `turbo.json` `globalEnv` (`SENTRY_DSN`, `VITE_SENTRY_*`).
- Optional Microsoft Clarity session recorder in `apps/web/app/root.tsx` and `apps/web/app/layout.tsx` (gated by `VITE_ENABLE_SESSION_RECORDER`).
- Backend telemetry helpers in `apps/api/plane/utils/telemetry.py`.

---

_Architecture analysis: 2026-05-03_
