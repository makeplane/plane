---
last_mapped: 2026-06-29
focus: tech
---

# Stack

## Runtime And Tooling

- Root project: private AGPL-3.0 Plane monorepo at `package.json`, version `1.3.1`.
- Package manager: pnpm `11.3.0`, declared in `package.json`.
- Monorepo orchestration: Turborepo in `turbo.json`; root scripts delegate to `turbo run build`, `turbo run dev`, `turbo run check`, and related fix/check tasks.
- Node requirement: `>=22.18.0` from `package.json`.
- Frontend language: TypeScript with React `18.3.1`, React Router `7.15.x`, Vite `8.0.16`, and Tailwind CSS `4.1.17`.
- Backend language: Python/Django in `apps/api`, with Django settings under `apps/api/plane/settings/`.
- Live collaboration service: TypeScript Node service in `apps/live`, built with `tsdown` and served by Express + Hocuspocus.
- Formatting/linting: OxFmt and OxLint for TypeScript packages via `.oxfmtrc.json`, `.oxlintrc.json`, package scripts, and root `lint-staged`.
- Python formatting/linting: Ruff configuration in `apps/api/pyproject.toml`.

## Workspace Layout

- pnpm workspace includes `apps/*` and `packages/*`, excluding `apps/api` and `apps/proxy`, as defined in `pnpm-workspace.yaml`.
- App packages:
  - `apps/web` - main Plane web app, React Router app on dev port 3000.
  - `apps/admin` - admin UI, React Router app on dev port 3001.
  - `apps/space` - public/site-facing spaces app, React Router app on dev port 3002.
  - `apps/live` - realtime rich-text collaboration and export service.
  - `apps/api` - Django API, not part of the pnpm workspace.
  - `apps/proxy` - Caddy proxy configuration and Docker image context.
- Shared packages:
  - `packages/ui` - shared React UI components and Storybook.
  - `packages/services` - Axios API service classes.
  - `packages/shared-state` - MobX state primitives and filter stores.
  - `packages/editor` - TipTap/ProseMirror editor foundation.
  - `packages/types` - shared TypeScript domain types.
  - `packages/constants`, `packages/utils`, `packages/hooks`, `packages/i18n`, `packages/logger`, `packages/decorators`, `packages/propel`.

## Frontend Apps

- `apps/web/package.json` uses `react-router dev --port 3000`, `react-router build`, and `serve -s build/client`.
- `apps/admin/package.json` uses the same React Router build path and runs on port 3001.
- `apps/space/package.json` uses React Router server output via `react-router-serve ./build/server/index.js`.
- All three frontends depend on internal packages with `workspace:*` and external packages via `catalog:` versions from `pnpm-workspace.yaml`.
- Shared providers in `apps/web/app/provider.tsx` include MobX store context, `@plane/i18n`, `@plane/propel/toast`, SWR config, and wrapper components.
- Route config is explicit:
  - `apps/web/app/routes.ts` merges `coreRoutes` and `extendedRoutes`.
  - `apps/admin/app/routes.ts` declares auth/home and admin dashboard sections.
  - `apps/space/app/routes.ts` declares index, project, issue, and catch-all routes.

## Backend API

- Django settings start in `apps/api/plane/settings/common.py`; local, production, and test variants import common settings.
- Main URL routing in `apps/api/plane/urls.py` mounts:
  - `/api/` -> `plane.app.urls`
  - `/api/public/` -> `plane.space.urls`
  - `/api/instances/` -> `plane.license.urls`
  - `/api/v1/` -> `plane.api.urls`
  - `/auth/` -> `plane.authentication.urls`
  - `/` -> `plane.web.urls`
- Core Django apps include `plane.app`, `plane.space`, `plane.bgtasks`, `plane.db`, `plane.license`, `plane.api`, and `plane.authentication`.
- Database models live under `apps/api/plane/db/models/`, with domain modules for workspaces, projects, issues, cycles, modules, pages, labels, webhooks, integrations, sessions, and users.
- API serializers live under `apps/api/plane/app/serializers/`; views are grouped under `apps/api/plane/app/views/`.
- Background jobs live under `apps/api/plane/bgtasks/` and are imported through Celery settings in `apps/api/plane/settings/common.py`.

## Build Outputs

- Turbo `build` task outputs `dist/**`, `build/**`, and `.react-router/**`.
- Shared packages generally build with `tsdown` and expose `dist/index.js` and `dist/index.d.ts`.
- React Router apps build to app-specific `build/` and generated `.react-router/` artifacts.
- Python backend uses Docker images and does not produce a pnpm build artifact.

## Primary Commands

- `pnpm dev` - runs Turbo dev across apps/packages.
- `pnpm build` - builds all packages/apps through Turbo.
- `pnpm check` - runs format, lint, and type checks through Turbo.
- `pnpm fix` - runs format and lint fix tasks.
- `pnpm --filter=@plane/ui storybook` - starts shared UI Storybook on port 6006.
- API tests run through `docker-compose-test.yml` rather than a root pnpm task.

