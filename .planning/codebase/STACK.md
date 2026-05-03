# Technology Stack

**Analysis Date:** 2026-05-03

This stack covers two parallel toolchains that share one repo:

1. A **TypeScript/React frontend + Node services** managed as a pnpm workspace + Turborepo (`apps/web`, `apps/admin`, `apps/space`, `apps/live`, `packages/*`).
2. A **Python/Django REST backend** (`apps/api`, excluded from the pnpm workspace) with Celery workers and a Caddy proxy (`apps/proxy`, config-only).

## Languages

**Primary:**

- TypeScript 5.8.3 (pinned via pnpm catalog at `pnpm-workspace.yaml:34`) — all `apps/{web,admin,space,live}` and every `packages/*` except `tailwind-config` and `typescript-config`.
- Python 3.12.10 — Django REST API. Pinned via Docker base image `python:3.12.10-alpine` in `apps/api/Dockerfile.api:1`.
- TSX/JSX (`react-jsx` runtime, see `packages/typescript-config/react-router.json:7`).

**Secondary:**

- Bash — Docker entrypoints under `apps/api/bin/docker-entrypoint-*.sh`.
- Caddyfile — production routing in `apps/proxy/Caddyfile.ce` and `apps/proxy/Caddyfile.aio.ce`.
- JSON — translations in `packages/i18n/src/locales/<lang>/translations.json` (ICU IntlMessageFormat). Locales: `cs`, `de`, `en`, `es`, `fr`, `id`, `it`, `ja`, `ko`, `pl`, `pt-BR`, `ro`, `ru`, `sk`, `tr-TR`, `ua`, `vi-VN`, `zh-CN`, `zh-TW`.

## Runtime

**Node:**

- Node `22.18.0` pinned in `.mise.toml:2` and enforced via `engines.node: ">=22.18.0"` in `package.json:38`.

**Python:**

- CPython 3.12.10 in API container (`apps/api/Dockerfile.api:1`).

**Web servers:**

- API (production): `gunicorn -k uvicorn.workers.UvicornWorker plane.asgi:application` with `GUNICORN_WORKERS` and `--max-requests 1200 --max-requests-jitter 1000` in `apps/api/bin/docker-entrypoint-api.sh:38`.
- API (dev): `apps/api/bin/docker-entrypoint-api-local.sh` (Django dev server).
- React Router app servers: `react-router dev` in dev (ports 3000/3001/3002, see `apps/{web,admin,space}/package.json` `dev` scripts), `serve -s build/client -l 3000` in production for `web`/`admin`, and `react-router-serve ./build/server/index.js` for `space` (`apps/space/package.json:11`).
- Live (Hocuspocus + Express + WS): `node --env-file=.env .` after `tsdown` build (`apps/live/package.json:18-19`).

**Package manager:**

- pnpm `10.32.1` (sha pinned in `package.json:40`); enable via `corepack enable pnpm`.
- Lockfile: `pnpm-lock.yaml` (present, single root lockfile).
- Workspace defined in `pnpm-workspace.yaml` (`apps/*` + `packages/*`, explicit `!apps/api` and `!apps/proxy`).

## Frameworks

**Frontend (apps/web, apps/admin, apps/space):**

- React 18.3.1 + react-dom 18.3.1 (`pnpm-workspace.yaml:30-32`).
- React Router v7 — `react-router 7.12.0`, `@react-router/dev 7.13.1`, `@react-router/node 7.13.1`, `@react-router/serve 7.13.1` (`pnpm-workspace.yaml:13-15,30`). Routes declared in `apps/web/app/routes.ts` and `apps/web/app/routes/{core,extended,helper}.ts` using the `route()` / `mergeRoutes` helpers from `@react-router/dev/routes`. `(group)/page.tsx` folder naming is convention-only — files do not become routes automatically.
- Vite 7.3.2 build (`pnpm-workspace.yaml:36`); web config at `apps/web/vite.config.ts` registers `reactRouter()`, `vite-tsconfig-paths`, dedupes `react`/`react-dom`/`@headlessui/react`, and aliases Next.js compat shims (`next/link`, `next/navigation`, `next/script` → `apps/web/app/compat/next/*`).
- Tailwind via `@plane/tailwind-config` (workspace package). `@tailwindcss/typography 0.5.19` in `apps/web/package.json:84`.

**State / data:**

