---
last_mapped: 2026-06-29
focus: arch
---

# Architecture

## System Shape

Plane is a multi-service self-hosted project management system:

- React Router frontend apps provide user-facing, admin, and public space experiences.
- A Django REST API owns persistence, auth, permissions, background jobs, and core business logic.
- A Node/Express live service owns realtime collaboration around editor documents and related export functionality.
- Shared TypeScript packages provide UI components, domain types, API clients, utilities, editor primitives, state helpers, and logging/decorator infrastructure.
- Docker Compose wires the runtime services to PostgreSQL, Redis/Valkey, RabbitMQ, MinIO, and Caddy.

## Frontend Architecture

- `apps/web` is the primary authenticated app. It is split into route files under `apps/web/app/`, community edition implementation under `apps/web/ce/`, and shared core implementation under `apps/web/core/`.
- `apps/web/app/routes.ts` merges core and extended route trees, then adds a catch-all route.
- `apps/web/app/root.tsx` is the document/root layout. It installs React Router primitives, theme provider, metadata, global CSS, and error/hydration fallbacks.
- `apps/web/app/provider.tsx` composes global runtime providers: store context, progress bar, i18n, toast, app wrappers, and SWR.
- `apps/admin` follows the same React Router app pattern with admin-specific pages in `apps/admin/app/(all)/(dashboard)/`.
- `apps/space` is a smaller public-facing React Router app for public projects/issues and auth flows.
- Frontend domain UI is organized by product capability: examples include `apps/web/core/components/issues/`, `apps/web/core/components/projects/`, `apps/web/core/components/pages/`, `apps/web/ce/components/cycles/`, and `apps/web/ce/components/modules/`.
- Store implementations in `apps/web/core/store/` and `apps/web/ce/store/` hold app-specific state, while `packages/shared-state` contains shared MobX primitives and filter stores.

## Backend Architecture

- `apps/api/plane/settings/common.py` configures Django apps, middleware, DRF, database/cache/storage, Celery, cookies, CORS/CSRF, URLs, and retention windows.
- `apps/api/plane/urls.py` is the top-level URL composition point.
- Domain models are centralized in `apps/api/plane/db/models/`.
- API layers are conventional Django/DRF:
  - serializers in `apps/api/plane/app/serializers/`
  - views in `apps/api/plane/app/views/`
  - URL modules under `apps/api/plane/app/urls/`, `apps/api/plane/api/urls/`, `apps/api/plane/space/urls/`, and auth/license URL modules.
- The API is divided into application routes (`/api/`), public space routes (`/api/public/`), instance/license routes (`/api/instances/`), versioned routes (`/api/v1/`), and auth routes (`/auth/`).
- Middleware adds CORS, security, static serving, custom sessions, CSRF, auth, current-request user tracking, gzip, request body limits, API token logging, and request logging.
- Background task code under `apps/api/plane/bgtasks/` is imported via `CELERY_IMPORTS` in settings.

## Live Collaboration Architecture

- `apps/live/src/start.ts` owns process startup, graceful shutdown, and global error handlers.
- `apps/live/src/server.ts` owns Express setup, middleware, controller registration, Hocuspocus initialization, Redis initialization, and shutdown.
- Controller classes live under `apps/live/src/controllers/`.
- Hocuspocus extensions live under `apps/live/src/extensions/`; Redis-backed admin command fanout is implemented in `apps/live/src/extensions/redis.ts`.
- Live service page/document integration is organized under `apps/live/src/services/page/`.
- PDF export logic lives under `apps/live/src/services/pdf-export/` and `apps/live/src/lib/pdf/`.

## Shared Package Boundaries

- `packages/services` is the browser API client layer. It wraps Axios in `packages/services/src/api.service.ts` and exposes domain services such as workspace, cycle, module, auth, file, issue, and project services.
- `packages/types` defines TypeScript contracts shared by apps and services.
- `packages/ui` owns reusable UI primitives, form controls, dropdowns, popovers, modals, tables, tabs, tags, avatars, and Storybook stories.
- `packages/editor` owns the rich-text editor foundation. It includes core TipTap extensions, CE/EE extension boundaries, file plugins, menus, slash commands, tables, images, mentions, and work-item embeds.
- `packages/shared-state` provides MobX stores and rich/work-item filter adapters for shared state scenarios.
- `packages/constants` centralizes endpoint constants, auth constants, fetch keys, and event tracker constants.
- `packages/decorators` supplies controller/rest decorator infrastructure used by the live service.
- `packages/logger` supplies shared logging and Express middleware used in `apps/live/src/server.ts`.

## Data Flow

- Browser apps call domain service classes in `packages/services/src/**`.
- Service classes call Django endpoints using `APIService`, with credentials included.
- Django views validate and serialize request/response data through serializers and persist through models under `apps/api/plane/db/models/`.
- Background work is queued through Celery/RabbitMQ and executed by worker containers.
- File and editor assets use S3-compatible storage configured in Django settings.
- Live collaborative editing connects frontend/editor behavior to `apps/live`, which coordinates with Redis and the API.

## Important Architectural Constraints

- Internal TypeScript package dependencies should use `workspace:*`; external dependencies should use `catalog:` as shown in `pnpm-workspace.yaml`.
- `apps/api` is intentionally excluded from pnpm workspace operations; API checks/tests use Python and Docker commands.
- Many frontend app files contain compatibility wrappers for former Next.js assumptions, e.g. `apps/web/app/compat/next/`, `apps/admin/app/compat/next/`, and `apps/space/app/compat/next/`.
- Changes to work item, page, issue, cycle, or module domains often cross backend models/serializers/views, frontend services, frontend stores, and UI components.

