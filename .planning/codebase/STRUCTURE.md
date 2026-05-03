# Codebase Structure

**Analysis Date:** 2026-05-03

## Directory Layout

```
plane/                                  # repo root (pnpm workspace + Turborepo)
├── apps/
│   ├── web/                            # main product SPA (port 3000)
│   │   ├── app/                        # React Router v7 entry (root.tsx, routes.ts, providers, route folders)
│   │   ├── core/                       # @/* alias — open-source UI/state/services/hooks
│   │   ├── ce/                         # @/plane-web/* alias — Community Edition stubs and overrides
│   │   ├── e2e/                        # Playwright E2E tests
│   │   ├── playwright/                 # Playwright fixtures/helpers
│   │   ├── helpers/                    # tiny shared helpers consumed by app + core
│   │   ├── styles/                     # global Tailwind/CSS entry
│   │   ├── public/                     # static assets served verbatim
│   │   ├── nginx/                      # nginx server config for the prod container
│   │   ├── react-router.config.ts      # React Router v7 build config
│   │   ├── vite.config.ts              # Vite + tsconfig-paths + next/* compat aliases
│   │   ├── tsconfig.json               # extends @plane/typescript-config/react-router.json
│   │   └── package.json
│   │
│   ├── admin/                          # instance admin SPA (port 3001, /god-mode/)
│   │   ├── app/                        # React Router entry
│   │   ├── components/ helpers/ hooks/ lib/ providers/ store/ utils/ styles/
│   │   ├── nginx/ public/
│   │   └── react-router.config.ts, vite.config.ts, tsconfig.json
│   │
│   ├── space/                          # public/guest SPA (port 3002, /spaces/*)
│   │   ├── app/                        # React Router entry; includes `[workspaceSlug]/` and `issues/`
│   │   ├── components/ helpers/ hooks/ lib/ store/ types/ styles/
│   │   ├── nginx/ public/
│   │   └── react-router.config.ts, vite.config.ts, tsconfig.json
│   │
│   ├── live/                           # Hocuspocus realtime collaboration server
│   │   ├── src/
│   │   │   ├── start.ts                # process bootstrap + signal handlers
│   │   │   ├── server.ts               # Express + websocket Server class
│   │   │   ├── hocuspocus.ts           # Hocuspocus singleton + extension wiring
│   │   │   ├── redis.ts                # ioredis client manager
│   │   │   ├── env.ts                  # zod-validated env
│   │   │   ├── controllers/            # @plane/decorators-driven HTTP routes
│   │   │   ├── extensions/             # logger, database, redis, title-sync, force-close-handler
│   │   │   ├── lib/                    # auth, errors, stateless helpers, pdf utilities
│   │   │   ├── services/               # api.service, page/, pdf-export/, user.service
│   │   │   ├── schema/ utils/ types/
│   │   ├── tests/                      # Vitest tests (lib + services)
│   │   ├── tsdown.config.ts vitest.config.ts tsconfig.json package.json
│   │
│   ├── api/                            # Django REST + Celery (NOT in pnpm workspace)
│   │   ├── manage.py
│   │   ├── plane/
│   │   │   ├── settings/               # common, local, production, test, redis, mongo, storage, openapi
│   │   │   ├── urls.py asgi.py wsgi.py celery.py
│   │   │   ├── app/                    # in-app DRF surface (cookie auth)
│   │   │   │   ├── urls/               # per-domain url modules + __init__ aggregator
│   │   │   │   ├── views/              # per-domain ViewSets (issue/, cycle/, module/, page/, ...)
│   │   │   │   ├── serializers/        # per-domain serializers
│   │   │   │   ├── permissions/        # ROLE + allow_permission decorator + permission classes
│   │   │   │   ├── middleware/         # app-specific middleware
│   │   │   │   ├── apps.py
│   │   │   ├── api/                    # external API token surface (/api/v1/)
│   │   │   ├── space/                  # public/guest endpoints (/api/public/)
│   │   │   ├── authentication/         # /auth/* — credentials + OAuth providers, session
│   │   │   ├── analytics/              # analytics endpoints (separate from app/views/analytic)
│   │   │   ├── license/                # instance/license app + bgtasks + migrations
│   │   │   ├── bgtasks/                # Celery tasks (one module per concern)
│   │   │   ├── db/
│   │   │   │   ├── models/             # ORM models per domain
│   │   │   │   ├── migrations/         # 0001..0121 numbered migrations
│   │   │   │   ├── management/commands # custom manage.py commands
│   │   │   │   └── mixins.py           # AuditModel, SoftDeletionManager, ChangeTrackerMixin
│   │   │   ├── middleware/             # global middleware (db_routing, logger, request_body_size)
│   │   │   ├── throttles/              # DRF throttle classes
│   │   │   ├── seeds/data/             # seed JSON data
│   │   │   ├── utils/                  # filters/, paginator, exception_logger, issue_filters, etc.
│   │   │   ├── web/                    # tiny Django app for non-API HTML/static glue
│   │   │   ├── tests/                  # pytest test suite
│   │   ├── bin/                        # docker entrypoints (api/worker/beat/migrator)
│   │   ├── requirements/ requirements.txt pyproject.toml pytest.ini run_tests.py
│   │
│   └── proxy/                          # Caddy reverse proxy (Caddyfile.ce, config only)
│
├── packages/                           # all published as @plane/<name>, all `workspace:*`
│   ├── ui/                             # UI primitives (button, dropdown, modal, tooltip, ...)
│   ├── propel/                         # higher-level headless UI building blocks (Toast, …)
│   ├── editor/                         # Tiptap-based rich-text editor + Yjs helpers
│   ├── shared-state/                   # MobX stores shared across web/space/admin
│   ├── services/                       # cross-app HTTP service classes
│   ├── types/                          # TypeScript types (issues, project, workspace, page, …)
│   ├── hooks/                          # cross-app React hooks
│   ├── constants/                      # API_BASE_URL, SWR config, language, …
│   ├── i18n/                           # IntlMessageFormat translations + provider
│   ├── logger/                         # logger + loggerMiddleware (used by live)
│   ├── decorators/                     # @plane/decorators (registerController) for live controllers
│   ├── utils/                          # cross-app utility functions (cn, dates, …)
│   ├── codemods/                       # jscodeshift migrations + tests
│   ├── tailwind-config/                # shared Tailwind preset
│   └── typescript-config/              # tsconfig presets (react-router.json, library.json, …)
│
├── deployments/                        # aio, cli, kubernetes, swarm deployment assets
├── docs/                               # internal engineering notes (linting.md, design memos, ADRs)
├── docker-compose-local.yml            # local dev compose (postgres/valkey/rabbitmq/minio + api/worker/beat/migrator)
├── docker-compose.yml                  # production / self-hosted compose
├── pnpm-workspace.yaml                 # workspace + catalog declaration
├── turbo.json                          # task graph + globalEnv allow-list
├── .oxlintrc.json .oxfmtrc.json        # OxLint + oxfmt config (no ESLint/Prettier)
├── setup.sh                            # one-time bootstrap (envs, install)
├── CLAUDE.md AGENTS.md README.md
└── package.json                        # root scripts (turbo run *)
```