- MobX 6.12.0 + `mobx-react 9.1.1` + `mobx-utils 6.0.8` (catalog).
- `@plane/shared-state` (workspace) — global stores. App-local stores in `apps/<app>/{core,ce}/store`.
- SWR 2.2.4 for data fetching (catalog).
- `@tanstack/react-table ^8.21.3` (`apps/web/package.json:45`), `@tanstack/react-virtual ^3.13.12` (admin only).
- React Hook Form `7.51.5`.

**UI primitives:**

- `@headlessui/react ^1.7.19`, `@radix-ui/react-scroll-area ^1.2.3` (in `@plane/ui`).
- `@atlaskit/pragmatic-drag-and-drop 1.7.4` + `-auto-scroll 1.4.0` + `-hitbox 1.1.0` (catalog).
- `lucide-react 0.469.0` (catalog).
- `@blueprintjs/core ^4.16.3` and `@blueprintjs/popover2 ^1.13.3` (legacy, only in `@plane/ui`).
- Charts: `recharts ^2.12.7` (web only).
- PDF rendering in browser: `@react-pdf/renderer ^3.4.5` + `react-pdf-html ^2.1.2` (web).
- Themes: `next-themes 0.4.6` (used despite no Next.js).
- Misc web: `cmdk ^1.0.0` (command palette), `comlink ^4.4.1` (web workers), `react-dropzone ^14.2.3`, `emoji-picker-react ^4.5.16`, `react-color ^2.19.3`, `react-popper ^2.3.0`, `react-markdown ^8.0.7`, `export-to-csv ^1.4.0`.

**Editor (`@plane/editor`, `apps/live`):**

- Tiptap `^2.22.3` (catalog `@tiptap/core`, `@tiptap/html`) plus a long extension set (`extension-blockquote`, `-character-count`, `-collaboration`, `-document`, `-emoji`, `-heading`, `-image`, `-list-item`, `-mention`, `-placeholder`, `-task-item`, `-task-list`, `-text-align`, `-text-style`, `-underline`, `pm`, `react`, `starter-kit`, `suggestion`) declared in `packages/editor/package.json:46-67`.
- Yjs `^13.6.20` + `y-prosemirror ^1.3.7` + `y-protocols ^1.0.6` + `y-indexeddb ^9.0.12`.
- `@hocuspocus/server 2.15.2`, `@hocuspocus/extension-database 2.15.2`, `@hocuspocus/extension-redis 2.15.2`, `@hocuspocus/extension-logger 2.15.2`, `@hocuspocus/transformer 2.15.2`, `@hocuspocus/provider 2.15.2`.
- `effect 3.20.0`, `@effect/platform ^0.94.0`, `@effect/platform-node ^0.104.0` in `apps/live` (functional core for IO/PDF pipelines).
- PDF export in `apps/live`: `@react-pdf/renderer ^4.3.0`, `pdf-parse ^2.4.5`, `sharp ^0.34.3`.

**Live server stack (`apps/live`):**

- Express `4.22.0` (catalog) + `express-ws ^5.0.2` + `ws ^8.18.3`.
- `helmet ^7.1.0`, `cors ^2.8.5`, `compression 1.8.1`.
- `ioredis 5.7.0` (Redis client; manager in `apps/live/src/redis.ts:11`).
- Zod `^3.25.76` for env validation (`apps/live/src/env.ts:13-31`).
- Custom `@plane/decorators` package implements controller registration (`registerController` used in `apps/live/src/server.ts:16`).

**Backend (apps/api):**

