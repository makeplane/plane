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

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DOMAIN` | Yes | `http://localhost` | Public domain URL |
| `DEBUG` | No | `0` | Django debug mode (0=prod) |
| `SECRET_KEY` | Yes | (generated) | Django secret key |
| `ALLOWED_HOSTS` | Yes | `localhost,127.0.0.1` | Comma-separated allowed hosts |

### Database

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `plane-db` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `plane` | Database name |
| `DB_USER` | `plane` | Database user |
| `DB_PASSWORD` | (required) | Database password |

### Cache & Sessions

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_HOST` | `plane-redis` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | (optional) | Redis password |

### Message Queue

| Variable | Default | Purpose |
|----------|---------|---------|
| `RABBITMQ_HOST` | `plane-mq` | RabbitMQ host |
| `RABBITMQ_PORT` | `5672` | RabbitMQ port |
| `RABBITMQ_DEFAULT_USER` | `plane` | RabbitMQ user |
| `RABBITMQ_DEFAULT_PASS` | `plane` | RabbitMQ password |
| `RABBITMQ_DEFAULT_VHOST` | `plane` | RabbitMQ vhost |

### File Storage (S3/MinIO)

| Variable | Default | Purpose |
|----------|---------|---------|
| `AWS_S3_REGION_NAME` | `us-east-1` | S3 region |
| `AWS_STORAGE_BUCKET_NAME` | `uploads` | S3 bucket name |
| `AWS_S3_ENDPOINT_URL` | `http://plane-minio:9000` | MinIO endpoint |
| `AWS_ACCESS_KEY_ID` | `minioadmin` | MinIO access key |
| `AWS_SECRET_ACCESS_KEY` | `minioadmin` | MinIO secret key |

### Authentication

| Variable | Default | Purpose |
|----------|---------|---------|
| `OAUTH_GOOGLE_CLIENT_ID` | (optional) | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | (optional) | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID` | (optional) | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | (optional) | GitHub OAuth client secret |
| `OAUTH_GITLAB_CLIENT_ID` | (optional) | GitLab OAuth client ID |
| `OAUTH_GITLAB_CLIENT_SECRET` | (optional) | GitLab OAuth client secret |
| `OAUTH_GITEA_CLIENT_ID` | (optional) | Gitea OAuth client ID |
| `OAUTH_GITEA_CLIENT_SECRET` | (optional) | Gitea OAuth client secret |

### Email (Notifications)

| Variable | Default | Purpose |
|----------|---------|---------|
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_HOST_USER` | (required) | SMTP username |
| `EMAIL_HOST_PASSWORD` | (required) | SMTP password |
| `EMAIL_USE_TLS` | `1` | Use TLS |
| `EMAIL_FROM` | `noreply@plane.so` | From email address |

### Scaling

| Variable | Default | Purpose |
|----------|---------|---------|
| `WEB_REPLICAS` | `1` | Web app instances |
| `ADMIN_REPLICAS` | `1` | Admin app instances |
| `SPACE_REPLICAS` | `1` | Space app instances |
| `LIVE_REPLICAS` | `1` | Live server instances |
| `API_REPLICAS` | `1` | API server instances |
| `WORKER_REPLICAS` | `1` | Celery worker instances |
| `BEAT_WORKER_REPLICAS` | `1` | Celery beat instances |

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

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/deployment-guide.md`
**Lines**: ~520
**Status**: Final
**Related**: Official deployment docs at https://developers.plane.so/self-hosting
