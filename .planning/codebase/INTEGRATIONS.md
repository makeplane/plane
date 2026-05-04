# External Integrations

**Analysis Date:** 2026-05-03

This document covers every external system Plane talks to and where the integration code lives. The "frontend → API" boundary is **same-origin** in production (Caddy fans out at `apps/proxy/Caddyfile.ce`), so most "integrations" are server-side calls from Django to third parties or webhook traffic that flows in/out of the Django host.

## Identity & Authentication Providers

The Django backend in `apps/api/plane/authentication/` is the sole authority. Each provider has parallel **App** and **Space** flows (the `space` variants are for the public share UI in `apps/space`, which has its own login).

**OAuth providers (`apps/api/plane/authentication/provider/oauth/`):**

- **Google** (`google.py`) — `GoogleOAuthProvider`. Token URL: `https://oauth2.googleapis.com/token`. Userinfo: `https://www.googleapis.com/oauth2/v2/userinfo`. Scope: `userinfo.email userinfo.profile`. Uses `access_type=offline` and `prompt=consent`. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (env or InstanceConfiguration). Redirect URIs: `/auth/google/callback/` and `/auth/spaces/google/callback/`.
- **GitHub** (`github.py`) — `GitHubOAuthProvider`. Token URL: `https://github.com/login/oauth/access_token`. Userinfo: `https://api.github.com/user`. Scope: `read:user user:email` (auto-adds `read:org` if `GITHUB_ORGANIZATION_ID` is set, in which case it enforces org membership via `https://api.github.com/orgs/{org}/memberships/{login}`). Note: GitHub doesn't return email in userinfo, so the provider hits `https://api.github.com/user/emails` separately and picks the primary. Requires `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, optional `GITHUB_ORGANIZATION_ID`. Redirect URIs: `/auth/github/callback/`, `/auth/spaces/github/callback/`.
- **GitLab** (`gitlab.py`) — `GitLabOAuthProvider`. Token URL: `{GITLAB_HOST}/oauth/token`. Userinfo: `{GITLAB_HOST}/api/v4/user`. Scope: `read_user`. Requires `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_HOST` (defaults to `https://gitlab.com`). Self-hosted GitLab is supported. Redirect URIs: `/auth/gitlab/callback/`, `/auth/spaces/gitlab/callback/`.
- **Gitea** (`gitea.py`) — `GiteaOAuthProvider`. Token URL: `{GITEA_HOST}/login/oauth/access_token`. Userinfo: `{GITEA_HOST}/api/v1/user`. Scope: `openid email profile`. Requires `GITEA_CLIENT_ID`, `GITEA_CLIENT_SECRET`, `GITEA_HOST` (no default — must be self-hosted). Provider rejects non-http(s) hosts. Redirect URIs: `/auth/gitea/callback/`, `/auth/spaces/gitea/callback/`.

**Credential providers (`apps/api/plane/authentication/provider/credentials/`):**

- **Email + password** (`email.py`) — standard Django auth.
- **Magic link** (`magic_code.py`) — emailed OTP, sent by `apps/api/plane/bgtasks/magic_link_code_task.py`.

**URL routing:** All auth routes mounted at `/auth/...` in `apps/api/plane/authentication/urls.py:49-153`. The `space` variants live under `/auth/spaces/...`. Frontend calls are made from `packages/services/src/auth/auth.service.ts` (`AuthService`) and `sites-auth.service.ts`.

**Auth model:**

- DRF default authentication is `SessionAuthentication` only (`apps/api/plane/settings/common.py:80-93`). Sessions are stored via the custom engine `plane.db.models.session` (`apps/api/plane/settings/common.py:316`); cookie names: `session-id` (web) and `admin-session-id` (admin). CSRF tokens are issued at `/auth/get-csrf-token/` (handled in `apps/api/plane/authentication/views/common.py`).
- Bot/service tokens for the public REST API (`/api/v1/`) are managed via `APIToken` model (`apps/api/plane/db/models/api.py:23`); tokens have format `plane_api_<32-char hex>`, an `allowed_rate_limit` defaulting to `60/min`, and are enforced by `plane.api.middleware.api_authentication.APIKeyAuthentication`.