## Directory Purposes

### Frontend apps (`apps/web`, `apps/admin`, `apps/space`)

**`apps/<app>/app/`:**

- Purpose: React Router v7 entry. Contains the `root.tsx` layout, the `routes.ts` config, the route folders (`(home)/`, `(all)/`), the next/\* compat shims (web only), provider tree, error boundary, and 404 page.
- Contains: `root.tsx`, `routes.ts`, `provider.tsx`, `entry.client.tsx`, `error/`, `not-found.tsx`, `(group)/page.tsx` files.
- Key files: `apps/web/app/root.tsx`, `apps/web/app/routes.ts`, `apps/web/app/routes/core.ts`, `apps/web/app/routes/extended.ts`, `apps/web/app/provider.tsx`, `apps/web/app/compat/next/{link,navigation,script}`.

**`apps/<app>/core/`:**

- Purpose: All open-source product code. Resolved via the `@/*` TypeScript path alias (`./core/*`). Contains components, stores, services, hooks, lib, types, layouts, constants.
- Contains: `components/`, `store/`, `services/`, `hooks/`, `layouts/`, `lib/`, `types/`, `constants/`.

**`apps/<app>/ce/`:**

- Purpose: Community Edition overrides — module bodies that fill in the `@/plane-web/*` alias (`./ce/*`). Re-exports OSS implementations and registers CE-only stores/components. In private forks the alias is repointed to a sibling `ee/` directory; the OSS tree intentionally omits `ee/`.
- Contains: `store/`, `components/`, `hooks/`, `types/`. Mirrors the structure of `core/` but with smaller, opinionated modules.

