# Project State

_Last updated: 2026-08-11_

## Project Summary

Plane — open-source project management (issues, cycles/sprints, modules, views, pages, analytics). AGPL-3.0. Monorepo: Django REST backend + three React Router v7 frontends + a realtime collab server, orchestrated with pnpm/Turborepo.

## Technology Stack

- **Backend (`apps/api`)**: Django 5.2 + DRF 3.17, Celery 5.5 (+ celery-beat) for background jobs, Django Channels 4.3 (ASGI/uvicorn), Postgres (psycopg 3), Redis (cache + channels), RabbitMQ (Celery broker), S3-compatible storage via django-storages/boto3 (Minio locally), OpenTelemetry instrumentation, OpenAI SDK integration, Slack SDK.
- **Frontends (`apps/web`, `apps/admin`, `apps/space`)**: React Router v7 (framework mode, not Next.js), TypeScript strict, MobX for state (via `packages/shared-state`), Tailwind (`packages/tailwind-config`).
- **Realtime editor server (`apps/live`)**: Node.js, Hocuspocus + Tiptap for collaborative editing, built with `tsdown`, tested with Vitest.
- **Proxy (`apps/proxy`)**: Caddy (`Caddyfile.ce`), fronts web/admin/space/api/live in Docker deployments.
- **Package manager / build**: pnpm workspaces + pnpm `catalog:` for shared dep versions, Turborepo for task orchestration, Husky + lint-staged for pre-commit.
- **Lint/format**: OxLint (`.oxlintrc.json`) + oxfmt (`.oxfmtrc.json`) — not ESLint/Prettier.
- **Editor**: `packages/editor` (Tiptap-based), shared by web/space/live.

## Architecture

