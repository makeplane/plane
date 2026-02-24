# Deployment Guide

**Last Updated**: 2026-02-13
**Scope**: Local development, Docker Compose, Kubernetes, environment setup

## Quick Start (Docker Compose)

### Prerequisites

- Docker & Docker Compose (v2.0+)
- 8GB RAM minimum
- 20GB disk space
- Linux, macOS, or Windows (WSL2)

### Installation

**1. Clone repository**:

```bash
git clone https://github.com/makeplane/plane.git
cd plane
```

**2. Set up environment**:

```bash
cd deployments/cli/community
cp .env.example .env
# Edit .env with your configuration
```

**3. Start services**:

```bash
docker-compose up -d
```

**4. Access Plane**:

- Web: http://localhost
- Admin: http://localhost/god-mode
- API: http://localhost/api/v1
- Swagger: http://localhost/api/schema/swagger-ui

### First-Time Setup

After services start (wait ~30 seconds):

```bash
# Migrations run automatically via migrator service
# Create superuser (optional, for admin access)
docker-compose exec api python manage.py createsuperuser
```

## Environment Variables

### Core Configuration

| Variable        | Required | Default               | Purpose                       |
| --------------- | -------- | --------------------- | ----------------------------- |
| `DOMAIN`        | Yes      | `http://localhost`    | Public domain URL             |
| `DEBUG`         | No       | `0`                   | Django debug mode (0=prod)    |
| `SECRET_KEY`    | Yes      | (generated)           | Django secret key             |
| `ALLOWED_HOSTS` | Yes      | `localhost,127.0.0.1` | Comma-separated allowed hosts |

### Database

| Variable      | Default    | Purpose           |
| ------------- | ---------- | ----------------- |
| `DB_HOST`     | `plane-db` | PostgreSQL host   |
| `DB_PORT`     | `5432`     | PostgreSQL port   |
| `DB_NAME`     | `plane`    | Database name     |
| `DB_USER`     | `plane`    | Database user     |
| `DB_PASSWORD` | (required) | Database password |

### Cache & Sessions

| Variable         | Default       | Purpose        |
| ---------------- | ------------- | -------------- |
| `REDIS_HOST`     | `plane-redis` | Redis host     |
| `REDIS_PORT`     | `6379`        | Redis port     |
| `REDIS_PASSWORD` | (optional)    | Redis password |

### Message Queue

| Variable                 | Default    | Purpose           |
| ------------------------ | ---------- | ----------------- |
| `RABBITMQ_HOST`          | `plane-mq` | RabbitMQ host     |
| `RABBITMQ_PORT`          | `5672`     | RabbitMQ port     |
| `RABBITMQ_DEFAULT_USER`  | `plane`    | RabbitMQ user     |
| `RABBITMQ_DEFAULT_PASS`  | `plane`    | RabbitMQ password |
| `RABBITMQ_DEFAULT_VHOST` | `plane`    | RabbitMQ vhost    |

### File Storage (S3/MinIO)

| Variable                  | Default                   | Purpose          |
| ------------------------- | ------------------------- | ---------------- |
| `AWS_S3_REGION_NAME`      | `us-east-1`               | S3 region        |
| `AWS_STORAGE_BUCKET_NAME` | `uploads`                 | S3 bucket name   |
| `AWS_S3_ENDPOINT_URL`     | `http://plane-minio:9000` | MinIO endpoint   |
| `AWS_ACCESS_KEY_ID`       | `minioadmin`              | MinIO access key |
| `AWS_SECRET_ACCESS_KEY`   | `minioadmin`              | MinIO secret key |

### Authentication

