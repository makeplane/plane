---
last_mapped: 2026-06-29
focus: arch
---

# Structure

## Root

- `package.json` - root scripts, package manager, Node engine, lint-staged config.
- `pnpm-workspace.yaml` - workspace package globs and dependency catalog.
- `turbo.json` - task graph, global dependencies/env, outputs, and cache behavior.
- `docker-compose.yml` - production/self-host service graph.
- `docker-compose-local.yml` - local backing services and local API service.
- `docker-compose-test.yml` - isolated API test stack.
- `.github/workflows/` - CI build, lint, format, type, API lint, CodeQL, i18n sync, and release/deployment workflows.
- `AGENTS.md` - agent instructions and local command conventions.

## Apps

- `apps/web/` - main Plane app.
  - `apps/web/app/` - React Router root, route configuration, layouts, assets, error boundaries.
  - `apps/web/core/` - shared web app components, hooks, layouts, services, and stores.
  - `apps/web/ce/` - community edition product components and stores.
  - `apps/web/styles/` - global CSS.
  - `apps/web/nginx/` and `apps/web/Dockerfile.web` - deployment packaging.
- `apps/admin/` - admin console.
  - `apps/admin/app/` - React Router routes and root.
  - `apps/admin/components/` - admin settings screens, instance setup, authentication config.
  - `apps/admin/store/`, `apps/admin/hooks/`, `apps/admin/providers/` - admin state and app glue.
- `apps/space/` - public spaces/issues app.
  - `apps/space/app/` - React Router routes and root.
  - `apps/space/components/` - public issue/account/auth/project UI.
  - `apps/space/store/`, `apps/space/hooks/`, `apps/space/helpers/` - app state and utilities.
- `apps/live/` - realtime service.
  - `apps/live/src/server.ts` - Express server setup.
  - `apps/live/src/start.ts` - process entry.
  - `apps/live/src/controllers/` - HTTP/WebSocket route controllers.
  - `apps/live/src/extensions/` - Hocuspocus extensions.
  - `apps/live/src/services/` - API/page/PDF services.
  - `apps/live/tests/` - Vitest test directory.
- `apps/api/` - Django backend.
  - `apps/api/plane/settings/` - Django settings modules.
  - `apps/api/plane/db/models/` - data model definitions.
  - `apps/api/plane/app/views/` - main application API views.
  - `apps/api/plane/app/serializers/` - DRF serializers.
  - `apps/api/plane/authentication/` - auth providers, middleware, views, adapters.
  - `apps/api/plane/space/` - public space API.
  - `apps/api/plane/license/` - instance/license API and telemetry.
  - `apps/api/plane/bgtasks/` - Celery tasks.
  - `apps/api/plane/tests/` - API unit, contract, and smoke tests.

## Packages

- `packages/ui/src/` - shared component library.
  - Components are grouped by folder: `button`, `dropdown`, `modals`, `tables`, `tabs`, `avatar`, `form-fields`, `popover`, etc.
  - Storybook stories are colocated, e.g. `packages/ui/src/avatar/avatar.stories.tsx`.
- `packages/services/src/` - API clients grouped by domain: `auth`, `workspace`, `project`, `issue`, `cycle`, `module`, `file`, `developer`, `dashboard`, `state`, `label`, `intake`.
- `packages/shared-state/src/` - MobX store primitives and filter state.
- `packages/editor/src/` - editor core and CE/EE extension split.
- `packages/types/src/` - shared domain contracts.
- `packages/constants/src/` - endpoint, auth, fetch key, event tracker, and other constants.
- `packages/i18n/src/` - translations and i18next integration; scripts live under `packages/i18n/scripts/`.
- `packages/codemods/` - codemod scripts and Vitest tests.
- `packages/decorators/src/` - decorator helpers for controller and REST metadata.
- `packages/logger/src/` - logging utilities.

## Naming Patterns

- React component files use kebab-case filenames and PascalCase component exports.
- Package names use `@plane/<name>` and are imported internally via `workspace:*`.
- Service classes use domain names such as `WorkspaceService` in `packages/services/src/workspace/workspace.service.ts`.
- Django model modules use domain names in `apps/api/plane/db/models/`.
- Django view files are organized by domain and action, e.g. `apps/api/plane/app/views/issue/comment.py`.
- Test files use `*.test.ts`/`*.spec.ts` for Vitest and `test_*.py` for pytest.

## Entry Points

- Root frontend command: `pnpm dev`.
- Main web app: `apps/web/app/root.tsx` and `apps/web/app/routes.ts`.
- Admin app: `apps/admin/app/root.tsx` and `apps/admin/app/routes.ts`.
- Space app: `apps/space/app/root.tsx` and `apps/space/app/routes.ts`.
- Live service: `apps/live/src/start.ts`.
- Django API: `apps/api/manage.py`, `apps/api/plane/settings/*.py`, and `apps/api/plane/urls.py`.

## Generated Or Build Directories

- Turbo and package build artifacts include `.turbo/`, `dist/`, `build/`, `.react-router/`, and Storybook output.
- API static collection uses `apps/api/plane/static-assets/` according to settings.
- These should generally not be treated as source during planning.