- Django `4.2.30` with Django REST Framework `3.15.2` (`apps/api/requirements/base.txt:4-7`).
- Celery `5.4.0` + `django_celery_beat 2.6.0` + `django-celery-results 2.5.1` for async tasks; broker is RabbitMQ (`amqp://`) and result/cache backend is Redis (see `apps/api/plane/settings/common.py:259-275`). Beat scheduler is `django_celery_beat.schedulers.DatabaseScheduler` (`apps/api/plane/celery.py:103`); the static schedule lives at `apps/api/plane/celery.py:29-80` and runs jobs every 5 minutes (email queue), every 6 hours (instance trace), and a daily cleanup batch at UTC 00:00–03:45.
- ASGI via `channels 4.1.0` (mounted in `apps/api/plane/asgi.py:1`).
- DB: `psycopg 3.3.0` + `psycopg-binary 3.3.0` + `psycopg-c 3.3.0` + `dj-database-url 2.1.0`.
- Cache: `redis 5.0.4` + `django-redis 5.4.0`.
- Storage: `django-storages 1.14.2` + `boto3 1.34.96`. Custom S3 adapter in `apps/api/plane/settings/storage.py:19` (presigned POST/GET, multipart copy/delete, MinIO support).
- API docs: `drf-spectacular 0.28.0`. Mounted at `/api/schema/`, `/api/schema/swagger-ui/`, `/api/schema/redoc/` only when `ENABLE_DRF_SPECTACULAR=1` (`apps/api/plane/urls.py:26-39`, settings in `apps/api/plane/settings/openapi.py:11`).
- Filtering: `django-filter 24.2`.
- HTML / sanitization / parsing: `nh3 0.2.18`, `beautifulsoup4 4.12.3`, `lxml 6.0.0`, `openpyxl 3.1.2` (xlsx export).
- Crypto / auth: `cryptography 46.0.7`, `PyJWT 2.12.0`, `zxcvbn 4.4.28` (password strength).
- Logging: `python-json-logger 4.0.0` (JSON formatter wired in `apps/api/plane/settings/production.py:31-104`).
- CORS: `django-cors-headers 4.3.1` (settings at `apps/api/plane/settings/common.py:119-131`, allowed list comes from `CORS_ALLOWED_ORIGINS` env, otherwise `CORS_ALLOW_ALL_ORIGINS = True`).
- Web server: `gunicorn 23.0.0` (production only, in `requirements/production.txt:3`); `uvicorn 0.29.0` runs as the gunicorn worker class.
- Static files: `whitenoise 6.11.0` (`CompressedManifestStaticFilesStorage`).
- Sessions: custom session engine `plane.db.models.session` (`apps/api/plane/settings/common.py:316`); session cookie name defaults to `session-id`, max age 7 days. Admin app uses a separate `admin-session-id` cookie with 1h max age.

**MongoDB (optional, webhook logs only):**

- `pymongo 4.6.3` — singleton client in `apps/api/plane/settings/mongo.py:22`. Used by `apps/api/plane/bgtasks/webhook_task.py:55,105` to persist webhook delivery logs to a `webhook_logs` collection. Disabled gracefully when `MONGO_DB_URL` / `MONGO_DB_DATABASE` are not set.

**Testing:**

- `pytest 9.0.3` + `pytest-django 4.5.2` + `pytest-cov 4.1.0` + `pytest-xdist 3.3.1` + `pytest-mock 3.11.1` + `factory-boy 3.3.0` + `freezegun 1.2.2` + `coverage 7.2.7` (`apps/api/requirements/test.txt`).
- `httpx 0.24.1` and `requests 2.33.0` for test HTTP clients.
- `apps/api/run_tests.py` is the canonical wrapper; default mode runs `pytest -m "not slow"` and `--coverage` enforces `--fail-under=90`.
- `apps/api/pytest.ini` defaults: `--reuse-db --nomigrations -vs`, `DJANGO_SETTINGS_MODULE=plane.settings.test`.
- Vitest for `apps/live` and `packages/codemods` (`apps/live/package.json:78`, `@vitest/coverage-v8 ^4.0.8`).
- Playwright `^1.59.1` for `apps/web` E2E (`apps/web/package.json:82`); config at `apps/web/e2e/playwright.config.ts`.
- Most other JS packages have no test harness — do not invent one without asking.

**Build / dev tooling:**

- Turborepo `2.9.4` (`package.json:27`); pipeline in `turbo.json`. Remote cache disabled (`turbo.json:36`). Default concurrency for `dev`: 18 (`package.json:10`).
- Per-package bundler: `tsdown 0.16.0` (catalog) for `packages/*` libraries and `apps/live`. Build commands run `tsc --noEmit && tsdown` (`apps/live/package.json:16`).
- Vite `7.3.2` (catalog) for app builds via `react-router build`.
- Storybook `9.1.19` only in `@plane/ui` (`pnpm --filter=@plane/ui storybook` on port 6006).

## Key Dependencies

**Critical (frontend):**

- `axios 1.15.0` (catalog). All HTTP clients extend `APIService` in `packages/services/src/api.service.ts:14` which sets `withCredentials: true` on a single shared `axios.create()`. Service classes live under `packages/services/src/<domain>/` — `auth`, `ai`, `cycle`, `dashboard`, `developer`, `file`, `instance`, `intake`, `issue`, `label`, `module`, `project`, `state`, `user`, `workspace`, plus `live.service.ts` and `indexedDB.service.ts` and the abstract `api.service.ts`.
- `react-hook-form 7.51.5` for forms.
- `date-fns ^4.1.0`.
- `lodash-es 4.18.0` (catalog).
- `uuid 13.0.0` (catalog).

