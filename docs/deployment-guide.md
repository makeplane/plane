# Deployment Guide

## Local Development Setup

### Prerequisites

- **Node.js:** 22.18+
- **Python:** 3.11+
- **PostgreSQL:** 13+
- **Redis:** 7+
- **RabbitMQ:** 3.12+
- **pnpm:** 10.24+
- **Docker:** 24+ (optional, for containerized development)

### Quick Start

**1. Clone Repository**

```bash
git clone https://github.com/shbvn/plane.git
cd plane
```

**2. Setup Frontend**

```bash
# Install dependencies
pnpm install

# Create environment file
cp apps/web/.env.example apps/web/.env.local

# Start dev server
pnpm dev:web
# Frontend running at http://localhost:3000
```

**3. Setup Backend**

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver 0.0.0.0:8000
# Backend running at http://localhost:8000
```

**4. Setup Services (Docker Compose)**

```bash
# Start PostgreSQL, Redis, RabbitMQ
docker-compose -f docker-compose.dev.yml up -d

# Verify services
docker-compose ps
```

**5. Start Celery Worker (in separate terminal)**

```bash
cd apps/api
source venv/bin/activate
celery -A plane worker -l info
```

### Environment Variables

**Frontend (apps/web/.env.local):**

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WORKSPACE_SLUG=workspace

# Feature Flags
NEXT_PUBLIC_ENABLE_WORKFLOWS=true
NEXT_PUBLIC_ENABLE_TIME_TRACKING=true
NEXT_PUBLIC_ENABLE_HO=true

# Real-time (optional)
NEXT_PUBLIC_LIVE_URL=http://localhost:3003
```

**Backend (apps/api/.env):**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/plane

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//

# OpenLDAP (Shinhan SSO)
LDAP_SERVER_URI=ldap://openldap:389
LDAP_BIND_DN=cn=admin,dc=shinhan,dc=local
LDAP_BIND_PASSWORD=your-admin-password
LDAP_BASE_DN=dc=shinhan,dc=local
LDAP_USER_SEARCH_DN=ou=users,dc=shinhan,dc=local

# Email (SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_FROM_USER=noreply@plane.so

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=plane-uploads
AWS_S3_REGION_NAME=us-east-1

# JWT Secret
SECRET_KEY=your-secret-key-min-50-chars

# Debug Mode
DEBUG=True  # Set to False in production

# Allowed Hosts
ALLOWED_HOSTS=localhost,127.0.0.1,*.example.com
```

**Real-Time Server (apps/live/.env):**

```env
HOCUSPOCUS_PORT=3003
HOCUSPOCUS_HOST=0.0.0.0

# Optional: Persistence
HOCUSPOCUS_PERSISTENCE=redis
REDIS_URL=redis://localhost:6379/1
```

## Docker Containerization

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

### Dockerfile Patterns

**Django Backend (apps/api/Dockerfile):**

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    openldap-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 plane && chown -R plane:plane /app
USER plane

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", \
     "--worker-class", "gthread", "--timeout", "120", "plane.settings.asgi:application"]
```

**React Frontend (apps/web/Dockerfile):**

```dockerfile
# Build stage
FROM node:22-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_LIVE_URL=http://localhost:3003
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_LIVE_URL=$NEXT_PUBLIC_LIVE_URL

RUN cd apps/web && pnpm build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Install production dependencies
RUN npm install -g pnpm && cd apps/web && pnpm install --prod

# Expose port
EXPOSE 3000

# Run
CMD ["node", "-e", "require('next').startServer({ dir: './apps/web' })"]
```

## Caddy Reverse Proxy Configuration

**File: apps/proxy/Caddyfile**

```caddy
{
  order http.handlers 100
}

# Main domain
example.com, www.example.com {
  # Static files caching
  @assets {
    path /_next/static/*
    path /public/*
  }
  header @assets Cache-Control "public, max-age=31536000, immutable"

  # API routing
  @api {
    path /api/*
  }
  reverse_proxy @api http://api:8000 {
    header_upstream X-Forwarded-For {http.request.remote.host}
    header_upstream X-Forwarded-Proto https
  }

  # WebSocket routing
  @ws {
    path /live/*
    header Connection "upgrade"
    header Upgrade websocket
  }
  reverse_proxy @ws http://live:3003

  # React app (default)
  reverse_proxy http://web:3000 {
    header_upstream X-Forwarded-For {http.request.remote.host}
    header_upstream X-Forwarded-Proto https
  }

  # Security headers
  header -Server
  header Strict-Transport-Security "max-age=31536000; includeSubDomains" permanent
  header X-Content-Type-Options "nosniff"
  header X-Frame-Options "DENY"
  header X-XSS-Protection "1; mode=block"
}

# Admin panel (subdomain)
admin.example.com {
  reverse_proxy http://admin:3001
}

# Public/guest access (subdomain)
space.example.com {
  reverse_proxy http://space:3002
}
```

## Database Migrations

### Running Migrations

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

### Creating Migrations