**Instance "god mode" admin:**

- Mounted at `/god-mode/` (`ADMIN_BASE_PATH`, default in `apps/api/plane/settings/common.py:339`). The `apps/admin` SPA hits `apps/api/plane/license/api/views/` for instance-wide settings (`apps/api/plane/urls.py:20`). First admin is registered through this UI on a fresh install.

## Data Storage

**Primary database — PostgreSQL:**

- Configured in `apps/api/plane/settings/common.py:144-157` from either `DATABASE_URL` (parsed via `dj-database-url`) or discrete `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` env vars. Engine: `django.db.backends.postgresql` (psycopg 3).
- Optional read replica enabled via `ENABLE_READ_REPLICA=1` (`apps/api/plane/settings/common.py:160-177`). Uses either `DATABASE_READ_REPLICA_URL` or `POSTGRES_READ_REPLICA_*` vars. When enabled, two extra components are wired up: `plane.utils.core.dbrouters.ReadReplicaRouter` (DATABASE_ROUTERS) and `plane.middleware.db_routing.ReadReplicaRoutingMiddleware`.
- Local dev: `postgres:15.7-alpine` with `max_connections=1000` (`docker-compose-local.yml:51-64`).

**Cache / locks / Celery results — Redis (or Valkey):**

- Singleton client in `apps/api/plane/settings/redis.py:10` (`redis_instance()`). Auto-detects SSL via `rediss://` scheme; otherwise plain `redis://`.
- `django-redis` cache backend at `apps/api/plane/settings/common.py:185-202` (with `ssl_cert_reqs=False` for `rediss://`).
- `apps/live` uses `ioredis` directly via `RedisManager` in `apps/live/src/redis.ts:11`. Connection options: `keepAlive: 30000ms`, `connectTimeout: 10000ms`, `maxRetriesPerRequest: 3`, exponential backoff retry up to 2s. Hocuspocus uses the `Redis` extension to fan out CRDT updates across live-server instances (`apps/live/src/extensions/index.ts:13-19`, `@hocuspocus/extension-redis`).
- Local dev: `valkey/valkey:7.2.11-alpine` (Redis-compatible).
- Used by Django for: cache, Celery results, magic-link/email-notification distributed locks (`apps/api/plane/bgtasks/email_notification_task.py:34-43`), session storage helpers, and rate limiting.

**Message broker — RabbitMQ:**

- Celery broker URL built from `RABBITMQ_USER` / `RABBITMQ_PASSWORD` / `RABBITMQ_HOST` / `RABBITMQ_PORT` / `RABBITMQ_VHOST` (or override via `AMQP_URL`) at `apps/api/plane/settings/common.py:259-270`.
- Local dev: `rabbitmq:3.13.6-management-alpine` (`docker-compose-local.yml:12-24`).
- Result backend: NOT RabbitMQ — Celery results are stored via `django-celery-results` (Postgres) and configured via Django settings.

**Object storage — S3 / MinIO:**

- Custom storage class `S3Storage` in `apps/api/plane/settings/storage.py:19` (extends `S3Boto3Storage`). Uses `signature_version="s3v4"`. Returns presigned POST/GET URLs for direct browser uploads and downloads.
- Env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` (default `uploads`), `AWS_REGION`, `AWS_S3_ENDPOINT_URL` (or `MINIO_ENDPOINT_URL`), `USE_MINIO` (`1` to enable MinIO mode), `MINIO_ENDPOINT_SSL`, `SIGNED_URL_EXPIRATION` (default 3600s), `FILE_SIZE_LIMIT` (default 5 MiB).
- When `USE_MINIO=1`, the storage class rewrites the endpoint to `{request.scheme}://{request.host}` so the proxy can serve MinIO under `/{$BUCKET_NAME}/*` (Caddy rule in `apps/proxy/Caddyfile.ce:20-21`).
- Default ACL: `public-read`; query-string auth disabled (`AWS_QUERYSTRING_AUTH = False`); `AWS_S3_FILE_OVERWRITE = False`.
- Asset upload endpoints live in `apps/api/plane/app/views/asset/` and `apps/api/plane/api/urls/asset.py` (presigned POST flow). Frontend uploaders use `packages/services/src/file/`.
- Allowed mime types whitelisted in `apps/api/plane/settings/common.py:369-457` (covers images, PDFs, MS Office, OpenDocument, Visio, audio/video, archives, 3D models, fonts).
- Local dev: `minio/minio` on ports 9000 (S3) and 9090 (console). The compose entrypoint auto-creates the bucket from `AWS_S3_BUCKET_NAME`.
- Periodic cleanup of orphaned uploads runs daily via `plane.bgtasks.file_asset_task.delete_unuploaded_file_asset` (UTC 02:00, scheduled in `apps/api/plane/celery.py:53`). Exporter outputs are deleted twice daily by `plane.bgtasks.exporter_expired_task.delete_old_s3_link`.

