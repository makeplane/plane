# Plane GCP Deployment - Issues & Fixes

This document captures the major issues encountered during the GCP Cloud Run deployment and their solutions.

## 1. Cloud Armor WAF Blocking Legitimate Requests

**Problem:** Cloud Armor's preconfigured WAF rules (XSS, SQLi, LFI, RFI) were blocking legitimate application requests, causing 403 errors on the main site and admin panel.

**Solution:** Added explicit allow rules with higher priority (lower numbers) than the WAF deny rules:
- Priority 100: Allow `/god-mode.*` (admin panel)
- Priority 101: Allow `/api/instances/.*` (instance setup)
- Priority 102: Allow `/auth/.*` (authentication)
- Priority 103: Allow `/api/.*` (all API endpoints)
- Priority 104: Allow `/` (root path)

**Current State:** WAF rules are in **preview mode** to prevent blocking. Consider tuning exclusions for production.

**File:** `terraform/loadbalancer.tf`

---

## 2. Frontend Apps Redirecting to localhost:3000

**Problem:** Vite build-time environment variables (`VITE_*_BASE_URL`) were baked into the JavaScript bundles with localhost values from `.env` files, causing redirects to `localhost:3000`.

**Root Cause:** The Dockerfiles were copying `.env` files before the build, and `vite.config.ts` loads these files, overriding the `--build-arg` values.

**Solution:** Added `RUN rm -f` commands in Dockerfiles to remove `.env` files before building:
```dockerfile
# Remove .env files to ensure build args are used instead
RUN rm -f apps/admin/.env apps/web/.env apps/space/.env packages/*/.env 2>/dev/null || true
```

**Files:**
- `apps/admin/Dockerfile.admin`
- `apps/web/Dockerfile.web`
- `apps/space/Dockerfile.space`

---

## 3. Missing Instance Database Record

**Problem:** API returned `{"is_activated": false}` instead of instance data, causing infinite loading spinner in the admin panel. The `Instance` database record was never created.

**Root Cause:** The `register_instance` management command required external dependencies (Celery, license server) that weren't available in Cloud Run.

**Solution:** Added inline Python to `docker-entrypoint-migrator.sh` to create the Instance record directly:
```python
if not Instance.objects.exists():
    Instance.objects.create(
        instance_name='Plane Community Edition',
        instance_id=secrets.token_hex(12),
        ...
    )
```

**File:** `apps/api/bin/docker-entrypoint-migrator.sh`

---

## 4. Missing Authentication Toggle Configs (IS_GOOGLE_ENABLED)

**Problem:** Google Authentication toggle did nothing - PATCH request returned empty array. The `IS_GOOGLE_ENABLED` configuration record didn't exist in the database.

**Root Cause:** Bug in Plane's `configure_instance` command. It checks:
```python
if not InstanceConfiguration.objects.filter(key__in=keys).exists():
```
But `IS_GITEA_ENABLED` is already created by `core_config_variables`, so the condition is false and `IS_GOOGLE_ENABLED` is never created.

**Solution:** Added explicit creation of auth toggle configs in `docker-entrypoint-migrator.sh`:
```python
auth_toggle_configs = [
    ('IS_GOOGLE_ENABLED', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
    ('IS_GITHUB_ENABLED', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'),
    ('IS_GITLAB_ENABLED', 'GITLAB_CLIENT_ID', 'GITLAB_CLIENT_SECRET'),
]
for toggle_key, client_id_key, client_secret_key in auth_toggle_configs:
    if not InstanceConfiguration.objects.filter(key=toggle_key).exists():
        # Create the config...
```

**File:** `apps/api/bin/docker-entrypoint-migrator.sh`

---

## 5. Nginx SPA Routing for Admin Panel

**Problem:** Navigating to `/god-mode/general/` showed "Welcome to nginx!" instead of the React app.

**Root Cause:** Nginx fallback was set to `/index.html` but the admin app builds to `/god-mode/index.html`.

**Solution:** Updated nginx config to serve the correct SPA fallback:
```nginx
location /god-mode/ {
    try_files $uri $uri/ /god-mode/index.html;
}
```

**File:** `apps/admin/nginx/nginx.conf`

---

## 6. GCS CORS Configuration for File Uploads

**Problem:** Profile picture uploads failed with CORS error: "No 'Access-Control-Allow-Origin' header".

**Solution:** Added CORS configuration to the GCS bucket:
```hcl
cors {
  origin          = ["https://${var.domain}"]
  method          = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  response_header = ["Content-Type", "Content-Length", "Content-Disposition", "Cache-Control"]
  max_age_seconds = 3600
}
```

**File:** `terraform/storage.tf`

---

## 7. Celery Broker Not Configured (500 on Asset Upload)

**Problem:** Asset upload PATCH requests returned 500 error with `[Errno 111] Connection refused`.

**Root Cause:** Plane uses Celery for background tasks but no message broker (RabbitMQ) was configured. The `get_asset_object_metadata.delay()` call failed.

**Solution:**
1. Configured Redis (Memorystore) as the Celery broker by setting `AMQP_URL`:
```hcl
AMQP_URL = "redis://${google_redis_instance.plane_redis.host}:${google_redis_instance.plane_redis.port}/1"
```

2. Added try/except around Celery task calls as a safety measure:
```python
try:
    get_asset_object_metadata.delay(asset_id=str(asset_id))
except Exception:
    # Celery broker unavailable - skip metadata task
    pass
```

**Files:**
- `terraform/compute.tf`
- `apps/api/plane/app/views/asset/v2.py`

---

## Architecture Notes

### Load Balancer URL Routing
The GCP Load Balancer routes traffic similar to the docker-compose Caddy proxy:

| Path | Backend Service |
|------|-----------------|
| `/api/*` | plane-api |
| `/auth/*` | plane-api |
| `/god-mode/*` | plane-admin |
| `/spaces/*` | plane-space |
| `/live/*` | plane-live |
| `/*` (default) | plane-web |

### Environment Variables
Frontend apps use **empty** `VITE_*_BASE_URL` values to make relative API calls. The Load Balancer handles routing.

### Services
- **plane-api**: Django REST API (port 8080)
- **plane-web**: Main React app (nginx on port 3000)
- **plane-admin**: Admin panel (nginx on port 3000)
- **plane-space**: Public workspaces (port 3000)
- **plane-live**: WebSocket server (port 3000)
- **plane-worker**: Celery worker (uses API image)
- **plane-beat**: Celery beat scheduler (uses API image)
- **plane-migrator**: Database migration job (uses API image)

### Key Infrastructure
- **Cloud SQL PostgreSQL**: Database with private IP
- **Memorystore Redis**: Cache + Celery broker
- **GCS Bucket**: File storage (S3-compatible via HMAC keys)
- **Cloud Armor**: WAF (currently in preview mode)
- **Managed SSL Certificate**: Auto-provisioned for domain