- Monorepo with `apps/*` (deployable units) and `packages/*` (shared libraries, all `workspace:*`).
- Three separate React Router frontends rather than one app with route groups: `web` (main product, port 3000), `admin` (instance/"god mode" admin, port 3001), `space` (public/published views, port 3002). Each has its own `app/`, `core|components`, `hooks`, `store` dirs and imports shared UI/state from `packages/`.
- `apps/api` is a standard Django project: `plane/app` (main REST views/serializers/urls), `plane/api` (public API), `plane/space` (space app's API), `plane/db/models` (data models), `plane/authentication` (session-based auth, rate limiting), `plane/bgtasks` (Celery tasks), `plane/settings` (`local.py`/`production.py`/`test.py`).
- `apps/live` is a standalone Node service (Hocuspocus provider) that backs the collaborative rich-text editor used by web/space; talks to `apps/api` for persistence/auth.
- State management: MobX stores live in `packages/shared-state`; frontend apps consume via hooks (`core/hooks/store/*` in each app).
- Deployment: Docker Compose services — `web`, `admin`, `space`, `api`, `worker`, `beat-worker`, `migrator`, `live`, `plane-db` (Postgres), `plane-redis`, `plane-mq` (RabbitMQ), `plane-minio`, `proxy` (Caddy). Also packaged as `deployments/{aio,cli,kubernetes,swarm}`.
- A knowledge graph of `apps/web` exists at `graphify-out/` (AST-derived, 7k+ nodes) — see `CLAUDE.md` root instructions for the required query-before-grep workflow when working in `apps/web`. It does not cover `apps/api`, `apps/admin`, `apps/space`, `apps/live`.

## Repository Structure

```
apps/
  web/      main product frontend (React Router v7)
  admin/    instance admin frontend (React Router v7)
  space/    public/published-views frontend (React Router v7)
  api/      Django REST backend
  live/     realtime collaborative editor server (Node/Hocuspocus)
  proxy/    Caddy reverse proxy (Dockerfile.ce, Caddyfile.ce)
packages/
  editor, ui, types, i18n, hooks, utils, constants,
  shared-state (MobX stores), services, propel, logger,
  decorators, codemods, tailwind-config, typescript-config
deployments/  aio, cli, kubernetes, swarm packaging
docs/ai/      this file (AI agent project memory)
graphify-out/ generated knowledge graph for apps/web (do not hand-edit)
```

## Important Entry Points

- Web app routes: `apps/web/app/routes/*`, shared logic in `apps/web/core/`.
- Admin app: `apps/admin/app/`.
- Space app: `apps/space/app/`.
- Django URLs: `apps/api/plane/{app,api,space}/urls/`.
- Django settings: `apps/api/plane/settings/{local,production,test}.py`.
- Django entrypoint: `apps/api/manage.py`.
- Live server entrypoint: `apps/live/src/` → `dist/start.mjs`.
- MobX store roots: `packages/shared-state`, wired into each app via `core/hooks/store` / `core/lib/store-context.tsx`.

## Data & Integrations

- Primary DB: Postgres (via `psycopg`, `dj-database-url`).
- Cache/session/channels backend: Redis.
- Async task queue: Celery, broker = RabbitMQ (`plane-mq`), results via `django-celery-results`, scheduled tasks via `django-celery-beat`.
- Object storage: S3-compatible (`django-storages` + `boto3`), Minio for local/self-hosted.
- Auth: Django session-based auth (`apps/api/plane/authentication/session.py`), with rate limiting (`rate_limit.py`).
- AI: OpenAI API integration (`openai` SDK, `GPT_ENGINE`/`OPENAI_API_KEY`/`OPENAI_API_BASE` env vars) for AI features (e.g. Pages AI).
- Notifications/integrations: Slack SDK.
- Observability: OpenTelemetry (Django instrumentation + OTLP exporter), Scout APM, PostHog analytics.
- Realtime collaboration: Hocuspocus/Tiptap protocol between frontends and `apps/live`.

## Development Commands

- Install: `pnpm install` (Node >=22.18.0, pnpm pinned to 11.3.0 via `packageManager`).
- Dev (all apps): `pnpm dev` (web:3000, admin:3001, space:3002 concurrently).
- Dev (single app): `pnpm turbo run dev --filter=<app>` (e.g. `--filter=web`).
- Build: `pnpm build` (turbo, all packages/apps).
- Checks (format+lint+types): `pnpm check`; individually `pnpm check:lint`, `pnpm check:format`, `pnpm check:types`.
- Auto-fix: `pnpm fix` (`pnpm fix:format`, `pnpm fix:lint`).
- Storybook (UI package): `pnpm --filter=@plane/ui storybook` (port 6006).
- Backend tests (Docker, isolated stack): prereq `./setup.sh` once (generates `apps/api/.env`); full suite `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`; subset `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`; teardown `docker compose -f docker-compose-test.yml down -v`. Details: `apps/api/tests/RUNNING_TESTS.md`, `apps/api/tests/TESTING_GUIDE.md`.
- Live server tests: `pnpm --filter=live test` / `test:watch` / `test:coverage` (Vitest).
- Local full stack: `docker-compose-local.yml`; production-style: `docker-compose.yml`.
- Knowledge graph refresh (apps/web only): `graphify update .`.

## Architectural Decisions

- **Decision**: React Router v7 (framework mode) for web/admin/space, not Next.js.
  **Reason**: Confirmed by `react-router dev/build` scripts and `app/` route-file structure in all three frontends.
  **Do not change unless**: A deliberate, repo-wide migration is planned and agreed — this affects routing, SSR, and build tooling in all three apps simultaneously.

- **Decision**: MobX (`packages/shared-state`) is the state-management layer, not Redux/Zustand/Context-only.
  **Reason**: Established convention per `AGENTS.md` and store wiring in each app's `core/hooks/store`.
  **Do not change unless**: A cross-app state-management migration is explicitly scoped.

- **Decision**: OxLint + oxfmt instead of ESLint + Prettier.
  **Reason**: Root config files (`.oxlintrc.json`, `.oxfmtrc.json`) and `lint-staged` wiring in root `package.json`.
  **Do not change unless**: Explicitly asked to switch tooling.

- **Decision**: Dependency versions centralized via pnpm `catalog:`; internal packages referenced as `workspace:*`.
  **Reason**: Per `AGENTS.md` code style rules; keeps versions consistent across the monorepo.
  **Do not change unless**: Adding a genuinely new dependency not yet in the catalog (add it to the catalog, don't pin ad hoc versions in individual `package.json` files).

- **Decision**: For codebase questions about `apps/web`, query the `graphify-out/` knowledge graph (`graphify query/path/explain`) before grepping raw source.
  **Reason**: Enforced by a `PreToolUse:Bash` hook and root `CLAUDE.md`; graph queries return a scoped, cheaper subgraph.
  **Do not change unless**: The hook/config in `CLAUDE.md` is itself updated — this is a tooling policy, not a code decision.

## Current Implementation State

Recent work (last ~15 commits, all on `main`) has focused on **personal work-item time planning**:

- Focus/weekly calendar for scheduling work items by hour, with drag-and-drop from an "unscheduled" sidebar strip, half-hour granularity, and resizable plan durations.
- A **Pomodoro timer** integrated into the sidebar with phase-change notifications (implemented, currently being refined — see Active Work).
- Cross-project Program Timeline and time-tracking analytics (worklogs settings, i18n strings) — implemented.

## Active Work

Uncommitted changes on `main` (not yet committed) are refining the **Pomodoro timer notification system**:

- Adding a browser service worker (`apps/web/public/pomodoro-sw.js`, new/untracked) so phase-end notifications can fire even when the tab isn't focused.
- Modifying `apps/web/core/components/pomodoro/notifications.ts` and `notify-phase-end.ts` (notification dispatch logic).
- Updating the Pomodoro preferences UI (`.../settings/profile/content/pages/preferences/pomodoro-list.tsx`).
- Touching calendar issue-block components (`.../issue-layouts/calendar/{issue-block-root,issue-block,issue-blocks,unscheduled-strip}.tsx`) — likely wiring time-block/pomodoro display into the calendar.
- Minor supporting changes: `packages/constants/src/issue/filter.ts`, `packages/i18n/src/locales/en/pomodoro.json`.

## Known Issues

None currently documented. (A prior bug — `planned_at` default causing a `FieldError` — was fixed in commit `ccbb63014b` and is not currently open.)

## Important Constraints

- Node.js >=22.18.0 required (`engines` in root `package.json`); pnpm version is pinned (`packageManager` field) — don't assume a different package manager.
- License is AGPL-3.0 — this is the open-source/self-hosted (CE) edition of Plane.
- `graphify-out/` is generated output; don't hand-edit it, regenerate with `graphify update .` after code changes in `apps/web`.
- Do not commit `.env` files (present locally but gitignored patterns apply) — use `.env.example` as the template.
- All new features/bug fixes are expected to ship with unit tests (per `CONTRIBUTING.md`).

## Next Steps

- Finish and commit the Pomodoro service-worker notification changes currently in the working tree (verify `pomodoro-sw.js` registration path and notification permission flow).
- Verify the calendar issue-block changes don't regress existing drag-and-drop/unscheduled-strip behavior from the recent focus-calendar work.
- Run `pnpm check` (format/lint/types) and relevant frontend tests before committing.

---

## AI State Maintenance Rules

- Read this file at the start of a substantial task; use it as context but verify important claims against the actual repository (code, configs) before relying on them — this file can go stale.
- Never treat this file as authoritative over the code when they conflict; trust the code and update this file to match.
- Update **Architecture** / **Data & Integrations** when a structural or integration change is made.
- Update **Architectural Decisions** when an important design decision is finalized (add new entries; don't delete history of _why_ unless the decision itself was reversed — then replace the entry).
- Update **Current Implementation State** after completing a significant feature.
- Update **Active Work** when starting or finishing a major task; if there's no active task, say so explicitly rather than leaving stale content.
- Update **Known Issues** only with confirmed problems (reproducible bugs, not speculation).
- Remove obsolete information rather than accumulating it.
- Never record conversation history or transient debugging notes here.
- Never store secrets, credentials, API keys, tokens, or personal data here.
- Keep entries concise and high-signal — prefer one-line statements ("X is handled by Y") over prose explanations. Avoid pasting code, full file listings, or dependency manifests.
- Avoid reading the entire repository to update this file — targeted checks (git log/diff, specific configs, `graphify query`) are usually enough.