**Webhook log storage — MongoDB (optional):**

- `apps/api/plane/settings/mongo.py:22` defines a `MongoConnection` singleton (`pymongo 4.6.3`). Reads `MONGO_DB_URL` and `MONGO_DB_DATABASE` from settings (`common.py:470-471`). When unset, the system logs a warning and skips Mongo writes silently.
- Used only by `apps/api/plane/bgtasks/webhook_task.py:55,93-124` to write webhook delivery logs to a `webhook_logs` collection with fields `workspace_id`, `webhook`, `event_type`, `request_method`, `request_headers`, `request_body`, `response_status`, `response_headers`, `response_body`, `retry_count`. The Postgres `WebhookLog` model (`apps/api/plane/db/models/webhook.py:65`) mirrors the same schema as a fallback.
- A daily Celery cleanup `plane.bgtasks.cleanup_task.delete_webhook_logs` runs at UTC 03:30 (`apps/api/plane/celery.py:73-76`).

## AI / LLM Providers

**Generic LLM endpoint** — `apps/api/plane/app/views/external/base.py:148` (`GPTIntegrationEndpoint`) and `:184` (`WorkspaceGPTIntegrationEndpoint`). Single OpenAI-compatible client (`OpenAI(api_key=...)` from `openai 1.63.2`).

Supported provider switch in `apps/api/plane/app/views/external/base.py:42-73`:

- **OpenAI** — models `gpt-3.5-turbo`, `gpt-4o-mini` (default), `gpt-4o`, `o1-mini`, `o1-preview`.
- **Anthropic** — models `claude-3-5-sonnet-20240620`, `claude-3-haiku-20240307`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229` (default), `claude-2.1`, `claude-2`, `claude-instant-1.2`, `claude-instant-1`.
- **Gemini** — models `gemini-pro` (default), `gemini-1.5-pro-latest`, `gemini-pro-vision`. Model ID is prepended with `gemini/` before the OpenAI-format call.

Configuration keys (env or InstanceConfiguration): `LLM_API_KEY`, `LLM_PROVIDER` (default `openai`), `LLM_MODEL` (defaults to provider's default).

Frontend client: `packages/services/src/ai/ai.service.ts`.

## Image Search — Unsplash

- `apps/api/plane/app/views/external/base.py:215` (`UnsplashEndpoint`).
- Uses `https://api.unsplash.com/search/photos` and `https://api.unsplash.com/photos`.
- Configuration key: `UNSPLASH_ACCESS_KEY` (env or InstanceConfiguration). Endpoint silently returns `[]` when not configured.

## Email (SMTP)

- Backend: `django.core.mail.backends.smtp.EmailBackend` (`apps/api/plane/settings/common.py:237`).
- Config resolved at runtime by `get_email_configuration()` in `apps/api/plane/license/utils/instance_value.py:42-59`: `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_PORT` (default 587), `EMAIL_USE_TLS` (default `1`), `EMAIL_USE_SSL` (default `0`), `EMAIL_FROM` (default `Team Plane <team@mailer.plane.so>`).
- Sent via Celery (`shared_task`s) for: forgot password (`apps/api/plane/bgtasks/forgot_password_task.py`), magic link (`magic_link_code_task.py`), workspace/project invitations (`workspace_invitation_task.py`, `project_invitation_task.py`), notification stack (`email_notification_task.py`, scheduled every 5 minutes via `apps/api/plane/celery.py:31-34`), user activation/deactivation, email update, project add-user.