**Critical (backend):**

- `Django==4.2.30` LTS as the application core.
- `djangorestframework==3.15.2` for the REST APIs (mounted at `/api/`, `/api/public/`, `/api/v1/` in `apps/api/plane/urls.py:18-22`). Default auth class is `SessionAuthentication`; default permission `IsAuthenticated`; default throttle `AnonRateThrottle` at `30/minute` and a custom `asset_id` throttle at `5/minute` (`apps/api/plane/settings/common.py:80-93`).
- `celery==5.4.0` for async work.
- `boto3==1.34.96` for S3 / MinIO presigned URLs.

**Infrastructure:**

- pnpm catalog overrides in `package.json:42-79` — pinned versions for transitive deps including `express`, `nanoid`, `lodash`, `markdown-it`, `picomatch`, `path-to-regexp`, `serialize-javascript` (security pins). Do not bypass these via package-level pins.
- `pnpm.onlyBuiltDependencies` allows native builds for `@parcel/watcher`, `@swc/core`, `esbuild`, `msgpackr-extract`, `turbo`. `sharp` is in `ignoredBuiltDependencies`.

## Configuration

**Lint / format:**

- OxLint `1.51.0` and `oxfmt 0.35.0` (root `package.json:25-26`).
- Single OxLint config: `.oxlintrc.json` (plugins: `react`, `typescript`, `jsx-a11y`, `import`, `promise`, `unicorn`, `oxc`; categories `correctness`/`suspicious`/`perf` set to `warn`; React version `18.3`).
- Single oxfmt config: `.oxfmtrc.json` (root).
- Each app pins a `--max-warnings` budget — ratcheting only:
  - `apps/web` 11957 (`apps/web/package.json:13`)
  - `apps/admin` 759 (`apps/admin/package.json:14`)
  - `apps/space` 676 (`apps/space/package.json:13`)
  - `apps/live` 119 (`apps/live/package.json:22`)
  - `@plane/editor` 416, `@plane/ui` 66, `@plane/services` 6, `@plane/shared-state` 0.
- Pre-commit (root `package.json:29-35`): Husky `9.1.7` runs `lint-staged 16.2.7`, which runs `pnpm exec oxfmt --no-error-on-unmatched-pattern` then `pnpm exec oxlint --fix --deny-warnings` on staged files matching `*.{js,jsx,ts,tsx,cjs,mjs,cts,mts,json,css,md}`.

**Python lint:**

- `ruff 0.9.7` (`apps/api/requirements/local.txt:5`) configured in `apps/api/pyproject.toml:6-97`. Line length 120, double quotes, indent 4 spaces. Selected rules: `E`, `F`. Per-file ignores for `tests/*` and `__init__.py`. `mccabe.max-complexity = 10`, `pylint.max-args = 8`, `pylint.max-statements = 50`. isort known-first-party `["plane"]`.

**TypeScript:**

- Workspace shared configs in `packages/typescript-config/`: `base.json` (strict, `verbatimModuleSyntax`, `exactOptionalPropertyTypes: true`, `target: esnext`, lib `es2023`), `react-router.json` (extends base, `target: ES2022`, `lib: [DOM, DOM.Iterable, ES2022]`, `jsx: react-jsx`).
- Per-app overrides: `apps/web/tsconfig.json:12-18` weakens some rules (`exactOptionalPropertyTypes: false`, `noUnusedParameters: false`, `noUnusedLocals: false`, `noImplicitReturns: false`, `noImplicitOverride: false`) but keeps `strictNullChecks: true`. Path aliases: `@/*` → `./core/*`, `@/plane-web/*` → `./ce/*`, `@/app/*`, `@/helpers/*`, `@/styles/*`.

**Build orchestration (Turborepo):**