**`apps/web/e2e/` and `apps/web/playwright/`:**

- Purpose: Playwright end-to-end tests + helper fixtures (`TimelinePage`, dependency-drag flows). `playwright-report/` and `test-results/` are CI artifact directories.

**`apps/web/helpers/`, `apps/web/styles/`, `apps/web/public/`:**

- Purpose: Tiny app-scoped helpers (`@/helpers/*` alias), Tailwind/CSS entry, and static assets respectively.

### `apps/live`

**`apps/live/src/`:**

- Purpose: TypeScript source for the realtime collaboration server.
- Subdirectories:
  - `controllers/` — Express HTTP controllers registered via `@plane/decorators` `registerController` (`collaboration.controller.ts`, `document.controller.ts`, `health.controller.ts`, `pdf-export.controller.ts`).
  - `extensions/` — Hocuspocus extensions in load order: `logger.ts`, `database.ts`, `redis.ts`, `title-sync.ts`, `title-update/`, `force-close-handler.ts`.
  - `lib/` — `auth.ts` (Hocuspocus `onAuthenticate`), `auth-middleware.ts`, `errors.ts` (`AppError`), `stateless.ts`, `pdf/`.
  - `services/` — `api.service.ts` (Axios base for live), `page/` (handler dispatch + `core.service.ts`, `extended.service.ts`, `project-page.service.ts`), `pdf-export/`, `user.service.ts`.
  - `schema/`, `types/`, `utils/`.
- Tests: `apps/live/tests/{lib,services}` (Vitest).

### `apps/api` (Django)

**`apps/api/plane/`:**

- Purpose: The Django project package. Each subdirectory is a Django app (`AppConfig` in `apps.py`).
- Subpackages:
  - `app/` — UI-facing endpoints (cookie auth). Files: `urls/<domain>.py`, `views/<domain>/*.py`, `serializers/<domain>.py`, `permissions/`.
  - `api/` — External token-auth API; mirrors `app/` layout (smaller surface).
  - `space/` — Public/anonymous deploy boards; mirrors `app/` layout (`urls/`, `views/`, `serializer/`, `utils/`).
  - `authentication/` — `/auth/*` views; `provider/{credentials,oauth}`, `adapter/`, `session.py`, `utils/`, `middleware/`, `rate_limit.py`.
  - `analytics/` — Analytics-specific endpoints.
  - `license/` — Instance/license model + DRF surface + its own `bgtasks/` and `migrations/`.
  - `bgtasks/` — Celery task modules (one per concern — see "Celery tasks" below).
  - `db/models/` — ORM models per domain (each file owns one or more related models).
  - `db/migrations/` — Numbered migration files (`0001_initial.py` … `0121_alter_estimate_type.py`).
  - `db/management/commands/` — Custom `manage.py` commands.
  - `db/mixins.py` — `AuditModel`, `SoftDeletionManager`, `ChangeTrackerMixin`.
  - `middleware/` — `db_routing.py` (read-replica routing), `logger.py`, `request_body_size.py`.
  - `throttles/` — DRF throttle classes.
  - `seeds/data/` — Seed JSON data.
  - `settings/` — `common.py`, `local.py`, `production.py`, `test.py`, plus topic mixins (`redis.py`, `mongo.py`, `storage.py`, `openapi.py`).
  - `utils/` — Cross-cutting helpers (filters, paginator, exception_logger, issue_filters, html_processor, …).
  - `tests/` — Pytest suite.
  - `web/` — Tiny Django app for non-API HTML/static glue.
- Container scripts: `apps/api/bin/docker-entrypoint-{api,worker,beat,migrator}*.sh`.
- Test runner: `apps/api/run_tests.py` (preferred over the stale `run_tests.sh`).

### `packages/`

Every package is published as `@plane/<name>` and consumed via `"workspace:*"`.