| Variable                     | Default    | Purpose                    |
| ---------------------------- | ---------- | -------------------------- |
| `OAUTH_GOOGLE_CLIENT_ID`     | (optional) | Google OAuth client ID     |
| `OAUTH_GOOGLE_CLIENT_SECRET` | (optional) | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID`     | (optional) | GitHub OAuth client ID     |
| `OAUTH_GITHUB_CLIENT_SECRET` | (optional) | GitHub OAuth client secret |
| `OAUTH_GITLAB_CLIENT_ID`     | (optional) | GitLab OAuth client ID     |
| `OAUTH_GITLAB_CLIENT_SECRET` | (optional) | GitLab OAuth client secret |
| `OAUTH_GITEA_CLIENT_ID`      | (optional) | Gitea OAuth client ID      |
| `OAUTH_GITEA_CLIENT_SECRET`  | (optional) | Gitea OAuth client secret  |

### Email (Notifications)

| Variable              | Default            | Purpose            |
| --------------------- | ------------------ | ------------------ |
| `EMAIL_HOST`          | `smtp.gmail.com`   | SMTP server        |
| `EMAIL_PORT`          | `587`              | SMTP port          |
| `EMAIL_HOST_USER`     | (required)         | SMTP username      |
| `EMAIL_HOST_PASSWORD` | (required)         | SMTP password      |
| `EMAIL_USE_TLS`       | `1`                | Use TLS            |
| `EMAIL_FROM`          | `noreply@plane.so` | From email address |

### Scaling

| Variable               | Default | Purpose                 |
| ---------------------- | ------- | ----------------------- |
| `WEB_REPLICAS`         | `1`     | Web app instances       |
| `ADMIN_REPLICAS`       | `1`     | Admin app instances     |
| `SPACE_REPLICAS`       | `1`     | Space app instances     |
| `LIVE_REPLICAS`        | `1`     | Live server instances   |
| `API_REPLICAS`         | `1`     | API server instances    |
| `WORKER_REPLICAS`      | `1`     | Celery worker instances |
| `BEAT_WORKER_REPLICAS` | `1`     | Celery beat instances   |

## Docker Compose Services

### Frontend Services

**Web** (apps/web):

- Port: 3000
- Replicas: WEB_REPLICAS
- Uses: React Router v7, MobX
- Health: GET / → 200

**Admin** (apps/admin):

- Port: 3000
- Replicas: ADMIN_REPLICAS
- For: Instance configuration
- Health: GET / → 200

**Space** (apps/space):

- Port: 3000
- Replicas: SPACE_REPLICAS
- Public sharing portal (SSR enabled)
- Health: GET / → 200

### Backend Services

**API** (apps/api):

- Port: 8000
- Replicas: API_REPLICAS
- Framework: Django + Gunicorn
- Health: GET /api/health → 200
- Runs migrations automatically

**Live** (apps/live):

- Port: 3000
- Replicas: LIVE_REPLICAS
- Real-time collaboration server
- Technology: Express.js + Hocuspocus
- WebSocket support

### Worker Services

**Worker** (Celery):

- Role: Background task processor
- Replicas: WORKER_REPLICAS
- Processes async jobs from RabbitMQ
- Logs to: `/logs/worker/`

**Beat-Worker** (Celery Beat):

- Role: Scheduled task scheduler
- Replicas: BEAT_WORKER_REPLICAS
- Manages periodic tasks
- Logs to: `/logs/beat-worker/`

**Migrator**:

- Role: Database migration runner
- Runs once during startup
- Executes: `python manage.py migrate`
- Runs: `plane/bin/docker-entrypoint-migrator.sh`

### Infrastructure Services

**PostgreSQL** (postgres:15.7-alpine):

- Port: 5432
- Volume: pgdata
- Max connections: 1000
- Backup: Configure external backup

**Redis/Valkey** (valkey:7.2.11-alpine):

- Port: 6379
- Volume: redisdata
- Purpose: Cache, sessions, Celery results
- Persistence: AOF (append-only file)

**RabbitMQ** (rabbitmq:3.13.6-management):

- Port: 5672
- Management UI: 15672
- Volume: rabbitmq_data
- Default vhost: plane

**MinIO** (minio/latest):

- Port: 9000
- Console: 9090
- Volume: uploads
- Bucket: uploads
- S3-compatible storage

**Caddy** (plane-proxy):

- Port: 80, 443
- Role: Reverse proxy + TLS termination
- Config: Caddyfile.ce
- Volume: proxy_config, proxy_data

## Kubernetes Deployment

### Prerequisites

- Kubernetes 1.25+ cluster
- Helm 3+ installed
- kubectl configured

### Installation via Helm

**1. Add Plane Helm repository**:

```bash
helm repo add plane https://helm.plane.so
helm repo update
```

**2. Create namespace**:

```bash
kubectl create namespace plane
```

**3. Create values.yaml**:

```yaml
replicaCount: 3
domain: plane.example.com
tls:
  enabled: true
  issuer: letsencrypt-prod

