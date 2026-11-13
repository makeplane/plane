# Diagram reading notes — Plane platform onboarding

- **Scope**: whole Plane platform as found on branch `plane-forked`, 2026-11-04. Static evidence only (code, configs, compose files) — no runtime traces.
- **Reading order**: `onboarding-context.mmd` (who uses what) → `onboarding-containers.mmd` (what runs, what talks to what) → `onboarding-ownership.mmd` (where the code lives) → the module table below.
- **Companion files**: `architecture-communication-plan.md` (audience and view selection), `delivery-summary.md` (usage notes).

## How to read each view

### View A — System context (`onboarding-context.mmd`)

Answers: _who uses Plane and through which surface?_ Three human audiences (team member, public visitor, instance admin) each get their own frontend, plus one non-human audience (API-key integrations). Everything inside the `Plane` subgraph is part of the self-hosted instance; OAuth providers and email recipients are external. Note that all three frontends depend on the same Django API — the apps are surfaces, not separate backends.

### View B — Containers / runtime (`onboarding-containers.mmd`)

Answers: _what actually runs, on which port, and who calls whom?_ Read it top-down: browser → Caddy → the rest. In production (`docker-compose.yml`) Caddy is the only exposed component; the path prefixes (`/god-mode/*`, `/spaces/*`, `/live/*`, `/api|/auth|/static`) are the routing contract. In local dev the picture changes: `docker-compose-local.yml` runs only the data services plus api/worker/beat/migrator; the frontends run on the host via `pnpm dev` (web :3000, admin :3001, space :3002, live :3100 default per `apps/live/.env.example`). The page editor's realtime path bypasses Django entirely — web connects by WebSocket to `live` at `/live/collaboration`.

### View C — Code ownership (`onboarding-ownership.mmd`)

Answers: _where do I open a PR?_ `apps/` contains things that run; `packages/` contains libraries imported via `workspace:*`. Rule of thumb: UI primitives come from the published `@makeplane/propel` npm package, Plane-specific composites from `@plane/blocks`, text editing from `@plane/editor`, HTTP calls from `@plane/services`, cross-app state from `@plane/shared-state`. If your change benefits more than one frontend, it almost certainly belongs in `packages/`, not in an app.

## Backend module map (no diagram — table is clearer)

All backend code lives in one Django package: `apps/api/plane/`.