## Webhooks (Outgoing)

- Workspace owners configure outgoing webhooks via `Webhook` model (`apps/api/plane/db/models/webhook.py:34`). Endpoints validated against `localhost`/`127.0.0.1` (rejected) and `http(s)` schemes only (`validate_schema`/`validate_domain`).
- Each webhook gets a generated secret in form `plane_wh_<32-char hex>` (`generate_token` in `apps/api/plane/db/models/webhook.py:17`).
- Per-event opt-ins on the `Webhook` row: `project`, `issue`, `module`, `cycle`, `issue_comment` (booleans). `project_webhooks` is a join table for project-scoped subscriptions.
- Delivery is HMAC-signed (`hmac` + SHA-256 with the webhook secret) by `apps/api/plane/bgtasks/webhook_task.py`.
- Each delivery is persisted as a `WebhookLog` (Postgres `webhook_logs` table) AND, when MongoDB is configured, also into MongoDB collection `webhook_logs`.
- Retry/backoff handled in `webhook_task.py`. Stale logs are deleted nightly by `plane.bgtasks.cleanup_task.delete_webhook_logs` (UTC 03:30).

## Webhooks (Incoming) and Workspace Integrations

**Workspace integrations table:**

- `apps/api/plane/db/models/workspace.py` defines `WorkspaceIntegration` (referenced from the integration models below).

**Slack integration (legacy/scaffolded, not actively wired in CE views):**

- Model `SlackProjectSync` in `apps/api/plane/db/models/integration/slack.py:14` stores per-project: `access_token`, `scopes`, `bot_user_id`, `webhook_url`, `team_id`, `team_name`, raw `data` JSONB, FK to `WorkspaceIntegration`.
- `slack-sdk==3.27.1` is declared in `apps/api/requirements/base.txt:42` but no SlackClient calls are present in the CE Python code. Treat the dependency as a placeholder for the EE/private-fork integration; do not add new public usage without product sign-off.

**GitHub integration (sync, scaffolded):**

- Models in `apps/api/plane/db/models/integration/github.py`:
  - `GithubRepository` — `name`, `url`, `config` JSON, `repository_id`, `owner`.
  - `GithubRepositorySync` — links a repo to a `WorkspaceIntegration` and a default `Label`; stores `credentials` JSON.
  - `GithubIssueSync` — maps Plane `Issue` ↔ GitHub issue (`repo_issue_id`, `github_issue_id`, `issue_url`).
  - `GithubCommentSync` — maps Plane `IssueComment` ↔ GitHub comment.
- Like Slack, sync controllers are not exposed in the CE views; the schema exists for the EE plug-in.

**Importers (`Importer` model, `apps/api/plane/db/models/importer.py`):**

- Two services: `github` and `jira`. Each `Importer` row is owned by a project, has a `status` (`queued`/`processing`/`completed`/`failed`), and stores import config plus `imported_data`. Imports run via Celery (no scheduled work — triggered on demand via API).

## Realtime Collaboration (apps/live)

- Hocuspocus server (`@hocuspocus/server 2.15.2`) wired in `apps/live/src/hocuspocus.ts:17`. Singleton manager pattern. Debounce: 10000ms.
- Extensions registered in `apps/live/src/extensions/index.ts:13-19` (order matters):
  1. `Logger` (`@hocuspocus/extension-logger`).
  2. `Database` (custom — fetches/persists Yjs documents via `apps/live/src/services/api.service.ts` calls back to Django).
  3. `Redis` (`@hocuspocus/extension-redis`) — multi-instance fan-out.
  4. `TitleSyncExtension` (custom — propagates page title changes).
  5. `ForceCloseHandler` (custom — must come AFTER Redis to receive broadcasts).
