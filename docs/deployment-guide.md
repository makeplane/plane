# Deployment Guide (Archived)

**This page has been split into modular guides for clarity.**

## Quick Links

For **GitLab CI/CD Deployment Architecture** (new offline-first pipeline):

- **[Deployment Overview](./deployment/index.md)** — Architecture, concepts, quick start
- **[Runner Setup & Tokens](./deployment/setup-runners.md)** — Register runners, provision credentials
- **[Environment Configuration](./deployment/environment-setup.md)** — Set up `/etc/plane-release-deploy.env`
- **[Deployment Workflow](./deployment/deployment-workflow.md)** — Automatic dev deploy vs. release deploy
- **[Rollback Procedure](./deployment/rollback.md)** — Archive-based instant rollback
- **[Health & Monitoring](./deployment/health-monitoring.md)** — Health checks, logs, performance

---

## For Local Development

See `Local Development Setup` section in the [original guide](./deployment/index.md#local-development-setup).

### Quick Start

```bash
# Clone repository
git clone https://github.com/shbvn/plane.git
cd plane

# Setup frontend
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
# http://localhost:3000

# Setup backend (in separate terminal)
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
# http://localhost:8000

# Start services (in another terminal)
docker-compose -f docker-compose.dev.yml up -d
```

---

## For Operations / Deployment

**New in 2026:** GitLab CI/CD now handles all deployment without SSH/SCP.

**Three paths:**

### 1. **Automatic Dev Deployment** (Continuous Integration)

- Merge to `develop` branch
- Pipeline auto-runs: lint → test → build → **deploy:dev**
- Result: Dev server updated with latest code (~15-20 min)
- See: [Deployment Workflow - Auto Dev](./deployment/deployment-workflow.md#strategy-1-automatic-dev-deploy-ci-artifacts)

### 2. **Manual Dev Release** (Validation)

- Tag: `dev/shb_v1.2.0-build.123`
- Trigger: Manual job `deploy:dev:release` in GitLab UI
- Result: Dev server deploys from immutable release package
- See: [Deployment Workflow - Release Deploy](./deployment/deployment-workflow.md#strategy-2-release-based-deploy-gitlab-package-registry)

### 3. **Production Release** (Maintainer+ Protected Tag)

- Tag: `prod/shb_v1.2.0` (Maintainer creates)
- Trigger: Manual job `deploy:prod:release` in GitLab UI
- Result: Prod server deploys exact tagged version
- See: [Deployment Workflow - Production](./deployment/deployment-workflow.md#strategy-2-release-based-deploy-gitlab-package-registry)

---

## Rollback

All deployments archive the previous release locally for instant rollback — **no re-download needed**.

```bash
# View archived releases
ls -lh /opt/shb-deploy/plane-app/archive/

# Roll back to previous version
bash /tmp/rollback-v1.1.9/scripts/deploy-shb.sh ...
```

See: [Rollback & Recovery](./deployment/rollback.md)

---

## Docker Containerization (Reference)

The system uses Docker for all services. Original documentation on Dockerfiles and docker-compose is preserved below for reference.

### Multi-App Docker Compose

**File: docker-compose.yml (Production)**

```yaml
version: "3.8"

services:
  # Databases
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: plane
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # OpenLDAP (for Shinhan SSO)
  openldap:
    image: osixia/openldap:latest
    environment:
      LDAP_LOG_LEVEL: "256"
      LDAP_ORGANISATION: "Shinhan Bank"
      LDAP_DOMAIN: "shinhan.local"
      LDAP_BASE_DN: "dc=shinhan,dc=local"
      LDAP_ADMIN_PASSWORD: ${LDAP_ADMIN_PASSWORD}
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - openldap_data:/var/lib/ldap
      - openldap_config:/etc/ldap/slapd.d

  # Reverse Proxy
  proxy:
    image: caddy:latest
    volumes:
      - ./apps/proxy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
      - api
      - admin
      - space
      - live

  # Django Backend
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/plane
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672//
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
      - rabbitmq
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Celery Worker
  celery_worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: celery -A plane worker -l info
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/plane
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672//
    depends_on:
      - postgres
      - redis
      - rabbitmq

  # Celery Beat Scheduler
  celery_beat:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: celery -A plane beat -l info
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/plane
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672//
    depends_on:
      - postgres
      - redis
      - rabbitmq

  # React Frontend
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: http://api:8000
        NEXT_PUBLIC_LIVE_URL: http://live:3003
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://api:8000

  # Admin Panel
  admin:
    build:
      context: ./apps/admin
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      - api

  # Public Projects (Guest Access)
  space:
    build:
      context: ./apps/space
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    depends_on:
      - api

  # Real-Time WebSocket
  live:
    build:
      context: ./apps/live
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      REDIS_URL: redis://redis:6379/1
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  openldap_data:
  openldap_config:
  caddy_data:
  caddy_config:
```

### Database Migrations

**Development:**

```bash
cd apps/api
python manage.py migrate
```

**Docker:**

```bash
docker-compose exec api python manage.py migrate
```

**Production (with blue-green deployment):**

```bash
# During deployment, run migrations before starting new containers
docker-compose exec -T api python manage.py migrate

# Then restart containers
docker-compose up -d
```

**New migrations (2026-05):**

- `0178_help_center` — Instance-global Help Center (categories, articles, per-locale translations)

### Help Center Post-Deployment Setup (Content-as-Code Pipeline)

After migration `0178_help_center`, the Help Center content pipeline runs in this order:

#### Step 1: Seed Content from Markdown

Source of truth: `apps/api/plane/db/fixtures/help_center/` (categories.yaml + article markdown files).

```bash
# Development
cd apps/api
python manage.py seed_help_center

# Docker
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_center'
```

**Properties:**
- **Idempotent:** Safe to run multiple times
- **Instance-global:** Run ONCE per instance, not per workspace
- **Content:** Renders markdown → HTML → sanitizes (hardened allowlist, script/iframe/video dropped, style attribute removed) → injects screenshot markers (`{{screenshot:NAME}}` becomes `<p data-help-screenshot="NAME"></p>`)
- **Publishing:** All seeded articles published (readers can access immediately)
- **Additive only:** Does NOT delete articles/categories from the DB if missing from source tree (protects God-Mode-authored content)
- **Screenshots auto-injected:** After seeding text, the command injects the screenshots committed under `apps/api/plane/db/fixtures/help_center/_screenshots/` (opt out with `--skip-screenshots`). The PNGs ship with the repo, so **offline / air-gapped instances need no capture step** — `seed_help_center` alone yields a fully-populated guide (uploading the images to the instance's own object storage).

> **Production / offline deploy = Step 1 only.** Steps 2–4 below are for **maintainers refreshing the committed screenshot set** (e.g. after a UI change); they are NOT needed to deploy.

#### Step 2: Seed Demo Workspace (Staging / Dev Only — Never Production)

```bash
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_demo_data'
```

Creates an isolated `help-demo` workspace with demo data for screenshot capture. **NEVER run on production.**

#### Step 3: Capture Screenshots (If Re-Injecting Images)

See `tools/help-screenshots/README.md` for the full Playwright + Node.js workflow.

```bash
# Mint a session cookie for the screenshot user
SHOT_COOKIE=$(docker exec planeso-api-1 sh -c 'cd /code && python manage.py make_help_session' | tail -1)

# Run from host (needs web :3000 + api :8000 reachable)
cd tools/help-screenshots
npm install
SHOT_COOKIE="$SHOT_COOKIE" npm run capture  # writes ./out/<name>.png
```

#### Step 4: Refresh the committed screenshot set

The capture tool writes to `tools/help-screenshots/out/` (gitignored scratch). To make new/updated images ship with the repo, copy the ones matching a current `{{screenshot:NAME}}` marker into the committed folder and commit them:

```bash
cp tools/help-screenshots/out/<name>.png \
   apps/api/plane/db/fixtures/help_center/_screenshots/
git add apps/api/plane/db/fixtures/help_center/_screenshots/
```

The committed PNGs are the source of truth that `seed_help_center` injects. Asset rows in the DB are still instance-specific (minted at upload), but the *image bytes* now travel with the code.

#### Complete Per-Instance Sequence

**Deploy (production / offline) — one command:**

```bash
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_center'
```

Text + committed images, no Playwright, no network. `seed_help_center` renders bodies and auto-injects the committed screenshots — one command yields a fully-populated guide. Use `--skip-screenshots` for text only.

> **One-time per environment.** `seed_help_center` is a **bootstrap**: it refuses to run if the instance already has Help Center content, so it can never overwrite edits the business team made in God Mode. Pass `--force` only to deliberately re-seed from the repo markdown (e.g. on dev). After the bootstrap, each environment's guide lives independently in its own DB + object storage and is owned via God Mode.

**Maintainer (refresh images after a UI change) — capture against a running demo instance, then commit:**

```bash
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_demo_data'   # staging/dev only
SHOT_COOKIE=$(docker exec planeso-api-1 sh -c 'cd /code && python manage.py make_help_session' | tail -1)
cd tools/help-screenshots && npm install && SHOT_COOKIE="$SHOT_COOKIE" npm run capture
# then copy matching PNGs into _screenshots/ (Step 4) and commit
```

#### Promote a reviewed guide between environments (UAT → Production)

Each environment is seeded once, then the business team reviews/edits it in God Mode (rows in the DB, images in that instance's object storage). To push a reviewed UAT guide to production, **export a bundle, copy it across, import it** — no re-typing, no broken images:

```bash
# On UAT — write a portable bundle (manifest.json + assets/<id>.png pulled from MinIO)
docker exec planeso-api-1 sh -c 'cd /code && python manage.py export_help_center --out help_center_export'
docker cp planeso-api-1:/code/help_center_export ./help_center_export   # then scp / USB to prod

# On PROD — load it: upsert rows + upload images to PROD's object storage + rewrite image URLs
docker cp ./help_center_export planeso-api-1:/code/help_center_export
docker exec planeso-api-1 sh -c 'cd /code && python manage.py import_help_center --in help_center_export'
```

- **Import is additive upsert by slug** — it updates/creates from the bundle and never deletes guide content the target already has. Images are uploaded fresh and references rewritten to the new ids, so re-importing never breaks images; the previously-referenced objects become orphans in storage (clean those up at the storage layer if repeated promotions make it worthwhile).
- **It overwrites slug-matching articles**, so importing a *stale* bundle silently reverts later God-Mode edits on the target. Only import a bundle you actually intend to promote; the import is not reversible.
- **Asset ids are per-environment.** Only the image *bytes* travel in the bundle; import uploads them to the target's own storage and rewrites the inline `/api/assets/v2/static/<id>/` references (in both the rendered HTML and the editor JSON) to the new ids.
- Same commands double as a **per-environment backup/restore** of the Help Center.

**Via God Mode UI (no shell access):** the same promotion is available as buttons on **God Mode → Help Center** — **Export bundle** downloads the `.zip`, **Import bundle** uploads it (behind an overwrite confirmation) and reports how many categories/articles/images landed. The UI bundle is the same layout as the CLI bundle, so the two are interchangeable.

- **Upload size prerequisite.** A real bundle is tens of MB (it carries the guide's screenshots). The reverse proxy caps request bodies at `FILE_SIZE_LIMIT` (default **5 MB**) for every route **except** `POST /api/instances/help/import/`, which the bundled Caddyfiles raise to `HELP_BUNDLE_MAX_SIZE` (default **300 MB**); the API additionally caps the bundle at 256 MB. If you front the API with a different ingress (nginx, a cloud load balancer), raise the body limit for that one route there as well — otherwise a large UI import returns **413** at the proxy. The CLI `import_help_center` path is not proxied and has no such limit.

#### Notes

- Content authoring guide: `docs/help-center-authoring-guide.md` — how to add categories and articles as markdown
- Screenshot tool reference: `tools/help-screenshots/README.md` — adding new targets, interaction steps
- The loader is production-safe: all raw HTML is escaped before sanitizing; no XSS vectors
- Search uses accent-insensitive text index (Vietnamese folding, no PostgreSQL extensions needed)

### Search Database Requirements

Help Center search uses app-managed accent-folded text search **without pg_trgm or unaccent PostgreSQL extensions**:
- Search column: `search_text` (pre-folded by app: NFKD + combining mark stripping + Vietnamese accent folding, e.g., `đ→d`)
- Query: `icontains` over pre-folded column (no full-text search)
- Locale-aware: Scans all 3 locale translations for matches
- **Prerequisite:** None (no extension install required; production Postgres can be non-superuser)

### Environment Variables Checklist

**Required (Production):**

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `CELERY_BROKER_URL` — RabbitMQ AMQP URL
- `SECRET_KEY` — Django secret (min 50 chars, random)
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` — SMTP credentials
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — S3 credentials
- `ALLOWED_HOSTS` — Comma-separated domain list
- `DEBUG=False` — Disable debug mode in production

**OpenLDAP Integration (Shinhan SSO):**

- `LDAP_SERVER_URI` — LDAP server URL
- `LDAP_BIND_DN` — Admin DN
- `LDAP_BIND_PASSWORD` — Admin password
- `LDAP_BASE_DN` — Base DN
- `LDAP_USER_SEARCH_DN` — User search DN

---

## Health Checks & Monitoring

### Health Endpoint (Backend)

```bash
curl http://localhost:8000/health

# Response (200 OK)
{
  "database": "ok",
  "redis": "ok",
  "rabbitmq": "ok",
  "s3": "ok"
}
```

### Container Health Checks

```bash
# Check container health
docker inspect plane-api | jq '.[0].State.Health'
```

See: [Health & Monitoring](./deployment/health-monitoring.md)

---

## Backup & Recovery

### Database Backup

```bash
# Manual backup
pg_dump -h localhost -U plane plane > backup.sql

# Docker backup
docker-compose exec postgres pg_dump -U plane plane > backup.sql

# Restore
psql -h localhost -U plane plane < backup.sql
```

### Automated Backups (Production)

```yaml
backup_service:
  image: pg_cron
  volumes:
    - backup_data:/backups
  environment:
    DATABASE_URL: postgresql://user:password@postgres:5432/plane
  command: >
    pg_dump -h postgres -U plane plane | 
    gzip > /backups/plane-$(date +%Y%m%d-%H%M%S).sql.gz
```

---

**Last Updated:** 2026-05-30
**Version:** 2.1 (Added Help Center migration & seed command documentation)