| Package                    | Purpose                                                           | Entry                                                |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `@plane/ui`                | UI primitives (Button, Dropdown, Modal, Tooltip, Tabs, Tables, …) | `packages/ui/src/index.ts`                           |
| `@plane/propel`            | Higher-level headless components (Toast, Form blocks)             | `packages/propel/src/`                               |
| `@plane/editor`            | Tiptap-based rich-text editor and Yjs helpers used by web + live  | `packages/editor/src/`                               |
| `@plane/shared-state`      | Cross-app MobX stores (`WorkItemFilterStore`, user, workspace)    | `packages/shared-state/src/store/index.ts`           |
| `@plane/services`          | Cross-app HTTP service classes (issue, cycle, module, …)          | `packages/services/src/index.ts`                     |
| `@plane/types`             | Cross-app TypeScript types                                        | `packages/types/src/index.ts`                        |
| `@plane/hooks`             | Cross-app React hooks                                             | `packages/hooks/src/`                                |
| `@plane/constants`         | Shared constants (`API_BASE_URL`, `WEB_SWR_CONFIG`, language)     | `packages/constants/src/`                            |
| `@plane/i18n`              | IntlMessageFormat translations + `TranslationProvider`            | `packages/i18n/src/locales/<lang>/translations.json` |
| `@plane/logger`            | `logger` instance + `loggerMiddleware` (Express)                  | `packages/logger/src/`                               |
| `@plane/decorators`        | Decorator helpers (e.g. `registerController` used by `apps/live`) | `packages/decorators/src/`                           |
| `@plane/utils`             | Generic utilities (`cn`, date helpers, `resolveGeneralTheme`)     | `packages/utils/src/`                                |
| `@plane/codemods`          | jscodeshift migrations + Vitest tests                             | `packages/codemods/`                                 |
| `@plane/tailwind-config`   | Tailwind preset shared across apps                                | `packages/tailwind-config/`                          |
| `@plane/typescript-config` | tsconfig presets (`react-router.json`, library)                   | `packages/typescript-config/`                        |

### `deployments/`

- `aio/` — all-in-one self-hosted bundle.
- `cli/` — Plane CLI deployment helpers.
- `kubernetes/` — Helm/Kustomize manifests.
- `swarm/` — Docker Swarm deployment assets.

### `docs/`

- Engineering notes, ADRs (`docs/adr/`), PRDs (`docs/prd/`), and feature-specific design memos.
- `docs/linting.md` — OxLint + oxfmt rules.
- Other examples present: `docs/timeline-dependency-follow-up-tasks.md`, `docs/timeline-e2e-test-environment-plan.md`.

## Key File Locations

### Entry Points

- Web SPA bootstrap: `apps/web/app/entry.client.tsx`, `apps/web/app/root.tsx`.
- Admin SPA bootstrap: `apps/admin/app/entry.client.tsx`, `apps/admin/app/root.tsx`.
- Space SPA bootstrap: `apps/space/app/entry.client.tsx`, `apps/space/app/root.tsx`.
- Route configs: `apps/web/app/routes.ts`, `apps/admin/app/routes.ts`, `apps/space/app/routes.ts`.
- Live server: `apps/live/src/start.ts` → `apps/live/src/server.ts` → `apps/live/src/hocuspocus.ts`.
- Django WSGI/ASGI: `apps/api/plane/wsgi.py`, `apps/api/plane/asgi.py`.
- Django root URL conf: `apps/api/plane/urls.py`.
- Celery app: `apps/api/plane/celery.py`.

### Configuration

- pnpm workspace + catalog: `pnpm-workspace.yaml`.
- Turborepo tasks + `globalEnv`: `turbo.json`.
- Lint/format: `.oxlintrc.json`, `.oxfmtrc.json`.
- Web TS path aliases: `apps/web/tsconfig.json` (`@/*` → `./core/*`, `@/plane-web/*` → `./ce/*`, `@/app/*` → `./app/*`, `@/helpers/*`, `@/styles/*`).
- Web Vite aliases (`next/*` shims): `apps/web/vite.config.ts`.
- Django settings: `apps/api/plane/settings/common.py`, `local.py`, `production.py`, `test.py`.
- Pytest defaults: `apps/api/pytest.ini` (`--reuse-db --nomigrations -vs`).
- Local Docker compose: `docker-compose-local.yml`.