- WebSocket transport via `express-ws ^5.0.2` mounted at `LIVE_BASE_PATH` (default `/live`) on the Express router (`apps/live/src/server.ts:34-39`).
- CORS: configured via `CORS_ALLOWED_ORIGINS` env var. Allowed methods `GET, POST, PUT, DELETE, OPTIONS`. Allowed headers `Content-Type, Authorization, x-api-key` (`apps/live/src/server.ts:71-81`).
- Authentication: `onAuthenticate` hook in `apps/live/src/lib/auth.ts` validates a session token against the Django API (`apps/live/src/services/user.service.ts`). Server-to-server requests sign with `LIVE_SERVER_SECRET_KEY`.
- Required env (validated by Zod in `apps/live/src/env.ts:13-31`): `API_BASE_URL` (URL), `LIVE_SERVER_SECRET_KEY` (string), `LIVE_BASE_PATH` (default `/live`), `CORS_ALLOWED_ORIGINS`, optional `REDIS_URL` or `REDIS_HOST`+`REDIS_PORT`, `COMPRESSION_LEVEL` (default 6), `COMPRESSION_THRESHOLD` (default 5000), `PORT` (default 3000), `HOSTNAME`.
- Frontend client: `@hocuspocus/provider 2.15.2` consumed inside `@plane/editor` collaboration extensions.

## Monitoring & Observability

**OpenTelemetry (server-side telemetry):**

- `apps/api/plane/utils/telemetry.py:20` configures an OTLP/gRPC exporter using `opentelemetry-exporter-otlp 1.28.1`. Default endpoint: `https://telemetry.plane.so` (`OTLP_ENDPOINT` env override). Service name `plane-ce-api` (`SERVICE_NAME` env override).
- Auto-instruments Django via `DjangoInstrumentor`.
- Tracer is initialized on demand from `apps/api/plane/license/bgtasks/tracer.py:27` (`instance_traces`), which runs every 6 hours (`apps/api/plane/celery.py:35-38`) and only emits spans when `Instance.is_telemetry_enabled` is `True`. Reports per-instance and per-workspace counters (users, projects, issues, modules, cycles, etc.).

**PostHog (product analytics):**

- `apps/api/plane/bgtasks/event_tracking_task.py:62` — `track_event` Celery task. Reads `POSTHOG_API_KEY`, `POSTHOG_HOST` from InstanceConfiguration or env. Captures with `distinct_id=user_id`, `groups={"workspace": slug}`. Skips silently when keys are missing.
- Predefined events live in `apps/api/plane/utils/analytics_events.py` (e.g. `USER_INVITED_TO_WORKSPACE`, `WORKSPACE_DELETED`).

**Scout APM (production-only):**

- `apps/api/plane/settings/production.py:17` adds `scout_apm.django` to INSTALLED_APPS. Reads `SCOUT_MONITOR`, `SCOUT_KEY` (`scout-apm 3.1.0`).

**Sentry (env wired but no source code in CE):**

- `turbo.json` exposes `SENTRY_*` and `VITE_SENTRY_*` env vars (DSN, environment, traces/profiles/replays sample rates, send-default-pii). No `@sentry/*` imports exist in the open-source frontend or backend; this is reserved for the EE build.

**Microsoft Clarity (frontend session recorder):**

- `apps/web/app/root.tsx:83-90` and `apps/web/app/layout.tsx:90-96` inject the Clarity tag from `https://www.clarity.ms/tag/<key>` only when `VITE_ENABLE_SESSION_RECORDER=1` and `VITE_SESSION_RECORDER_KEY` is set. Disabled by default.

**Logs (server-side):**

- JSON logs via `python-json-logger`. Logger names: `plane.api`, `plane.api.request`, `plane.worker`, `plane.exception` (also writes to `logs/plane-{debug,error}.log`), `plane.external`, `plane.mongo`, `plane.authentication`, `plane.migrations`. Configured in `apps/api/plane/settings/production.py:31-104`. The `apps/live` server uses `@plane/logger` (custom workspace package).

**Logs (frontend):**