| URL prefix        | Django module           | Responsibility                                                                                      | Evidence                                                                        |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/api/`           | `plane/app/`            | Main app API: issues, projects, workspaces, cycles, modules, pages, notifications, search, webhooks | `apps/api/plane/urls.py`                                                        |
| `/api/public/`    | `plane/space/`          | Public API for published sites                                                                      | `apps/api/plane/urls.py`                                                        |
| `/api/instances/` | `plane/license/`        | Instance admin + licensing/telemetry                                                                | `apps/api/plane/urls.py`                                                        |
| `/api/v1/`        | `plane/api/`            | External API, authenticated by `X-API-Key`                                                          | `apps/api/plane/urls.py`, `apps/api/plane/api/middleware/api_authentication.py` |
| `/auth/`          | `plane/authentication/` | Sign-in/up, OAuth callbacks, magic links                                                            | `apps/api/plane/urls.py`                                                        |
| `/`               | `plane/web/`            | Health check + robots.txt only                                                                      | `apps/api/plane/urls.py`                                                        |

Supporting modules: `plane/db/models/` (all ORM models, `AUTH_USER_MODEL = "db.User"`), `plane/bgtasks/` (~30 Celery task modules: email notifications, webhooks, exports, cleanups), plus cross-cutting `analytics/`, `middleware/`, `utils/`, `throttles/`, `seeds/`. There is **no services layer** — logic lives in views, serializers, and model methods (verified by directory search).

## Evidence table

Confidence per the shared contract: **high** = direct source; **medium** = multiple partial signals; **low** = inferred.

| Claim                                                                                                                                       | Evidence                                                                                   | Confidence                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Monorepo tooling: pnpm + Turborepo, `apps/*` + `packages/*`, api excluded                                                                   | `package.json`, `turbo.json`, `pnpm-workspace.yaml`                                        | high                                                 |
| web :3000, React Router + Vite, MobX                                                                                                        | `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/store/root.store.ts`         | high                                                 |
| admin :3001, base path `/god-mode`, instance settings routes                                                                                | `apps/admin/package.json`, `apps/admin/.env.example`, `apps/admin/app/routes.ts`           | high                                                 |
| space :3002, SSR via `react-router-serve`, published-sites purpose                                                                          | `apps/space/package.json`, `apps/space/app/routes.ts`, `apps/space/README.md`              | high                                                 |
| live = Express + Hocuspocus (Yjs), Redis pub/sub + redlock                                                                                  | `apps/live/package.json`, `apps/live/src/server.ts`, `apps/live/src/env.ts`                | high                                                 |
| Editor connects to `<origin>/live/collaboration` via WS                                                                                     | `apps/web/components/pages/editor/editor-body.tsx`, `packages/constants/src/endpoints.ts`  | high                                                 |
| Django 5.2 + DRF, Postgres (optional read replica), Redis cache                                                                             | `apps/api/pyproject.toml`, `apps/api/plane/settings/common.py`                             | high                                                 |
| Celery + RabbitMQ broker + beat (DB scheduler)                                                                                              | `apps/api/pyproject.toml`, `apps/api/plane/celery.py`, `apps/api/plane/settings/common.py` | high                                                 |
| S3/MinIO asset storage                                                                                                                      | `apps/api/plane/settings/common.py`, `docker-compose.yml` (plane-minio)                    | high                                                 |
| Session cookie auth; sessions stored in DB (not Redis)                                                                                      | `apps/api/plane/settings/common.py`, `apps/api/plane/db/models/` (session)                 | high                                                 |
| OAuth providers Google/GitHub/GitLab/Gitea                                                                                                  | `apps/api/plane/authentication/provider/`                                                  | high                                                 |
| API-key auth for `/api/v1/`                                                                                                                 | `apps/api/plane/api/middleware/api_authentication.py`, `apps/api/plane/api/views/base.py`  | high                                                 |
| API runs gunicorn + UvicornWorker (ASGI) on :8000                                                                                           | `apps/api/bin/docker-entrypoint-api.sh`, `apps/api/Dockerfile.api`                         | high                                                 |
| Caddy path routing incl. only-exposed-ports claim                                                                                           | `apps/proxy/Caddyfile.ce`, `docker-compose.yml`                                            | high                                                 |
| Compose services: web, admin, space, api, worker, beat-worker, migrator, live, plane-db, plane-redis (Valkey), plane-mq, plane-minio, proxy | `docker-compose.yml`                                                                       | high                                                 |
| Local dev: infra-only compose + host-run frontends                                                                                          | `docker-compose-local.yml`, `setup.sh`, root `package.json`                                | high                                                 |
| web runtime mode is static SPA (`serve -s build/client`) vs space SSR                                                                       | `apps/web/package.json` start script                                                       | medium — inferred from scripts, not runtime-verified |
| Notification emails sent by Celery bgtasks                                                                                                  | `apps/api/plane/bgtasks/`, `apps/api/plane/celery.py`                                      | high                                                 |
| Email transport is Django SMTP settings                                                                                                     | standard Django `EMAIL_*` convention                                                       | low — assumed, no direct evidence read               |
| Django Channels present but unused (no API websockets)                                                                                      | `apps/api/plane/asgi.py` (routes `http` only)                                              | high                                                 |

## Caveats and known unknowns

1. **web's runtime mode** (static SPA vs SSR) is inferred from package scripts; verify in the running app before relying on it.
2. **`deployments/cli/community/docker-compose.yml`** was not examined; the production claims above are based on the root `docker-compose.yml`.
3. **Email transport** (SMTP vs a provider SDK) was not traced; treat the email edge in View A as "some outbound mail mechanism".
4. **Two compose worlds**: behavior differs between production compose, local compose, and the pytest stack (`docker-compose-test.yml`, hostnames `test-*`, settings module `plane.settings.test`). Diagrams show the production wiring.
5. **Fork drift**: this is a fork (`plane-forked`); the React Router + Vite migration may differ from upstream Plane. Evidence was read from this branch, so views match this fork, not necessarily upstream.
6. Nothing in the diagrams was runtime-observed — traffic paths are design-level evidence from code and configs.

## Follow-up validations (cheap, recommended in week one)

- Run `pnpm dev` and confirm the four dev ports and base paths behave as diagrammed.
- Trace one request end-to-end (e.g. create an issue) through `@plane/services` → `/api/` → `plane/app/` views → `plane/db/models/`.
- Watch a page edit hit `live` over WebSocket, and a webhook/email fire through `worker`.
