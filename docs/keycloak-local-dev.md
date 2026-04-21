# Keycloak OIDC Local Development Guide

This guide walks you through setting up a local Keycloak server and configuring Plane to use it for OIDC authentication.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ with corepack/pnpm
- Python 3.12+ with uv (or pip)

## 1. Initial Project Setup

If this is your first time setting up the project, run the setup script from the project root:

```bash
chmod +x setup.sh
./setup.sh
```

This script:

- Copies `.env.example` → `.env` for all apps (root, web, api, space, admin, live)
- Generates a Django `SECRET_KEY` and appends it to `apps/api/.env`
- Runs `corepack enable` and `pnpm install`

> **Already set up?** Skip to step 2. Just make sure your `.env` files exist.

## 2. Start Infrastructure

Start Plane's local dependencies (Postgres, Redis, RabbitMQ, MinIO):

```bash
docker compose -f docker-compose-local.yml up -d plane-db plane-redis plane-mq plane-minio
```

## 3. Start Keycloak Server

Add a Keycloak container. You can either add it to `docker-compose-local.yml` or run it standalone:

### Option A: Standalone Docker (recommended for dev)

```bash
docker run -d \
  --name keycloak-dev \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.2 start-dev
```

### Option B: Add to docker-compose-local.yml

```yaml
# Add under services:
keycloak:
  image: quay.io/keycloak/keycloak:26.2
  command: start-dev
  restart: unless-stopped
  networks:
    - dev_env
  ports:
    - "8080:8080"
  environment:
    KC_BOOTSTRAP_ADMIN_USERNAME: admin
    KC_BOOTSTRAP_ADMIN_PASSWORD: admin
```

Then: `docker compose -f docker-compose-local.yml up -d keycloak`

Wait ~30s for Keycloak to start, then verify: http://localhost:8080

## 4. Configure Keycloak Realm & Client

### 3.1 Create a Realm

1. Go to http://localhost:8080/admin (login: `admin` / `admin`)
2. Click the realm dropdown (top-left, says "master") → **Create realm**
3. Set **Realm name** = `plane` → **Create**

### 3.2 Create a Client

1. In the `plane` realm → **Clients** → **Create client**
2. **Client ID** = `plane-app` → **Next**
3. Enable **Client authentication** (this makes it a confidential client) → **Next**
4. Set **Valid redirect URIs**:
   - `http://localhost:3000/auth/keycloak/callback/` (web app)
   - `http://localhost:3002/auth/keycloak/callback/` (space app)
   - `http://localhost:8000/auth/keycloak/callback/` (API direct)
5. Set **Valid post logout redirect URIs**: `http://localhost:3000/*`
6. Set **Web origins**: `http://localhost:3000`
7. Click **Save**

### 3.3 Get Client Secret

1. Go to **Clients** → `plane-app` → **Credentials** tab
2. Copy the **Client secret** value

### 3.4 Create a Test User

1. Go to **Users** → **Add user**
2. Fill in:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **Email verified**: ON
   - **First name**: `Test`
   - **Last name**: `User`
3. Click **Create**
4. Go to **Credentials** tab → **Set password**:
   - **Password**: `testpass`
   - **Temporary**: OFF
5. Click **Save**

## 5. Configure Plane API

Add Keycloak environment variables to the **end** of `apps/api/.env` (which was created by `setup.sh`):

```bash
# Keycloak OIDC Configuration
IS_KEYCLOAK_ENABLED=1
KEYCLOAK_HOST=http://localhost:8080
KEYCLOAK_REALM=plane
KEYCLOAK_CLIENT_ID=plane-app
KEYCLOAK_CLIENT_SECRET=<paste-client-secret-from-step-4.3>
ENABLE_KEYCLOAK_SYNC=0
```

> **Tip:** If running Keycloak inside `docker-compose-local.yml` (Option B in step 3), use `KEYCLOAK_HOST=http://keycloak:8080` for API running in Docker, or `http://localhost:8080` for API running locally.

## 6. Start Plane

### Option A: Docker (all backend services)

```bash
docker compose -f docker-compose-local.yml up -d api worker beat-worker migrator
```

This starts the API server, Celery worker (background jobs), beat worker (scheduled tasks), and runs migrations automatically.

### Option B: Local Python

```bash
cd apps/api
source .venv/bin/activate  # or your virtualenv

# 1. Run migrations
python manage.py migrate --settings=plane.settings.local

# 2. Start API server
python manage.py runserver 8000 --settings=plane.settings.local

# 3. Start Celery worker (in a separate terminal)
cd apps/api && source .venv/bin/activate
DJANGO_SETTINGS_MODULE=plane.settings.local celery -A plane worker -l info

# 4. Start Celery beat (in a separate terminal, optional — for scheduled tasks)
cd apps/api && source .venv/bin/activate
DJANGO_SETTINGS_MODULE=plane.settings.local celery -A plane beat -l info
```