- No browser-side error reporting in the open-source build. Sentry env vars are reserved for EE.

## CI / CD & Deployment

**CI / hosting:**

- This repository ships **deployment recipes only** under `deployments/` (`aio`, `cli`, `kubernetes`, `swarm`). Production runtime is whatever the operator deploys (self-hosted by default).

**Container registries:**

- Docker images are built from `apps/api/Dockerfile.api` (Python 3.12.10-alpine), `apps/api/Dockerfile.dev` (development), `apps/proxy/Dockerfile.ce` (Caddy), and per-app Dockerfiles for the Node services. Source files for self-host: see `deployments/aio/`, `deployments/swarm/`, `deployments/kubernetes/`.

**Reverse proxy (production self-host):**

- Caddy configured by `apps/proxy/Caddyfile.ce`. Single SITE_ADDRESS host fans out:
  - `/api/*`, `/auth/*`, `/static/*` → `api:8000`
  - `/live/*` → `live:3000`
  - `/spaces/*` → `space:3000`
  - `/god-mode/*` → `admin:3000`
  - `/{$BUCKET_NAME}/*` → `plane-minio:9000`
  - else → `web:3000`
- ACME via `acme_ca {$CERT_ACME_CA:https://acme-v02.api.letsencrypt.org/directory}`. DNS challenge supported via `CERT_ACME_DNS`. Body limit per `FILE_SIZE_LIMIT`.

## Environment Configuration

**Where env vars are loaded:**

- Each app has a `apps/<app>/.env.example` template that `./setup.sh` copies to `.env`. Operators never read these files — only existence is meaningful here.
- Vite (`apps/web/vite.config.ts:11-19`) only forwards `VITE_*` vars to the browser. Add new browser-side vars to BOTH `apps/<app>/.env.example` AND `turbo.json > globalEnv`, otherwise turbo cache busts will be wrong.

**Critical Django env vars (server-side):**

- Database: `DATABASE_URL` OR `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_HOST`/`POSTGRES_PORT`. Optional: `ENABLE_READ_REPLICA`, `DATABASE_READ_REPLICA_URL` or `POSTGRES_READ_REPLICA_*`.
- Redis: `REDIS_URL` (use `rediss://` for TLS).
- RabbitMQ: `AMQP_URL` OR `RABBITMQ_USER`/`RABBITMQ_PASSWORD`/`RABBITMQ_HOST`/`RABBITMQ_PORT`/`RABBITMQ_VHOST`.
- S3 / MinIO: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_REGION`, `AWS_S3_ENDPOINT_URL` or `MINIO_ENDPOINT_URL`, `USE_MINIO`, `MINIO_ENDPOINT_SSL`, `SIGNED_URL_EXPIRATION`, `FILE_SIZE_LIMIT`.
- MongoDB (optional): `MONGO_DB_URL`, `MONGO_DB_DATABASE`.
- Cookies / hosts: `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `COOKIE_DOMAIN`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_AGE`, `SESSION_SAVE_EVERY_REQUEST`, `ADMIN_SESSION_COOKIE_AGE`.
- Base URLs: `WEB_URL`, `APP_BASE_URL`, `APP_BASE_PATH` (default `/`), `ADMIN_BASE_URL`, `ADMIN_BASE_PATH` (default `/god-mode/`), `SPACE_BASE_URL`, `SPACE_BASE_PATH` (default `/spaces/`), `LIVE_BASE_URL`, `LIVE_BASE_PATH` (default `/live/`), `INSTANCE_CHANGELOG_URL`.
- OAuth: `GOOGLE_CLIENT_ID`/`_SECRET`, `GITHUB_CLIENT_ID`/`_SECRET`/`GITHUB_ORGANIZATION_ID`, `GITLAB_CLIENT_ID`/`_SECRET`/`GITLAB_HOST`, `GITEA_CLIENT_ID`/`_SECRET`/`GITEA_HOST`.
- LLM: `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`.
- Misc external: `UNSPLASH_ACCESS_KEY`, `GITHUB_ACCESS_TOKEN`, `POSTHOG_API_KEY`/`POSTHOG_HOST`, `OTLP_ENDPOINT`, `SERVICE_NAME`, `SCOUT_MONITOR`/`SCOUT_KEY`.
- Email: `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`, `EMAIL_FROM`.
- Behaviour flags: `DEBUG`, `SECRET_KEY`, `SKIP_ENV_VAR` (default `1` — when `1`, configuration values are pulled from `InstanceConfiguration` rows in the DB rather than env), `ENABLE_DRF_SPECTACULAR`, `HARD_DELETE_AFTER_DAYS` (default 60).

**Runtime configuration override pattern:**

- When `SKIP_ENV_VAR=1` (the default), `get_configuration_value()` in `apps/api/plane/license/utils/instance_value.py:17-39` reads from the `InstanceConfiguration` table (encrypted via `cryptography`), falling back to env defaults. This is how the `/god-mode/` admin UI persists tenant-wide secrets at runtime instead of process restart. Code that needs configuration values should call `get_configuration_value(...)` rather than `os.environ.get(...)` directly.

**Live env (`apps/live/src/env.ts:13-31`):**

- All vars validated by Zod at boot — startup fails hard on invalid config.

**Frontend env (browser-exposed, must be `VITE_`-prefixed):**

- `VITE_API_BASE_URL` / `VITE_API_BASE_PATH` — Django host. Default empty (= same-origin).
- `VITE_ADMIN_BASE_URL` / `VITE_ADMIN_BASE_PATH`, `VITE_SPACE_BASE_URL` / `VITE_SPACE_BASE_PATH`, `VITE_LIVE_BASE_URL` / `VITE_LIVE_BASE_PATH`, `VITE_WEB_BASE_URL` / `VITE_WEB_BASE_PATH`.
- `VITE_WEBSITE_URL` (default `https://plane.so`), `VITE_SUPPORT_EMAIL` (default `support@plane.so`).
- `VITE_ENABLE_SESSION_RECORDER`, `VITE_SESSION_RECORDER_KEY` (Microsoft Clarity).
- `VITE_SENTRY_*` (reserved, no CE source consumers).