postgres:
  enabled: true
  volume: 20Gi
redis:
  enabled: true
rabbitmq:
  enabled: true
minio:
  enabled: true
  volume: 50Gi
```

**4. Install Plane**:

```bash
helm install plane plane/plane \
  --namespace plane \
  -f values.yaml
```

**5. Verify deployment**:

```bash
kubectl -n plane get pods
kubectl -n plane get svc
```

### Scaling in Kubernetes

**Horizontal Pod Autoscaling**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: plane-api-hpa
  namespace: plane
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: plane-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Apply**:

```bash
kubectl apply -f hpa.yaml
```

### Persistent Storage

**PersistentVolumeClaim for PostgreSQL**:

```bash
kubectl -n plane get pvc
# Should show: pgdata (20Gi), redisdata, uploads, etc.
```

**Backup PostgreSQL**:

```bash
kubectl -n plane exec postgres-0 -- \
  pg_dump -U plane plane > backup.sql
```

## Local Development Setup

### Prerequisites

- Node.js 18+ LTS
- Python 3.9+
- PostgreSQL 15 (local or Docker)
- Redis (local or Docker)
- RabbitMQ (local or Docker)

### 1. Clone & Install

```bash
git clone https://github.com/makeplane/plane.git
cd plane

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd apps/api
pip install -r requirements/local.txt
```

### 2. PostgreSQL Setup

**Using Docker**:

```bash
docker run -d \
  --name plane-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=plane \
  -p 5432:5432 \
  postgres:15.7-alpine