> **Note:** Without the Celery worker, background tasks (activation emails, workspace invitation processing) will queue but not execute. The OAuth login flow itself works without it, but post-login workflows won't complete.

### Start Frontend

```bash
# From project root (skip if setup.sh already ran these)
corepack enable
pnpm install
pnpm dev
```

This starts:

- Web app: http://localhost:3000
- Admin panel: http://localhost:3001

### Start Live Service (optional — for real-time collaboration)

```bash
pnpm --filter=live dev
```

This starts the Hocuspocus/Yjs collaboration server on http://localhost:3004. Not required for authentication testing, but needed for real-time document editing.

## 7. Enable Keycloak in Admin Panel

1. Go to http://localhost:3001 (Admin / God Mode)
2. Navigate to **Authentication**
3. Find the **Keycloak** card → click **Configure**
4. Fill in:
   - **Host**: `http://localhost:8080`
   - **Realm**: `plane`
   - **Client ID**: `plane-app`
   - **Client Secret**: `<your-secret>`
5. Toggle **Enable Keycloak** ON
6. Click **Save**

> **Note:** You can configure either via env vars (step 5) or via Admin UI (step 7). The Admin UI values take precedence over env vars when the instance config store has values.

## 8. Test the Login Flow

1. Go to http://localhost:3000 (Web app)
2. On the login page, you should see a **Keycloak** button
3. Click it → redirects to Keycloak login page at `localhost:8080`
4. Enter `testuser@example.com` / `testpass`
5. After successful auth → redirected back to Plane, logged in

### Expected OAuth Flow

```
Browser → GET /auth/keycloak/ (Plane API)
       → 302 redirect to Keycloak authorize endpoint
       → User logs in on Keycloak
       → 302 callback to /auth/keycloak/callback/ (Plane API)
       → Plane exchanges code for token, fetches userinfo
       → Creates/updates user account
       → 302 redirect to Plane web app (logged in)
```

## 9. Run Unit Tests

```bash
cd apps/api
source .venv/bin/activate
uv pip install -r requirements/test.txt  # if not already installed

REDIS_URL="redis://localhost:6379" \
SECRET_KEY="test-secret" \
DJANGO_SETTINGS_MODULE="plane.settings.test" \
pytest plane/tests/unit/authentication/test_keycloak_provider.py -v -m unit
```

All 16 tests should pass. These tests mock all external dependencies and don't need a running Keycloak server.

## Troubleshooting

### "Keycloak is not configured" error

- Check that `IS_KEYCLOAK_ENABLED=1` is set (not `0` or empty)
- Verify `KEYCLOAK_HOST` includes the scheme: `http://localhost:8080` (not `localhost:8080`)
- Ensure all 5 config keys are set: host, realm, client_id, client_secret, is_enabled

### Redirect URI mismatch

- Keycloak's client config must have the exact redirect URI including trailing slash
- For local dev with web app: `http://localhost:3000/auth/keycloak/callback/`
- Check if your app uses http vs https (local dev = http)

### "Invalid grant" or token errors

- Ensure the Keycloak client has **Client authentication** enabled (confidential client)
- Verify the client secret matches between Plane config and Keycloak
- Check Keycloak server logs: `docker logs keycloak-dev`

### User created but no email

- Keycloak must return the `email` claim. Ensure:
  - User has email set and verified in Keycloak
  - Client scopes include `email` (default in Keycloak 26+)

### Docker networking issues

If running API in Docker and Keycloak standalone (or vice versa), use the host machine IP or Docker network:

```bash
# From Docker container, access host services:
KEYCLOAK_HOST=http://host.docker.internal:8080
```

## File Reference

| Component    | Files                                                                |
| ------------ | -------------------------------------------------------------------- |
| Provider     | `apps/api/plane/authentication/provider/oauth/keycloak.py`           |
| App Views    | `apps/api/plane/authentication/views/app/keycloak.py`                |
| Space Views  | `apps/api/plane/authentication/views/space/keycloak.py`              |
| URL Routes   | `apps/api/plane/authentication/urls.py`                              |
| Error Codes  | `apps/api/plane/authentication/adapter/error.py`                     |
| Config Vars  | `apps/api/plane/utils/instance_config_variables/core.py`             |
| Instance API | `apps/api/plane/license/api/views/instance.py`                       |
| DB Migration | `apps/api/plane/db/migrations/0122_alter_account_provider.py`        |
| Types        | `packages/types/src/instance/auth.ts`, `base.ts`                     |
| Web Hook     | `apps/web/core/hooks/oauth/core.tsx`                                 |
| Space Hook   | `apps/space/hooks/oauth/core.tsx`                                    |
| Admin Hook   | `apps/admin/hooks/oauth/core.tsx`                                    |
| Admin Config | `apps/admin/components/authentication/keycloak-config.tsx`           |
| Admin Page   | `apps/admin/app/(all)/(dashboard)/authentication/keycloak/`          |
| Unit Tests   | `apps/api/plane/tests/unit/authentication/test_keycloak_provider.py` |