**Secrets storage:**

- Per-deployment `.env` files (gitignored). Operators never read these in this analysis.
- Runtime-configurable secrets stored in `InstanceConfiguration` (Postgres, encrypted) — accessed via the `/god-mode/` admin app.

## Calls Out to plane.so

The CE build talks directly to a few `plane.so`-hosted services. These are visible to operators self-hosting:

- **`https://api.github.com/repos/makeplane/plane/releases/latest`** — version check during instance registration (`apps/api/plane/license/management/commands/register_instance.py:42`).
- **`https://telemetry.plane.so`** — default OTLP endpoint (override with `OTLP_ENDPOINT`).
- **`https://sites.plane.so/pages/691ef037bcfe416a902e48cb55f59891/`** — default `INSTANCE_CHANGELOG_URL` (set in `apps/api/Dockerfile.api:7`).
- **`https://plane.so`**, **`https://plane.so/pricing`**, **`https://plane.so/contact`**, **`https://plane.so/one`** — marketing links exposed via constants in `packages/constants/src/endpoints.ts:27-33`.

## Public REST API Surface (incoming integrations)

- Mounted at `/api/v1/` (`apps/api/plane/urls.py:21`). URL submodules in `apps/api/plane/api/urls/__init__.py:5-30`: `asset`, `cycle`, `intake`, `label`, `member`, `module`, `project`, `state`, `user`, `work_item`, `invite`, `sticky`.
- Authenticated via `APIKeyAuthentication` middleware reading `X-API-Key` header. CORS adds `X-API-Key` to allowed headers (`apps/api/plane/settings/common.py:131`).
- Per-token rate limit (default `60/min`) enforced via `apps/api/plane/api/rate_limit.py`.
- OpenAPI spec at `/api/schema/` (when `ENABLE_DRF_SPECTACULAR=1`). Spec metadata in `apps/api/plane/settings/openapi.py:11`. Public docs site: `https://developers.plane.so/api-reference/introduction`.

---

_Integration audit: 2026-05-03_