- `turbo.json` declares tasks: `build`, `build-storybook`, `check`, `check:format`, `check:lint`, `check:types`, `clean`, `dev`, `fix`, `fix:format`, `fix:lint`, `start`, `test`.
- `globalDependencies`: `.npmrc`, `.oxfmtrc.json`, `.oxlintrc.json`.
- `globalEnv` (full list of vars passed to all tasks): `APP_VERSION`, `DEV`, `LOG_LEVEL`, `NODE_ENV`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `VITE_ADMIN_BASE_PATH`, `VITE_ADMIN_BASE_URL`, `VITE_API_BASE_PATH`, `VITE_API_BASE_URL`, `VITE_APP_VERSION`, `VITE_ENABLE_SESSION_RECORDER`, `VITE_LIVE_BASE_PATH`, `VITE_LIVE_BASE_URL`, `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_PROFILES_SAMPLE_RATE`, `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`, `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `VITE_SENTRY_SEND_DEFAULT_PII`, `VITE_SENTRY_TRACES_SAMPLE_RATE`, `VITE_SESSION_RECORDER_KEY`, `VITE_SPACE_BASE_PATH`, `VITE_SPACE_BASE_URL`, `VITE_SUPPORT_EMAIL`, `VITE_WEB_BASE_PATH`, `VITE_WEB_BASE_URL`, `VITE_WEBSITE_URL`. Add new vars touching the Vite-built frontend here AND in `apps/<app>/.env.example`.

**Vite frontend env exposure (`apps/web/vite.config.ts:11-19`):**

- Only `VITE_*` vars are forwarded into the browser bundle (`process.env` is replaced with the filtered subset at build time).
- API base URL resolved by `packages/constants/src/endpoints.ts:7-9` (`VITE_API_BASE_URL` + `VITE_API_BASE_PATH`); defaults to empty (= same-origin).
- Other base URL constants the frontend reads from env: `VITE_ADMIN_BASE_URL` / `VITE_ADMIN_BASE_PATH`, `VITE_SPACE_BASE_URL` / `VITE_SPACE_BASE_PATH`, `VITE_LIVE_BASE_URL` / `VITE_LIVE_BASE_PATH`, `VITE_WEB_BASE_URL` / `VITE_WEB_BASE_PATH`, `VITE_WEBSITE_URL` (default `https://plane.so`), `VITE_SUPPORT_EMAIL` (default `support@plane.so`).

**Dev stack (`docker-compose-local.yml`):**

- `plane-redis`: `valkey/valkey:7.2.11-alpine` (Redis-compatible) on port 6379.
- `plane-mq`: `rabbitmq:3.13.6-management-alpine` (uses `RABBITMQ_USER`/`RABBITMQ_PASSWORD`/`RABBITMQ_VHOST` from `.env`).
- `plane-minio`: `minio/minio` on ports 9000 (S3) and 9090 (console). Init creates bucket from `AWS_S3_BUCKET_NAME`.
- `plane-db`: `postgres:15.7-alpine` with `max_connections=1000`.
- `api`, `worker`, `beat-worker`, `migrator` containers all built from `apps/api/Dockerfile.dev` with bind mount of `./apps/api:/code`.

**Production stack (root `docker-compose.yml`):**

- Treat the root `docker-compose.yml` as the production/self-hosted compose; do NOT run it in dev. Use `docker-compose-local.yml` instead.

## Platform Requirements

**Development:**

- macOS / Linux. The `mise` toolchain installer sets Node `22.18.0` from `.mise.toml`.
- Minimum 12 GB RAM recommended; 8 GB systems routinely fail during Docker startup or `pnpm install`.
- One-time bootstrap: `./setup.sh` (copies every `.env.example` → `.env`, generates Django `SECRET_KEY`, runs `pnpm install`).
- Each app/package has a `.env.example` template at `apps/<app>/.env.example` (web/admin/space/live/api) plus a root `.env.example`.

**Production:**

- Self-hosted by default — `IS_SELF_MANAGED = True` is hardcoded in `apps/api/plane/settings/common.py:33`.
- Reverse proxy: Caddy via `apps/proxy/Caddyfile.ce` fans out: `/api/*` and `/auth/*` → `api:8000`, `/static/*` → `api:8000`, `/live/*` → `live:3000`, `/spaces/*` → `space:3000`, `/god-mode/*` → `admin:3000`, `/{$BUCKET_NAME}/*` → `plane-minio:9000`, else → `web:3000`. ACME certs obtained via Let's Encrypt; `CERT_EMAIL`, `CERT_ACME_CA`, `CERT_ACME_DNS`, `TRUSTED_PROXIES`, `SITE_ADDRESS`, `FILE_SIZE_LIMIT`, `BUCKET_NAME` env vars.
- Three Celery processes per deployment: `worker`, `beat-worker`, `migrator` (one-shot). Entrypoints in `apps/api/bin/docker-entrypoint-{worker,beat,migrator}.sh`.

---

_Stack analysis: 2026-05-03_