### Core Logic

- Frontend HTTP base: `apps/web/core/services/api.service.ts`.
- Frontend MobX root: `apps/web/core/store/root.store.ts` and `apps/web/ce/store/root.store.ts`.
- Frontend store singleton + provider: `apps/web/core/lib/store-context.tsx`.
- Issue feature root store: `apps/web/core/store/issue/root.store.ts`.
- Issue per-context stores: `apps/web/core/store/issue/{project,cycle,module,workspace,profile,archived,workspace-draft,project-views,issue-details}/`.
- Issue feature components: `apps/web/core/components/issues/{issue-modal,issue-detail,issue-layouts,peek-overview,relations,...}`.
- Issue layouts (kanban/list/calendar/spreadsheet/gantt): `apps/web/core/components/issues/issue-layouts/{kanban,list,calendar,spreadsheet,gantt}/`.
- Live `Database` extension (Yjs persistence): `apps/live/src/extensions/database.ts`.
- Live page service dispatch: `apps/live/src/services/page/handler.ts`.
- Django DRF base: `apps/api/plane/app/views/base.py`.
- Django ORM base: `apps/api/plane/db/models/base.py` (`BaseModel`).
- Django audit + soft-delete mixins: `apps/api/plane/db/mixins.py`.
- Issue ViewSet (`POST /issues/`): `apps/api/plane/app/views/issue/base.py` (`IssueViewSet.create`).
- Issue serializers: `apps/api/plane/app/serializers/issue.py`.
- Issue model: `apps/api/plane/db/models/issue.py`.

### Celery Tasks

All Celery tasks live in `apps/api/plane/bgtasks/` as standalone modules. Notable ones:

- `issue_activities_task.py` — audit trail + notification fan-out for issue events (called from `IssueViewSet.create`, `update`, …).
- `issue_description_version_task.py`, `issue_description_version_sync.py`, `issue_version_sync.py` — page/issue version persistence.
- `webhook_task.py` — outbound webhook delivery (`model_activity` task).
- `email_notification_task.py` — batched email notifications (5-minute Beat schedule).
- `notification_task.py` — in-app notifications.
- `issue_automation_task.py` — daily archive-and-close automation.
- `cleanup_task.py` — daily DB cleanup (api logs, page versions, issue description versions, webhook logs, email notification logs).
- `deletion_task.py` — hard-delete sweep.
- `export_task.py`, `analytic_plot_export.py`, `exporter_expired_task.py` — exports + cleanup.
- `magic_link_code_task.py`, `forgot_password_task.py`, `user_activation_email_task.py`, `user_deactivation_email_task.py`, `user_email_update_task.py` — auth-related emails.
- `workspace_invitation_task.py`, `project_invitation_task.py`, `project_add_user_email_task.py` — invitation emails.
- `workspace_seed_task.py` — workspace bootstrap.
- `recent_visited_task.py`, `event_tracking_task.py`, `storage_metadata_task.py` — telemetry-style tasks.
- License-specific tasks: `apps/api/plane/license/bgtasks/` (e.g. `tracer.py`).

Beat schedule is registered in `apps/api/plane/celery.py` (`app.conf.beat_schedule`); editable schedules use `django_celery_beat.schedulers.DatabaseScheduler`.

### Shared types

- `packages/types/src/issues.ts`, `issues/`, `state.ts`, `cycle/`, `module/`, `project/`, `workspace.ts`, `page/`, `editor/` — domain types.
- `packages/types/src/index.ts` — barrel export.
- Cross-app stores: `packages/shared-state/src/store/{user.store.ts,workspace.store.ts,work-item-filters/,rich-filters/}`.
- Cross-app services: `packages/services/src/{issue,cycle,module,project,workspace,user,auth,…}/index.ts` — each has its own folder mirroring the domain.

### Testing

- E2E: `apps/web/e2e/`, `apps/web/playwright/`, run via `pnpm --filter=web test:e2e`.
- Live unit/integration: `apps/live/tests/`, run via `pnpm --filter=live test`.
- Codemods: `packages/codemods/`, run via `pnpm --filter=@plane/codemods run test`.
- Backend: `apps/api/tests/` and per-app `tests/` directories, run via `apps/api/run_tests.py [-u|-c|-s]`.
- Most other frontend packages have **no test harness** by design.