```bash
cd apps/api

# Create migration file
python manage.py makemigrations --name add_workflow_blockers

# Review generated file (migrations/0XXX_add_workflow_blockers.py)
# Apply migration
python manage.py migrate
```

## Environment Variables Checklist

### Required (Production)

- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `REDIS_URL` — Redis connection string
- [ ] `CELERY_BROKER_URL` — RabbitMQ AMQP URL
- [ ] `SECRET_KEY` — Django secret (min 50 chars, random)
- [ ] `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` — SMTP credentials
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — S3 credentials
- [ ] `ALLOWED_HOSTS` — Comma-separated domain list
- [ ] `DEBUG=False` — Disable debug mode in production

### OpenLDAP Integration (Shinhan SSO)

- [ ] `LDAP_SERVER_URI` — LDAP server URL (e.g., `ldap://openldap:389`)
- [ ] `LDAP_BIND_DN` — Admin DN (e.g., `cn=admin,dc=shinhan,dc=local`)
- [ ] `LDAP_BIND_PASSWORD` — Admin password
- [ ] `LDAP_BASE_DN` — Base DN (e.g., `dc=shinhan,dc=local`)
- [ ] `LDAP_USER_SEARCH_DN` — User search DN (e.g., `ou=users,dc=shinhan,dc=local`)

### Optional (Feature Flags)

- [ ] `NEXT_PUBLIC_ENABLE_WORKFLOWS` — Enable Shinhan workflows
- [ ] `NEXT_PUBLIC_ENABLE_TIME_TRACKING` — Enable time tracking
- [ ] `NEXT_PUBLIC_ENABLE_HO` — Enable org chart (HO)
- [ ] `NEXT_PUBLIC_LIVE_URL` — WebSocket server URL

### Pre-Push Hook Checks (Automated in CI/CD)

The repository includes automated pre-push checks that run before commits are accepted:

1. **Frontend Linting:** `pnpm check:lint`
   - ESLint, Prettier, TSLint checks on TypeScript/React code
2. **Backend Linting:** `ruff check apps/api/`
   - Python linting with Ruff
3. **Type Checking:** `mypy apps/api/`
   - Python static type validation

See `git-workflow-guide.md` for details.

### For Local Development

```bash
# Create .env files from templates
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/live/.env.example apps/live/.env
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`pnpm test`, `python run_tests.py`)
- [ ] Linting passes (`pnpm check:lint`)
- [ ] Types check passes (`pnpm check:types`)
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Docker images built and tested locally
- [ ] Secrets not committed to Git
- [ ] Branch coverage threshold met (>80%)

### Deployment Steps

1. **Build Docker Images**

   ```bash
   docker-compose build --no-cache
   ```

2. **Push to Registry (optional, for multi-server deployments)**

   ```bash
   docker tag plane-api:latest registry.example.com/plane-api:latest
   docker push registry.example.com/plane-api:latest
   ```

3. **Pull Latest Code**

   ```bash
   git pull origin develop
   git checkout preview
   ```

4. **Start Services**

   ```bash
   docker-compose up -d
   ```

5. **Run Migrations**

   ```bash
   docker-compose exec -T api python manage.py migrate
   ```

6. **Verify Health**

   ```bash
   # Check service health
   docker-compose ps

   # Test API
   curl http://localhost:8000/health

   # Test frontend
   curl http://localhost/
   ```

7. **Monitor Logs**

   ```bash
   docker-compose logs -f

   # Specific service
   docker-compose logs -f api
   docker-compose logs -f web
   ```

### Rollback Procedure

```bash
# Stop current deployment
docker-compose down

# Revert code
git checkout previous-commit-hash

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
docker-compose exec -T api python manage.py migrate
```

## Health Checks & Monitoring

### Health Endpoint (Backend)

```bash
# GET /health
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

**All services include HEALTHCHECK:**

```bash
# Check container health
docker inspect plane-api | jq '.[0].State.Health'

# Output
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [...]
}
```

### Logging & Monitoring

**Structured Logs (JSON):**

```bash
# View backend logs
docker-compose logs api | jq .

# Output
{
  "timestamp": "2026-04-02T10:00:00Z",
  "level": "INFO",
  "message": "Issue created",
  "request_id": "abc-123",
  "user_id": "user-123"
}
```

**Log Aggregation (Future):**

- Elasticsearch + Kibana for centralized logging
- Datadog/New Relic for APM

## Scaling Considerations

### Horizontal Scaling

**Multiple API Instances:**

```yaml
api:
  deploy:
    replicas: 3 # Run 3 instances


# Load balancer routes to all instances
```

**Multiple Celery Workers:**

```yaml
celery_worker:
  deploy:
    replicas: 5 # Run 5 workers
```

### Vertical Scaling

**Resource Limits (Docker):**

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 4G
      reservations:
        cpus: "1"
        memory: 2G
```

### Database Optimization

- Read replicas for read-heavy queries
- Connection pooling (PgBouncer)
- Query optimization (indexing)
- Archive old data (soft-delete policies)

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

**Last Updated:** 2026-04-08
**Version:** 1.1
