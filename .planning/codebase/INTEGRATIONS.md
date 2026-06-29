---
last_mapped: 2026-06-29
focus: tech
---

# Integrations

## Data Stores And Infrastructure

- PostgreSQL is the primary application database. Django reads `DATABASE_URL` or `POSTGRES_*` variables in `apps/api/plane/settings/common.py`.
- Optional read replica support is controlled by `ENABLE_READ_REPLICA` and `DATABASE_READ_REPLICA_URL` or `POSTGRES_READ_REPLICA_*` in `apps/api/plane/settings/common.py`.
- Redis/Valkey is used for Django cache and live collaboration support. API settings configure `django_redis` from `REDIS_URL`; live service code manages Redis in `apps/live/src/redis.ts`.
- RabbitMQ is the Celery broker. API settings build `CELERY_BROKER_URL` from `AMQP_URL` or `RABBITMQ_*` variables in `apps/api/plane/settings/common.py`.
- S3-compatible object storage is the default Django storage backend through `plane.settings.storage.S3Storage`, configured by `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_REGION`, `AWS_S3_ENDPOINT_URL`, and `USE_MINIO`.
- Docker compose services for self-hosting are declared in `docker-compose.yml`: `plane-db`, `plane-redis`, `plane-mq`, `plane-minio`, `api`, `worker`, `beat-worker`, `migrator`, `web`, `admin`, `space`, `live`, and `proxy`.
- Local development infrastructure is split into `docker-compose-local.yml`.
- Isolated API tests use `docker-compose-test.yml` with `test-db`, `test-redis`, `test-mq`, `test-minio`, and `api-tests`.

## Auth And Session Integrations

- Django session authentication is configured in DRF via `apps/api/plane/settings/common.py`.
- Custom session middleware is `plane.authentication.middleware.session.SessionMiddleware`.
- Custom user model is `db.User`, declared by `AUTH_USER_MODEL = "db.User"` in `apps/api/plane/settings/common.py`.
- Frontend auth API methods are centralized in `packages/services/src/auth/auth.service.ts`.
- Admin auth configuration UI includes email/password, Google, GitHub, GitLab, and Gitea configuration components under `apps/admin/components/authentication/`.
- Auth-related instance config types live in `packages/types/src/instance/auth.ts`.
- CSRF handling is explicit in frontend service code such as `AuthService.requestCSRFToken()` and `AuthService.signOut()` in `packages/services/src/auth/auth.service.ts`.

## External Product Integrations

- GitHub and Slack domain models exist in `apps/api/plane/db/models/integration/github.py` and `apps/api/plane/db/models/integration/slack.py`.
- Integration constants and fetch keys reference GitHub and Slack in `packages/constants/src/fetch-keys.ts` and `packages/constants/src/event-tracker/core.ts`.
- Admin OAuth setup references GitHub, GitLab, Google, and Gitea under `apps/admin/hooks/oauth/core.tsx` and `apps/admin/components/authentication/`.
- SMTP/email configuration is represented in `packages/types/src/instance/email.ts` and the admin email settings area.
- Unsplash, GitHub access token, analytics, and PostHog environment variables are read in `apps/api/plane/settings/common.py`.
- Sentry and session recorder environment variables are listed in `turbo.json` as global env dependencies for frontend builds.

## Realtime Collaboration

- `apps/live` is an Express + Hocuspocus service for collaborative rich text editing and PDF export.
- `apps/live/src/server.ts` creates the Express app, installs Helmet, compression, CORS, body parsing, logging, and routes from controllers.
- `apps/live/src/hocuspocus.ts` initializes the Hocuspocus collaboration server.
- Redis pub/sub for Hocuspocus admin commands is implemented in `apps/live/src/extensions/redis.ts`.
- Live service auth checks `LIVE_SERVER_SECRET_KEY` through `apps/live/src/lib/auth-middleware.ts`.
- Live service environment validation is defined with Zod in `apps/live/src/env.ts`; required values include `API_BASE_URL` and `LIVE_SERVER_SECRET_KEY`.

## API Clients And Network Boundary

- Shared Axios wrapper is `packages/services/src/api.service.ts`; it sets `withCredentials: true`.
- Domain services in `packages/services/src/**` map frontend operations to Django endpoints.
- Constants such as API base URLs and support email live in `packages/constants/src/endpoints.ts`.
- Frontend apps rely on Vite-style environment variables listed in `turbo.json`, including `VITE_API_BASE_URL`, `VITE_WEB_BASE_URL`, `VITE_SPACE_BASE_URL`, and `VITE_LIVE_BASE_URL`.

## Proxy And Deployment

- `apps/proxy/Caddyfile.ce` and `apps/proxy/Caddyfile.aio.ce` define reverse proxy behavior for self-hosted deployments.
- The production compose file builds `apps/proxy/Dockerfile.ce` and exposes ports from `LISTEN_HTTP_PORT` and `LISTEN_HTTPS_PORT`.
- Frontend Dockerfiles are under `apps/web/Dockerfile.web`, `apps/admin/Dockerfile.admin`, and `apps/space/Dockerfile.space`.
- API Dockerfiles are `apps/api/Dockerfile.api` and `apps/api/Dockerfile.dev`.

## Integration Risks

- Many integration settings are environment-driven. Planning changes should check both backend variables in `apps/api/plane/settings/common.py` and frontend variables in `turbo.json`.
- Local/test compose files use placeholder credentials. Do not copy values from `docker-compose-test.yml` into production docs or commits.
- Live collaboration depends on both API reachability and Redis health; features touching documents/pages often need changes in `apps/api`, `apps/live`, and `packages/editor`.