## Naming Conventions

**Files (TypeScript/React):**

- Components: kebab-case `.tsx` (e.g. `apps/web/core/components/issues/issue-modal/modal.tsx`, `archive-issue-modal.tsx`).
- Stores: `<domain>.store.ts` (e.g. `apps/web/core/store/issue/issue.store.ts`, `cycle.store.ts`).
- Services: `<domain>.service.ts` (e.g. `apps/web/core/services/issue/issue.service.ts`).
- Hooks: `use-*.ts` / `use-*.tsx` (e.g. `apps/web/core/hooks/use-debounce.tsx`, `hooks/store/use-issue.ts`).
- Types ambient declarations: `*.d.ts` (e.g. `apps/web/app/types/next-link.d.ts`).

**Files (Python):**

- Modules: snake_case `.py` (e.g. `apps/api/plane/bgtasks/issue_activities_task.py`).
- Per-domain ViewSets: `apps/api/plane/app/views/<domain>/{base,activity,archive,attachment,...}.py`.
- Per-domain serializers: `apps/api/plane/app/serializers/<domain>.py`.
- Per-domain models: `apps/api/plane/db/models/<domain>.py`.
- Migrations: `0NNN_<short_description>.py` (`apps/api/plane/db/migrations/0121_alter_estimate_type.py`).

**Directories:**

- React route groups: `(group-name)/` parens — purely cosmetic, route paths are declared in `routes.ts` (e.g. `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/`).
- Dynamic params: `[paramName]/` brackets within route folders.
- Workspace packages: kebab-case under `packages/` (e.g. `packages/shared-state/`); imported as `@plane/<name>` matching the package's `package.json` name.
- Apps: lowercase short names under `apps/` (`apps/web`, `apps/api`).

**Class/Type naming:**

- React components: PascalCase (`AppProvider`, `IssueViewSet`, `CoreRootStore`).
- TypeScript interfaces for stores: `I<Name>` (`IIssueStore`, `IIssueRootStore`, `IRootStore`).
- TypeScript types: `T<Name>` (`TIssue`, `TIssueLink`, `TIssueServiceType`).
- Enums (avoided in new code per CLAUDE.md): `E<Name>` legacy (e.g. `EIssueServiceType`); prefer string literal unions.
- Python ViewSets: `<Domain>ViewSet` (`IssueViewSet`); endpoints: `<Action>Endpoint` (`IssueListEndpoint`, `IssueDetailEndpoint`).
- Python serializers: `<Domain><Variant>Serializer` (`IssueCreateSerializer`, `IssueDetailSerializer`).

## Where to Add New Code

### New product feature (UI-only)

- **Components:** `apps/web/core/components/<feature>/...` (kebab-case files; folder per sub-feature).
- **Components consumed only by CE/EE:** `apps/web/ce/components/<feature>/` and re-export from `core/` via the `@/plane-web/*` alias.
- **Hooks:** `apps/web/core/hooks/<feature>/` for feature-scoped hooks; top-level for generic hooks.
- **Page route:** add a `layout.tsx` + `page.tsx` under `apps/web/app/(all)/[workspaceSlug]/(projects)/<feature>/` AND register the route in `apps/web/app/routes/core.ts` (or `extended.ts`). The folder alone does not create a route.

### New MobX store

- **Open-source store:** `apps/web/core/store/<feature>/<name>.store.ts`. Wire into `CoreRootStore` constructor in `apps/web/core/store/root.store.ts`. Add interface `I<Name>` and class `<Name>Store`.
- **CE-only store:** `apps/web/ce/store/<feature>/<name>.store.ts`. Wire into `RootStore` (extending `CoreRootStore`) in `apps/web/ce/store/root.store.ts`. See `TimeLineStore` for the canonical pattern.
- **Cross-app store:** `packages/shared-state/src/store/<feature>/` and re-export from `packages/shared-state/src/store/index.ts`.

### New HTTP service