```

**Local PostgreSQL**:

```bash
psql -U postgres -c "CREATE DATABASE plane;"
```

### 3. Environment Setup

**Backend** (`apps/api/.env`):

```env
DEBUG=1
SECRET_KEY=dev-secret-key-change-in-production
DB_ENGINE=django.db.backends.postgresql
DB_HOST=localhost
DB_NAME=plane
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend** (`apps/web/.env.local`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SPACE_BASE_URL=http://localhost:3000
```

### 4. Run Services

**Terminal 1 - PostgreSQL** (skip if using external):

```bash
# Already running in Docker
```

**Terminal 2 - Redis**:

```bash
docker run -d -p 6379:6379 redis:7.2-alpine
```

**Terminal 3 - Backend**:

```bash
cd apps/api
python manage.py migrate
python manage.py runserver 8000
```

**Terminal 4 - Celery Worker**:

```bash
cd apps/api
celery -A plane worker -l info
```

**Terminal 5 - Celery Beat** (optional):

```bash
cd apps/api
celery -A plane beat -l info
```

**Terminal 6 - Frontend**:

```bash
cd apps/web
pnpm dev
```

**Terminal 7 - Live Server** (optional):

```bash
cd apps/live
pnpm dev
```

### 5. Access Development Environment

- Web: http://localhost:5173 (Vite dev server)
- API: http://localhost:8000
- Docs: http://localhost:8000/api/schema/swagger-ui

## Database Migrations

### Running Migrations

**Docker Compose** (automatic):

```bash
# Runs on service startup
# Handled by migrator service
```

**Manual**:

```bash
docker-compose exec api python manage.py migrate
```

**Local Development**:

```bash
cd apps/api
python manage.py migrate
```

### Creating Migrations

After modifying models:

```bash
cd apps/api
python manage.py makemigrations
python manage.py migrate
```

### Migration Files

Location: `apps/api/plane/db/migrations/`

Pattern: `000X_descriptive_name.py`

## Backup & Restore

### PostgreSQL Backup

**Docker Compose**:

```bash
docker-compose exec plane-db pg_dump \
  -U plane plane > backup.sql
```

**Restore**:

```bash
docker-compose exec -T plane-db psql \
  -U plane plane < backup.sql
```

### MinIO Backup

**Using MC (MinIO Client)**:

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mirror local/uploads /backup/uploads
```

### Full System Backup

```bash
# Backup volumes
docker run --rm -v pgdata:/data \
  -v /backup:/backup \
  alpine tar czf /backup/pgdata.tar.gz -C /data .

# Backup all
docker-compose exec plane-db pg_dump -U plane plane | gzip > full-backup.sql.gz
```

## Troubleshooting

### Services Won't Start

**Check logs**:

```bash
docker-compose logs api
docker-compose logs web
```

**Common issues**:

- Database not ready: Wait 30s, retry
- Port already in use: Change LISTEN_PORT in .env
- Out of memory: Increase Docker memory allocation

### Database Connection Error

```bash
# Test connection
docker-compose exec api python manage.py dbshell

# Reset database (development only)
docker-compose exec api python manage.py flush --no-input
```

### Celery Tasks Not Running

```bash
# Check RabbitMQ
docker-compose logs plane-mq

# Restart workers
docker-compose restart worker beat-worker
```

### WebSocket Issues (Real-time Collaboration)

```bash
# Check Live server
docker-compose logs live

# Restart Live service
docker-compose restart live
```

## Production Checklist

- [ ] Set `DEBUG=0` in Django settings
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure OAuth providers (Google, GitHub, etc.)
- [ ] Set up email SMTP credentials
- [ ] Configure domain with valid SSL certificate
- [ ] Enable CORS only for your domain
- [ ] Set up monitoring (Sentry, Scout APM)
- [ ] Configure backups (PostgreSQL, MinIO)
- [ ] Set up log aggregation
- [ ] Configure health checks & alerts
- [ ] Test disaster recovery procedure
- [ ] Set resource limits on containers
- [ ] Enable rate limiting
- [ ] Document runbooks for operations

## Performance Tuning

### PostgreSQL

```sql
-- Increase work_mem for queries
ALTER SYSTEM SET work_mem = '256MB';

-- Increase max connections (if needed)
ALTER SYSTEM SET max_connections = 1000;

SELECT pg_reload_conf();
```

### Redis

```bash
# Increase maxmemory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Django/Gunicorn

```bash
# More workers (4x CPU cores typical)
gunicorn -w 8 -b 0.0.0.0:8000 plane.wsgi
```

## Build & Deploy lên Server (Mac → RHEL 9.6 Intel)

**Môi trường:**

- Máy dev: macOS (Apple Silicon hoặc Intel) hoặc Windows (Docker Desktop)
- Server: RHEL 9.6, chip Intel x86_64, chạy Docker

### Kiến trúc Container & Đường dẫn trong Container

| Container    | Image base                            | WORKDIR                          | Serve                              | Cách update               |
| ------------ | ------------------------------------- | -------------------------------- | ---------------------------------- | ------------------------- |
| `api`        | python:3.12-alpine                    | `/code`                          | Gunicorn (port 8000)               | Copy source → `kill -HUP` |
| `bgworker`   | python:3.12-alpine (cùng image `api`) | `/code`                          | Celery worker                      | Copy source → `kill -HUP` |
| `beatworker` | python:3.12-alpine (cùng image `api`) | `/code`                          | Celery beat                        | Copy source → restart     |
| `web`        | nginx:1.27-alpine                     | `/usr/share/nginx/html`          | Nginx static (port 3000)           | Copy build → nginx reload |
| `admin`      | nginx:1.29-alpine                     | `/usr/share/nginx/html/god-mode` | Nginx static (port 3000)           | Copy build → nginx reload |
| `space`      | node:22-alpine                        | `/app/apps/space`                | react-router-serve SSR (port 3000) | Copy build → restart      |
| `plane-live` | node:22-alpine                        | `/app/apps/live`                 | Node.js (port 3000)                | Copy dist → restart       |

---

### Lần đầu: Build Image + Deploy

#### Bước 1: Build trên máy dev

```bash
# macOS / Linux
./build-dev.sh all

# Windows (PowerShell)
.\build-dev.ps1 all
```

Output nằm trong `./dist-images/`:

```
dist-images/
├── plane-api.tar.gz        # ~250MB — API image
├── plane-web.tar.gz        # ~50MB  — Web image
├── plane-admin.tar.gz      # ~50MB  — Admin image
├── plane-space.tar.gz      # ~200MB — Space image
├── plane-live.tar.gz       # ~150MB — Live image
└── plane-proxy.tar.gz      # ~20MB  — Proxy image
```

#### Bước 2: Tạo cấu trúc folder trên server

SSH vào server tạo trước:

```bash
mkdir -p /opt/plane/images
mkdir -p /opt/plane/apps/api
```

#### Bước 3: Copy qua FileZilla (SFTP)

Mở FileZilla, kết nối SFTP đến server. Copy các file theo bảng sau:

| #   | File trên máy dev (Local)        | Copy vào server (Remote)               |
| --- | -------------------------------- | -------------------------------------- |
| 1   | `dist-images/plane-api.tar.gz`   | `/opt/plane/images/plane-api.tar.gz`   |
| 2   | `dist-images/plane-web.tar.gz`   | `/opt/plane/images/plane-web.tar.gz`   |
| 3   | `dist-images/plane-admin.tar.gz` | `/opt/plane/images/plane-admin.tar.gz` |
| 4   | `dist-images/plane-space.tar.gz` | `/opt/plane/images/plane-space.tar.gz` |
| 5   | `dist-images/plane-live.tar.gz`  | `/opt/plane/images/plane-live.tar.gz`  |
| 6   | `dist-images/plane-proxy.tar.gz` | `/opt/plane/images/plane-proxy.tar.gz` |
| 7   | `docker-compose.yml`             | `/opt/plane/docker-compose.yml`        |
| 8   | `.env`                           | `/opt/plane/.env`                      |
| 9   | `apps/api/.env`                  | `/opt/plane/apps/api/.env`             |
| 10  | `deploy-server.sh`               | `/opt/plane/deploy-server.sh`          |

#### Bước 4: SSH vào server, load images + start

```bash
ssh user@server-ip
cd /opt/plane
chmod +x deploy-server.sh
./deploy-server.sh all
```

---

### Các lần cập nhật tiếp theo

Tùy phần nào thay đổi, chỉ build + copy + deploy phần đó.

#### Cập nhật API (Python code) — 0 downtime

**1. Máy dev — build:**

```bash
./build-dev.sh api          # macOS/Linux
.\build-dev.ps1 api         # Windows
```

**2. FileZilla — copy 1 file:**

| File trên máy dev               | Copy vào server                |
| ------------------------------- | ------------------------------ |
| `dist-images/api-source.tar.gz` | `/opt/plane/api-source.tar.gz` |

**3. SSH server — deploy:**

```bash
cd /opt/plane && ./deploy-server.sh api
```

#### Cập nhật Web UI — 0 downtime

**1. Máy dev — build:**

```bash
./build-dev.sh web          # macOS/Linux
.\build-dev.ps1 web         # Windows
```

**2. FileZilla — copy 1 file:**

| File trên máy dev               | Copy vào server                |
| ------------------------------- | ------------------------------ |
| `dist-images/web-client.tar.gz` | `/opt/plane/web-client.tar.gz` |

**3. SSH server — deploy:**

```bash
cd /opt/plane && ./deploy-server.sh web
```

#### Cập nhật Admin (God Mode) — 0 downtime

**1. Máy dev — build:**

```bash
./build-dev.sh admin        # macOS/Linux
.\build-dev.ps1 admin       # Windows
```

**2. FileZilla — copy 1 file:**

| File trên máy dev                 | Copy vào server                  |
| --------------------------------- | -------------------------------- |
| `dist-images/admin-client.tar.gz` | `/opt/plane/admin-client.tar.gz` |

**3. SSH server — deploy:**

```bash
cd /opt/plane && ./deploy-server.sh admin
```

#### Cập nhật Space (SSR) — ~2-3s downtime

**1. Máy dev — build:**

```bash
./build-dev.sh space        # macOS/Linux
.\build-dev.ps1 space       # Windows
```

**2. FileZilla — copy 1 file:**

| File trên máy dev                | Copy vào server                        |
| -------------------------------- | -------------------------------------- |
| `dist-images/plane-space.tar.gz` | `/opt/plane/images/plane-space.tar.gz` |

**3. SSH server — deploy:**

```bash
cd /opt/plane && ./deploy-server.sh space
```

#### Cập nhật Live (WebSocket) — ~2-3s downtime

**1. Máy dev — build:**

```bash
./build-dev.sh live         # macOS/Linux
.\build-dev.ps1 live        # Windows
```

**2. FileZilla — copy 1 file:**

| File trên máy dev               | Copy vào server                       |
| ------------------------------- | ------------------------------------- |
| `dist-images/plane-live.tar.gz` | `/opt/plane/images/plane-live.tar.gz` |

**3. SSH server — deploy:**

```bash
cd /opt/plane && ./deploy-server.sh live
```

#### Cập nhật nhiều phần cùng lúc

```bash
# macOS/Linux
./build-dev.sh api web admin

# Windows
.\build-dev.ps1 api web admin
```

FileZilla copy tất cả file output, rồi SSH chạy deploy từng phần:

```bash
cd /opt/plane
./deploy-server.sh api
./deploy-server.sh web
./deploy-server.sh admin
```

---

### Tóm tắt quy trình

```
┌──────────────────────────────────────────────────────────┐
│                    MÁY DEV (macOS)                       │
│                                                          │
│  1. Code xong, test local OK                             │
│  2. Chạy build:                                          │
│     ./build-dev.sh api        (macOS/Linux)               │
│     .\build-dev.ps1 api       (Windows PowerShell)        │
│     Targets: api | web | admin | space | live | all       │
│                                                          │
│  3. Output trong ./dist-images/                          │
└─────────────────────┬────────────────────────────────────┘
                      │ FileZilla SFTP
┌─────────────────────▼────────────────────────────────────┐
│               SERVER (RHEL 9.6 Intel)                    │
│               /opt/plane/                                │
│                                                          │
│  4. SSH vào server, chạy deploy:                         │
│     ./deploy-server.sh api   ← kill -HUP, 0 downtime    │
│     ./deploy-server.sh web   ← nginx reload, 0 downtime │
│     ./deploy-server.sh all   ← recreate tất cả           │
│                                                          │
│  API: kill -HUP (workers cũ finish → workers mới lên)   │
│  Web/Admin: nginx -s reload (swap static files)          │
│  Space/Live: docker compose recreate (~2-3s downtime)    │
└──────────────────────────────────────────────────────────┘
```

### Script files

- **`build-dev.sh`** (macOS/Linux) hoặc **`build-dev.ps1`** (Windows) — build artifacts vào `./dist-images/`
- **`deploy-server.sh`** (copy lên `/opt/plane/`) — chạy trên server, load + graceful restart

### Troubleshooting

| Vấn đề                        | Nguyên nhân              | Giải pháp                                    |
| ----------------------------- | ------------------------ | -------------------------------------------- |
| `exec format error` khi start | Image build sai platform | Rebuild với `--platform linux/amd64`         |
| `No such process` khi HUP     | Gunicorn PID thay đổi    | Dùng `pgrep` thay vì PID file cũ             |
| 502 Bad Gateway sau reload    | Workers chưa boot xong   | Đợi 5-10s, check `docker logs api`           |
| Migration fail                | DB connection            | Check `docker ps` xem plane-db running       |
| Static files cũ               | Browser cache            | Vite hash filename tự động, hard refresh     |
| `docker cp` permission denied | SELinux trên RHEL        | `chcon -Rt svirt_sandbox_file_t /opt/plane/` |
| Image load chậm               | File tar.gz lớn          | Chỉ rebuild/copy phần thay đổi, không `all`  |

### Lưu ý quan trọng

- **`--platform linux/amd64`** là BẮT BUỘC (cả macOS Apple Silicon lẫn Windows ARM)
- **Luôn migrate trước khi HUP** — tránh code mới chạy trên schema cũ
- **Backup DB trước khi migrate** — `docker exec plane-db pg_dump -U plane plane > backup.sql`
- **RHEL SELinux**: nếu gặp permission denied, set context: `chcon -Rt svirt_sandbox_file_t /opt/plane/`
- **Không dùng `--reload` flag trên production** — tốn resource do watch filesystem liên tục
- **Test trên staging trước** khi deploy production

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/deployment-guide.md`
**Status**: Final
**Related**: Official deployment docs at https://developers.plane.so/self-hosting