- **App-local:** `apps/web/core/services/<feature>/<name>.service.ts`, extend `APIService` from `@/services/api.service`.
- **Cross-app:** `packages/services/src/<feature>/<name>.service.ts` and re-export from `packages/services/src/index.ts`. Use this when admin/space need the same service.

### New REST endpoint

- **In-app (cookie auth):**
  1. Model: add field/model to `apps/api/plane/db/models/<domain>.py` and create a migration with `python manage.py makemigrations`.
  2. Serializer: `apps/api/plane/app/serializers/<domain>.py` (extends `BaseSerializer`).
  3. View: `apps/api/plane/app/views/<domain>/<file>.py` (extends `BaseAPIView` or `BaseViewSet`). Decorate methods with `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ...])`.
  4. URL: `apps/api/plane/app/urls/<domain>.py` (the aggregator in `urls/__init__.py` picks it up).
  5. Export the view from `apps/api/plane/app/views/__init__.py`.
- **External token API:** mirror in `apps/api/plane/api/{urls,views,serializers}/`.
- **Public/anonymous:** mirror in `apps/api/plane/space/{urls,views,serializer}/`.

### New Celery task

- File: `apps/api/plane/bgtasks/<feature>_task.py`. Define a `@shared_task` function.
- Invocation: `from plane.bgtasks.<feature>_task import <task>; <task>.delay(...)` from any view or signal.
- Schedule (if recurring): add to `app.conf.beat_schedule` in `apps/api/plane/celery.py` with a `crontab(...)` cadence.

### New shared TypeScript type

- File: `packages/types/src/<domain>.ts` or `packages/types/src/<domain>/index.ts`.
- Export from `packages/types/src/index.ts` (barrel).
- Consume as `import type { TIssue } from "@plane/types"`.

### New shared UI primitive

- File: `packages/ui/src/<feature>/<component>.tsx`.
- Export from `packages/ui/src/index.ts`.
- Consume as `import { Button } from "@plane/ui"`.

### New environment variable

- Add to `apps/<app>/.env.example`.
- If the var must reach the Vite-built browser bundle, also add it to `turbo.json` `globalEnv`. Only `VITE_*` prefixed vars are exposed to the client (see `apps/web/vite.config.ts`).

### New language

- Add JSON file under `packages/i18n/src/locales/<lang>/translations.json`.
- Update `packages/i18n/src/types/language.ts` and `packages/i18n/src/constants/language.ts`.
- Update the dynamic import switch in `packages/i18n/src/` (see `CONTRIBUTING.md` for the exact entry point).

## Special Directories

**`apps/<app>/.react-router/`:**

- Purpose: React Router v7 generated typegen output.
- Generated: Yes (by `react-router typegen`).
- Committed: No (cleaned by the package's `clean` script).

**`apps/web/playwright-report/`, `apps/web/test-results/`:**

- Purpose: Playwright HTML reports and per-run test artifacts.
- Generated: Yes (by `pnpm --filter=web test:e2e`).
- Committed: No.

**`apps/<app>/dist/`, `apps/<app>/build/`, `packages/<pkg>/dist/`:**

- Purpose: Build outputs (`react-router build`, `tsdown`).
- Generated: Yes.
- Committed: No.

**`apps/api/logs/`, `apps/api/static/`:**

- Purpose: Runtime logs and Django collected static files.
- Generated: Yes (Django `collectstatic`, runtime logging).
- Committed: No.

**`apps/api/plane/db/migrations/`:**

- Purpose: Django migration history.
- Generated: Initially via `makemigrations` but committed as the source of truth.
- Committed: Yes.

**`.planning/`:**

- Purpose: GSD planning artifacts (this directory).
- Generated: Yes, by `/gsd-*` commands.
- Committed: Project-dependent — typically yes for `codebase/`, varies for phase artifacts.

**`node_modules/` (root + per-app + per-package):**

- Purpose: pnpm-resolved dependency graphs.
- Generated: Yes (`pnpm install`).
- Committed: No.

**`apps/<app>/nginx/`:**

- Purpose: nginx configuration baked into the production container image (separate from Caddy proxy).
- Committed: Yes.

**`apps/proxy/`:**

- Purpose: Caddy reverse proxy config only — no pnpm package, no source.
- Committed: Yes.

---

_Structure analysis: 2026-05-03_
