# Plane.so Backend & Deployment Architecture Scout

**Date**: 2026-02-13  
**Scope**: Django backend (apps/api), Proxy (apps/proxy), Deployments  
**Status**: Complete

---

## EXECUTIVE SUMMARY

Plane.so is a comprehensive project management platform with:
- **Backend**: Django 4.2 REST API with DRF, PostgreSQL + MongoDB
- **Message Queue**: RabbitMQ (AMQP) with Celery background tasks
- **Cache**: Redis/Valkey for caching and sessions
- **Storage**: MinIO (S3-compatible) for file uploads
- **Reverse Proxy**: Caddy 2.10 with dynamic DNS providers
- **Deployment**: Docker Compose, Docker Swarm, Kubernetes/Helm

---

## SECTION 1: APPS/API (DJANGO BACKEND)

### 1.1 Top-Level Structure

```
/Volumes/Data/SHBVN/plane.so/apps/api/
├── plane/                          # Main Django project
│   ├── __init__.py
│   ├── asgi.py                    # ASGI config (Channels/WebSocket)
│   ├── wsgi.py                    # WSGI config (Gunicorn entry)
│   ├── urls.py                    # Root URL configuration
│   ├── celery.py                  # Celery app configuration
│   ├── settings/                  # Django settings modules
│   ├── authentication/            # Auth system (OAuth, magic links, etc.)
│   ├── middleware/                # Custom middleware
│   ├── api/                        # DRF API v1 endpoints
│   ├── app/                        # Application-level APIs
│   ├── space/                      # Public/shared space APIs
│   ├── web/                        # Web utilities
│   ├── db/                         # Database models & migrations
│   ├── bgtasks/                    # Celery background jobs
│   ├── utils/                      # Shared utilities
│   ├── analytics/                  # Analytics module
│   ├── license/                    # License/instance management
│   ├── throttles/                  # Rate limiting
│   ├── tests/                      # Test suite
│   ├── seeds/                      # Database seeding
│   └── static/                     # Static assets
├── bin/                            # Docker entrypoint scripts
├── requirements.txt                # Main requirements
├── requirements/                   # Requirements variants
│   ├── base.txt                   # Core dependencies
│   ├── production.txt             # Production settings
│   ├── local.txt                  # Development settings
│   └── test.txt                   # Test settings
├── pyproject.toml                 # Project metadata
└── templates/                     # Email templates, admin HTML
```

### 1.2 Django Settings Location

**Files**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/settings/`

| File | Purpose |
|------|---------|
| `common.py` | Base settings (installed apps, middleware, REST framework config) |
| `production.py` | Production-specific overrides |
| `local.py` | Local development settings |
| `test.py` | Test configuration |
| `redis.py` | Redis connection utility |
| `mongo.py` | MongoDB connection settings |
| `storage.py` | S3/MinIO storage configuration |
| `openapi.py` | DRF Spectacular (OpenAPI/Swagger) config |

**Key Details**:
- Django 4.2.28 with DRF 3.15.2
- SESSION_ENGINE uses Redis via django-redis
- DEFAULT_PERMISSION_CLASSES = IsAuthenticated (most APIs require auth)
- AUTHENTICATION_BACKENDS uses Django's ModelBackend

### 1.3 URL Patterns & API Versioning

**Root Router**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/urls.py`

```python
urlpatterns = [
    path("api/", include("plane.app.urls")),           # App v0 APIs
    path("api/public/", include("plane.space.urls")),  # Public/shared APIs
    path("api/instances/", include("plane.license.urls")),  # License APIs
    path("api/v1/", include("plane.api.urls")),        # API v1 (new)
    path("auth/", include("plane.authentication.urls")), # Auth endpoints
    path("", include("plane.web.urls")),               # Web utilities
]

# OpenAPI/Swagger available at:
/api/schema/
/api/schema/swagger-ui/
/api/schema/redoc/
```

**API Modules** (`/plane/app/urls/`):
- `analytic.py` - Analytics
- `asset.py` - File assets
- `cycle.py` - Release cycles
- `estimate.py` - Issue estimates
- `external.py` - External integrations
- `intake.py` - Issue intake
- `issue.py` - Issues & comments
- `module.py` - Project modules
- `notification.py` - Notifications
- `page.py` - Project pages
- `project.py` - Projects
- `search.py` - Global search
- `state.py` - Issue states
- `user.py` - User management
- `views.py` - Issue views/filters
- `webhook.py` - Webhooks
- `workspace.py` - Workspaces
- `timezone.py` - Timezone utilities
- `exporter.py` - Export/import

**New API** (`/plane/api/urls/`):
- Similar modular structure with newer viewsets
- v1 endpoints at `/api/v1/*`

### 1.4 Key App Directories & Models

**Database Models** (`/plane/db/models/` - 31 model files):

| Model | Purpose |
|-------|---------|
| `user.py` | User, Account, Profile, BotTypeEnum |
| `workspace.py` | Workspace, WorkspaceMember, WorkspaceMemberInvite, WorkspaceTheme, WorkspaceUserProperties |
| `project.py` | Project, ProjectMember, ProjectMemberInvite, ProjectIdentifier, ProjectPublicMember, ProjectUserProperty |
| `issue.py` | Issue, IssueActivity, IssueAssignee, IssueComment, IssueLabel, IssueLink, IssueBlocker, IssueReaction, IssueRelation, IssueSubscriber, IssueVote, IssueVersion, IssueDescriptionVersion |
| `cycle.py` | Cycle, CycleIssue, CycleUserProperties |
| `module.py` | Module, ModuleIssue, ModuleLink, ModuleMember, ModuleUserProperties |
| `state.py` | State, StateGroup, DEFAULT_STATES |
| `page.py` | Page, ProjectPage, PageLabel, PageLog, PageVersion |
| `label.py` | Label (tags) |
| `estimate.py` | Estimate, EstimatePoint |
| `view.py` | IssueView (saved filters) |
| `asset.py` | FileAsset (uploaded files) |
| `intake.py` | Intake, IntakeIssue (intake board) |
| `notification.py` | Notification, EmailNotificationLog, UserNotificationPreference |
| `webhook.py` | Webhook, WebhookLog |
| `api.py` | APIToken, APIActivityLog |
| `exporter.py` | ExporterHistory |
| `importer.py` | Importer |
| `draft.py` | DraftIssue, DraftIssueAssignee, DraftIssueLabel, DraftIssueModule, DraftIssueCycle |
| `session.py` | Session (custom session model) |
| `device.py` | Device, DeviceSession (device tracking) |
| `favorite.py` | UserFavorite |
| `recent_visit.py` | UserRecentVisit |
| `sticky.py` | Sticky (sticky sidebar items) |
| `issue_type.py` | IssueType |
| `deploy_board.py` | DeployBoard |
| `description.py` | Description, DescriptionVersion |
| `analytic.py` | AnalyticView |
| `social_connection.py` | SocialLoginConnection |
| `integration.py` | Integration, WorkspaceIntegration, GithubRepository, GithubRepositorySync, GithubIssueSync, GithubCommentSync, SlackProjectSync |

**Database**: PostgreSQL 15.7 + MongoDB 4.6.3 (hybrid)

### 1.5 API Versioning Approach

- **Legacy API** (`/api/` and `/api/v0/`): Under `plane.app.*` - older endpoints
- **New API** (`/api/v1/`): Under `plane.api.*` - newer implementation with better structure
- **Public API** (`/api/public/`): Under `plane.space.*` - public/shared workspace views
- **Authentication**: Separate endpoints under `auth/` with OAuth support

### 1.6 Authentication Setup

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/`

**Structure**:
```
authentication/
├── urls.py                          # 14 endpoints
├── views/                           # View implementations
├── adapter/                         # OAuth adapters & exception handling
├── provider/                        # OAuth providers (Google, GitHub, GitLab, Gitea)
├── middleware/                      # Session middleware
├── utils/                           # Auth utilities
└── rate_limit.py                   # Auth-specific rate limiting
```

**Supported Auth Methods**:
1. **Session Authentication** (Django sessions via Redis)
2. **OAuth Providers**:
   - Google (`google/`, `google/callback/`)
   - GitHub (`github/`, `github/callback/`)
   - GitLab (`gitlab/`, `gitlab/callback/`)
   - Gitea (`gitea/`, `gitea/callback/`)
3. **Magic Links** (email-based):
   - `magic-generate/` - request magic link
   - `magic-sign-in/` / `magic-sign-up/`
4. **Password**:
   - `sign-in/` / `sign-up/` - username/password
   - `forgot-password/` - password reset
   - `reset-password/<uidb64>/<token>/` - reset link
   - `change-password/` - change existing password
5. **API Keys** (for API-based access)

**Exception Handler**: Custom `auth_exception_handler` at `/plane/authentication/adapter/exception.py`
- Returns 401 for NotAuthenticated
- Returns 429 for Throttled (rate limit)
- Custom error codes for auth failures

### 1.7 Celery/Background Tasks

**Configuration**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/celery.py`

**Task Scheduler**: Django Celery Beat with database scheduler
- Broker: RabbitMQ (AMQP)
- Backend: Redis
- DB Scheduler: Stores schedules in database

**Scheduled Tasks**:

| Task | Schedule | Purpose |
|------|----------|---------|
| `stack_email_notification` | Every 5 min | Send queued email notifications |
| `instance_traces` | Every 6 hours | Instance telemetry |
| `hard_delete` | Daily 00:00 UTC | Hard delete soft-deleted records |
| `archive_and_close_old_issues` | Daily 01:00 UTC | Auto-archive old issues |
| `delete_old_s3_link` | Daily 01:30 & 03:45 UTC | Clean up export links |
| `delete_unuploaded_file_asset` | Daily 02:00 UTC | Clean up unfinalized uploads |
| `delete_api_logs` | Daily 02:30 UTC | Archive API logs |
| `delete_email_notification_logs` | Daily 02:45 UTC | Archive email logs |
| `delete_page_versions` | Daily 03:00 UTC | Archive page versions |
| `delete_issue_description_versions` | Daily 03:15 UTC | Archive descriptions |
| `delete_webhook_logs` | Daily 03:30 UTC | Archive webhook logs |

**Task Modules** (`/plane/bgtasks/` - 36 files):
- `email_notification_task.py` - Email queueing
- `notification_task.py` - In-app notifications
- `issue_activities_task.py` - Issue activity logs
- `workspace_seed_task.py` - Workspace initialization
- `webhook_task.py` - Webhook dispatching
- `deletion_task.py` - Soft/hard delete workflows
- `export_task.py` - Issue/project export
- `import_task.py` - Data import handling
- `issue_automation_task.py` - Auto-close/archive
- `cleanup_task.py` - Log cleanup
- And 26 more...

**Entry Points**:
- `docker-entrypoint-worker.sh`: `celery -A plane worker -l info`
- `docker-entrypoint-beat.sh`: `celery -A plane beat -l info`

### 1.8 Key Middleware

**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/middleware/`

| Middleware | Purpose |
|------------|---------|
| `RequestLoggerMiddleware` | Log all requests (path, method, status, duration, user) to JSON logs |
| `APITokenLogMiddleware` | Log external API token requests to PostgreSQL/MongoDB |
| `RequestBodySizeLimitMiddleware` | Limit request body size |

**Global Middleware Stack** (settings/common.py):
1. CorsMiddleware - CORS headers
2. SecurityMiddleware - Security headers
3. WhiteNoiseMiddleware - Static file serving
4. SessionMiddleware - Session handling
5. CommonMiddleware - Common utilities
6. CsrfViewMiddleware - CSRF protection
7. AuthenticationMiddleware - Django auth
8. ClickJackingMiddleware - X-Frame-Options
9. CurrentRequestUserMiddleware (crum) - Thread-local user
10. GZipMiddleware - Response compression
11. RequestBodySizeLimitMiddleware - Size limiting
12. APITokenLogMiddleware - API token logging
13. RequestLoggerMiddleware - Request logging

---

## SECTION 2: APPS/PROXY (REVERSE PROXY)

### 2.1 Structure & Purpose

**Location**: `/Volumes/Data/SHBVN/plane.so/apps/proxy/`

**Purpose**: Reverse proxy frontend for routing requests to backend services

**Files**:
- `Caddyfile.ce` - Community Edition configuration
- `Caddyfile.aio.ce` - All-in-one deployment config
- `Dockerfile.ce` - Container image (Caddy 2.10)
- `.prettierignore` - Prettier config

### 2.2 Configuration (Caddyfile.ce)

**Base Image**: Caddy 2.10 with custom plugins:
- `caddy-dns/cloudflare` - CloudFlare DNS validation
- `caddy-dns/digitalocean` - DigitalOcean DNS validation
- `mholt/caddy-l4` - Layer 4 (TCP/UDP) routing

**Routing Rules** (in order):
```
/spaces/*          → space:3000        (public/shared spaces)
/god-mode/*        → admin:3000        (admin panel)
/live/*            → live:3000         (WebSocket/live updates)
/api/*             → api:8000          (REST API)
/auth/*            → api:8000          (Auth endpoints)
/static/*          → api:8000          (Static files)
/{BUCKET_NAME}/*   → plane-minio:9000  (S3 uploads)
/*                 → web:3000          (Frontend/SPA)
```

**Security Features**:
- Max request body size: `{FILE_SIZE_LIMIT}` (default 5MB)
- ACME/Let's Encrypt SSL support
- Trusted proxies configuration
- Max header size: 25MB
- Client IP detection from X-Forwarded-For / X-Real-IP

**Ports**:
- HTTP: 80 (configurable via LISTEN_HTTP_PORT)
- HTTPS: 443 (configurable via LISTEN_HTTPS_PORT)

---

## SECTION 3: DEPLOYMENTS

### 3.1 Deployment Methods

**Location**: `/Volumes/Data/SHBVN/plane.so/deployments/`

```
deployments/
├── aio/community/          # All-in-one containerized deployment
│   ├── Dockerfile         # Single container for all services
│   ├── supervisor.conf    # Supervisor process management
│   ├── build.sh          # Build script
│   ├── start.sh          # Startup script
│   └── README.md         # Documentation
├── cli/community/          # Docker Compose CLI deployment
│   ├── docker-compose.yml # Main orchestration
│   ├── build.yml         # Build configuration
│   ├── install.sh        # Installation script
│   └── README.md
├── swarm/community/        # Docker Swarm deployment
│   └── swarm.sh          # Orchestration script (20KB)
└── kubernetes/community/   # Kubernetes/Helm deployment
    └── README.md         # Points to Artifact Hub Helm chart
```

### 3.2 Docker Compose (CLI Deployment)

**File**: `/Volumes/Data/SHBVN/plane.so/deployments/cli/community/docker-compose.yml` (256 lines)

**Services**:

| Service | Image | Purpose | Replicas |
|---------|-------|---------|----------|
| **web** | plane-frontend | Next.js frontend | 1+ (WEB_REPLICAS) |
| **space** | plane-space | Public workspace view | 1+ (SPACE_REPLICAS) |
| **admin** | plane-admin | Admin panel | 1+ (ADMIN_REPLICAS) |
| **live** | plane-live | WebSocket/live updates | 1+ (LIVE_REPLICAS) |
| **api** | plane-backend | Django REST API | 1+ (API_REPLICAS) |
| **worker** | plane-backend | Celery worker (tasks) | 1+ (WORKER_REPLICAS) |
| **beat-worker** | plane-backend | Celery beat (scheduler) | 1+ (BEAT_WORKER_REPLICAS) |
| **migrator** | plane-backend | DB migrations | 1 (runs once) |
| **plane-db** | postgres:15.7-alpine | PostgreSQL database | 1 |
| **plane-redis** | valkey:7.2.11-alpine | Redis cache | 1 |
| **plane-mq** | rabbitmq:3.13.6-management | RabbitMQ message queue | 1 |
| **plane-minio** | minio/latest | S3-compatible storage | 1 |
| **proxy** | plane-proxy | Caddy reverse proxy | 1 |

**Environment Variable Groups**:
- `x-db-env` - PostgreSQL connection
- `x-redis-env` - Redis connection
- `x-minio-env` - MinIO credentials
- `x-aws-s3-env` - S3 bucket config
- `x-proxy-env` - Proxy/domain settings
- `x-mq-env` - RabbitMQ connection
- `x-live-env` - WebSocket server config
- `x-app-env` - Application settings

**Volumes**:
- `pgdata` - PostgreSQL data
- `redisdata` - Redis persistence
- `uploads` - MinIO storage
- `rabbitmq_data` - RabbitMQ queue data
- `logs_api`, `logs_worker`, `logs_beat-worker`, `logs_migrator` - Application logs
- `proxy_config`, `proxy_data` - Proxy configuration

**Dependencies**:
- API depends on: DB, Redis, RabbitMQ
- Worker depends on: API, DB, Redis, RabbitMQ
- Beat worker depends on: API, DB, Redis, RabbitMQ
- All frontends depend on: API, Worker
- Proxy depends on: all frontends + API

**Database**:
- PostgreSQL 15.7 with `max_connections=1000`
- Initial databases created via migrations

**Message Queue**:
- RabbitMQ 3.13.6 with management plugin
- Default credentials: plane:plane
- Default vhost: plane

**Cache & Session Store**:
- Valkey (Redis fork) 7.2.11
- Used for Django sessions, caching, Celery results

**Storage**:
- MinIO (S3-compatible) latest
- Default bucket: `uploads`
- Console at port 9090

### 3.3 All-in-One Deployment

**Files**: `deployments/aio/community/`

- **Dockerfile**: Single container with all services
- **supervisor.conf**: Process management (all services in one container)
- **build.sh**: Image build script
- **start.sh**: Container startup with initialization

### 3.4 Docker Swarm Deployment

**File**: `deployments/swarm/community/swarm.sh` (20KB bash script)

- Orchestration via Docker Swarm mode
- Service replication & load balancing
- Rolling updates support

### 3.5 Kubernetes/Helm Deployment

**Location**: `deployments/kubernetes/community/`

**Reference**: Artifact Hub Helm Chart
- Chart link provided in README
- Helm chart for cloud deployments (AWS EKS, GKE, AKS, etc.)
- Version 15+ of Kubernetes

---

## SECTION 4: KEY CONFIGURATION FILES

### 4.1 Django Settings Files

**Location**: `/plane/settings/`

| File | Size | Contains |
|------|------|----------|
| `common.py` | ~15KB | INSTALLED_APPS, MIDDLEWARE, REST_FRAMEWORK config, DATABASES, CACHES |
| `production.py` | ~3KB | Production overrides (DEBUG=False) |
| `local.py` | ~2.5KB | Dev overrides |
| `redis.py` | ~610B | Redis connection utility |
| `mongo.py` | ~4KB | MongoDB configuration |
| `storage.py` | ~7.7KB | S3/MinIO storage backends |
| `openapi.py` | ~13KB | DRF Spectacular (Swagger/ReDoc) |
| `test.py` | ~355B | Test settings |

### 4.2 Main Entry Points

| File | Purpose |
|------|---------|
| `plane/wsgi.py` | WSGI application for Gunicorn |
| `plane/asgi.py` | ASGI application for Uvicorn (WebSocket support via Channels) |
| `plane/urls.py` | Root URL router |
| `plane/celery.py` | Celery app with beat schedule |

### 4.3 Docker Entrypoints

**Location**: `/bin/`

| Script | Runs | Migrations | Purpose |
|--------|------|-----------|---------|
| `docker-entrypoint-api.sh` | Django + Gunicorn | Yes | API server (port 8000) |
| `docker-entrypoint-worker.sh` | Celery worker | Yes | Background task processor |
| `docker-entrypoint-beat.sh` | Celery beat | Yes | Scheduled task scheduler |
| `docker-entrypoint-migrator.sh` | Django migrate | Yes | Run migrations only |
| `docker-entrypoint-api-local.sh` | Django dev server | Yes | Local development |

**Common Startup Flow**:
1. `wait_for_db` - Wait for PostgreSQL
2. `wait_for_migrations` - Check if DB is migrated
3. `register_instance` - Register instance with machine signature
4. `configure_instance` - Load instance configuration
5. `create_bucket` - Create default S3 bucket
6. `clear_cache` - Flush Redis cache
7. `collectstatic` - Collect Django static files
8. Start service (Gunicorn/Celery)

---

## SECTION 5: DEPENDENCIES & TECH STACK

### 5.1 Core Python Dependencies

**File**: `/requirements/base.txt`

**Framework Stack**:
- Django 4.2.28 - Web framework
- djangorestframework 3.15.2 - REST API
- Channels 4.1.0 - WebSocket support
- Uvicorn 0.29.0 - ASGI server
- Gunicorn 23.0.0 - WSGI server
- drf-spectacular 0.28.0 - OpenAPI/Swagger

**Database**:
- psycopg 3.3.0 - PostgreSQL driver
- pymongo 4.6.3 - MongoDB driver
- dj-database-url 2.1.0 - Database URL parsing

**Async/Caching**:
- Celery 5.4.0 - Task queue
- django-celery-beat 2.6.0 - Periodic tasks
- django-celery-results 2.5.1 - Task result backend
- redis 5.0.4 - Redis client
- django-redis 5.4.0 - Redis cache backend

**Authentication/Security**:
- PyJWT 2.8.0 - JWT tokens
- cryptography 46.0.5 - Encryption
- zxcvbn 4.4.28 - Password strength validation

**Storage & Files**:
- boto3 1.34.96 - S3/AWS client
- django-storages 1.14.2 - Storage backends
- whitenoise 6.11.0 - Static file serving

**API & Integration**:
- slack-sdk 3.27.1 - Slack integration
- openai 1.63.2 - OpenAI/LLM integration
- requests (via dependencies) - HTTP client

**Data Processing**:
- openpyxl 3.1.2 - Excel generation
- beautifulsoup4 4.12.3 - HTML parsing
- lxml 6.0.0 - XML parsing

**Utilities**:
- django-filter 24.2 - Query filtering
- django-cors-headers 4.3.1 - CORS support
- django-crum 0.7.9 - Current request/user middleware
- faker 25.0.0 - Fake data generation
- jsonmodels 2.7.0 - JSON model validation
- pytz 2024.1 - Timezone handling

**Monitoring/Logging**:
- python-json-logger 3.3.0 - JSON logging
- scout-apm 3.1.0 - APM monitoring
- posthog 3.5.0 - Product analytics

**Observability**:
- opentelemetry-api 1.28.1 - Instrumentation API
- opentelemetry-sdk 1.28.1 - SDK
- opentelemetry-instrumentation-django 0.49b1 - Django instrumentation
- opentelemetry-exporter-otlp 1.28.1 - OTLP exporter

**HTML/Security**:
- nh3 0.2.18 - HTML sanitizer

---

## SECTION 6: DATABASE ARCHITECTURE

### 6.1 Dual Database Setup

**Primary**: PostgreSQL 15.7
- All model data (users, workspaces, projects, issues, etc.)
- 31 model files covering complete domain
- Migration system via Django ORM
- 120+ migration files in `/plane/db/migrations/`

**Secondary**: MongoDB 4.6.3
- API activity logs (for external API requests)
- Event tracking data
- Flexible schema for analytics
- Via `process_logs` Celery task

### 6.2 Migrations

**Location**: `/plane/db/migrations/` (~120 files)

**Entry Point**: Management command
```bash
python manage.py migrate              # Run all pending migrations
python manage.py makemigrations       # Create new migrations
python manage.py wait_for_migrations  # Health check
```

### 6.3 Permission System

**Files**: 
- `/plane/app/permissions/` - Role-based permissions
- `/plane/utils/permissions/` - Shared permission utilities

**Modules**:
- `base.py` - Base permission classes
- `workspace.py` - Workspace-level permissions
- `project.py` - Project-level permissions
- `page.py` - Page-level permissions

**Pattern**: Django REST framework permission classes
```python
class BasePermission(DjangoModelPermissions):
    # Role-based access control
    # Workspace member roles
    # Project member roles
```

---

## SECTION 7: API STRUCTURE

### 7.1 Versioning Strategy

**Two Parallel APIs**:
1. **Legacy `/api/` endpoints** (plane.app.*)
   - Older, more stable endpoints
   - Used by frontend
   - Still actively maintained

2. **New `/api/v1/` endpoints** (plane.api.*)
   - Refactored, cleaner structure
   - Better organized
   - Future primary API

### 7.2 Common Patterns

**ViewSets**: Based on DRF BaseViewSet
- Create, Retrieve, Update, Destroy (CRUD)
- Custom actions via @action decorator
- Filtering via django-filter
- Pagination via GlobalPaginator
- Permission checking per endpoint

**Serializers**: DRF ModelSerializer + custom logic
- Nested relationships
- Read-only vs write fields
- Validation
- Performance optimization (select_related, prefetch_related)

**URL Structure**:
```
/api/v1/workspaces/                    # List
/api/v1/workspaces/{id}/               # Detail
/api/v1/workspaces/{id}/projects/      # Nested
/api/v1/workspaces/{id}/members/       # Nested
```

### 7.3 Rate Limiting

**Configuration** (settings/common.py):
```python
DEFAULT_THROTTLE_RATES = {
    "anon": "30/minute",          # Anonymous users
    "asset_id": "5/minute",       # Asset upload
}
```

**Custom Rate Limiting**:
- `/plane/authentication/rate_limit.py` - Auth endpoints
- `/plane/api/rate_limit.py` - API endpoints
- Redis-backed throttling

---

## SECTION 8: MONITORING & LOGGING

### 8.1 Request Logging

**RequestLoggerMiddleware** logs:
- Method, path, status code
- Duration (ms)
- Client IP
- User agent
- User ID (if authenticated)
- Format: JSON with structured fields

**Storage**: File or external service (via python-json-logger)

### 8.2 API Token Logging

**APITokenLogMiddleware** logs external API requests:
- X-Api-Key header detection
- Request: headers, body, query params
- Response: status, body
- Client IP, user agent
- Stored in MongoDB + PostgreSQL

### 8.3 Background Task Logging

**Celery Logging**:
- JSON format via pythonjsonlogger
- Separate loggers for tasks
- Task name, result, exception tracking

---

## SECTION 9: KEY FEATURES BY DOMAIN

### 9.1 Workspace Management
- Multi-workspace support
- Workspace members with roles
- Workspace invitations
- Workspace customization (theme, preferences)
- Workspace-wide settings

### 9.2 Project Management
- Projects within workspaces
- Project members with roles
- Project identifier (key prefix for issues)
- Project settings & automation
- Public/private projects

### 9.3 Issue Management
- Issues with full lifecycle
- Issue types & custom fields
- Assignments & mentions
- Comments & reactions
- Issue links/blocking relationships
- Issue versioning & description history
- Draft issues (pre-publish)

### 9.4 Planning & Organization
- Release cycles
- Modules/sprints
- Issue states (To Do, In Progress, Done, etc.)
- Labels/tags
- Estimates & story points
- Issue views (saved filters)
- Favorites

### 9.5 Intake & Triage
- Intake board (external submissions)
- Issue conversion to backlog

### 9.6 Pages/Documentation
- Project pages (wiki-style)
- Page versioning
- Page labels

### 9.7 File Management
- File asset upload/download
- S3/MinIO integration
- File metadata tracking
- Cleanup of unfinalized uploads

### 9.8 Integrations
- GitHub repository sync
- GitHub issue sync
- GitHub comment sync
- Slack project sync
- Custom webhooks with delivery tracking

### 9.9 Analytics
- Issue analytics/charts
- Custom analytics views
- Analytics plot generation
- Export to charts

### 9.10 User Management
- User registration (OAuth + magic link + password)
- User invitations
- Profile management
- Device tracking
- Session management
- API tokens & activity logging

---

## SECTION 10: DEPLOYMENT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     Client/Browser                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/HTTPS (80/443)
                           │
        ┌──────────────────▼──────────────────┐
        │   Caddy Reverse Proxy (port 80/443) │
        │      (plane-proxy:9000)             │
        └──┬──────────┬──────────┬──────────┬─┘
           │          │          │          │
       ┌───▼──┐  ┌────▼────┐ ┌──▼───┐ ┌───▼──┐
       │Web   │  │Space    │ │Admin │ │Live  │
       │3000  │  │3000     │ │3000  │ │3000  │
       │      │  │         │ │      │ │      │
       └──────┘  └─────────┘ └──────┘ └──────┘
           │          │          │          │
           └──────────┴──────────┴──────────┘
                      │
              ┌───────▼────────┐
              │ API (port 8000) │
              │ Gunicorn        │
              │ Django REST     │
              └────┬────────┬───┘
                   │        │
        ┌──────────▼──┐  ┌──▼───────────┐
        │  PostgreSQL │  │    Redis     │
        │  (Port 5432)│  │  (Port 6379) │
        │  Databases  │  │  Cache/      │
        │  Users,     │  │  Sessions    │
        │  Workspaces,│  │              │
        │  Issues, etc│  │              │
        └─────────────┘  └──────────────┘
                │
        ┌───────▼──────────┐
        │   RabbitMQ       │
        │  (Port 5672)     │
        │  Message Broker  │
        └────┬──────┬──────┘
             │      │
        ┌────▼──┐ ┌─▼─────┐
        │Worker │ │Beat    │
        │Celery │ │Celery  │
        │Tasks  │ │Scheduler
        │       │ │        │
        └───────┘ └────────┘
                │
        ┌───────▼──────────┐
        │   MinIO (S3)     │
        │  (Port 9000)     │
        │  File Storage    │
        └──────────────────┘

Plus optional:
- MongoDB for API logs
- Scout APM for monitoring
- PostHog for product analytics
- OpenTelemetry for tracing
```

---

## SECTION 11: CRITICAL PATHS & ENTRY POINTS

### 11.1 Request Flow

```
1. Browser/Client Request
   ↓
2. Caddy Proxy (routing logic)
   ↓
3. Django/WSGI Handler
   ├─ Middleware pipeline
   ├─ Authentication
   ├─ Permission checks
   ├─ ViewSet/View dispatch
   ├─ Database queries (PostgreSQL)
   └─ Serialization (JSON)
   ↓
4. Response to Client
```

### 11.2 Async/Background Job Flow

```
1. API receives request
   ↓
2. Enqueues Celery task
   ↓
3. Task sent to RabbitMQ
   ↓
4. Worker picks up from queue
   ├─ Database operations
   ├─ External API calls
   ├─ File operations
   └─ Notifications
   ↓
5. Result stored in Redis
   ↓
6. Client polls or websocket receives update
```

### 11.3 Real-Time Updates

```
1. WebSocket connection (Channels/ASGI)
   ↓
2. Server broadcasts events
   ├─ Issue updates
   ├─ Comment additions
   ├─ Member activity
   └─ Notifications
   ↓
3. Redis pub/sub for scalability
   ↓
4. Connected clients receive updates
```

---

## SECTION 12: SCALABILITY & PERFORMANCE

### 12.1 Horizontal Scaling

**Stateless Components** (scale via replicas):
- API servers (WEB_REPLICAS, API_REPLICAS)
- Celery workers (WORKER_REPLICAS)
- Frontend (SPACE_REPLICAS, ADMIN_REPLICAS)
- Live servers (LIVE_REPLICAS)

**Configuration via Compose**:
```yaml
services:
  api:
    deploy:
      replicas: ${API_REPLICAS:-1}
```

### 12.2 Performance Features

**Caching**:
- Redis for session store
- Django cache framework
- Query result caching

**Database**:
- PostgreSQL with `max_connections=1000`
- Connection pooling
- Index optimization

**Async Processing**:
- Celery for long-running tasks
- Beat scheduler for periodic cleanup
- Background notifications

**API Optimization**:
- Pagination (default 20 items per page)
- Filtering & search
- select_related/prefetch_related in ORM
- Gzip compression middleware

### 12.3 Resource Management

**Cleanup Jobs** (scheduled):
- Delete API logs (daily 02:30)
- Delete email logs (daily 02:45)
- Delete page versions (daily 03:00)
- Delete issue description versions (daily 03:15)
- Delete webhook logs (daily 03:30)
- Hard delete soft-deleted records (daily 00:00)
- Archive old issues (daily 01:00)

---

## SECTION 13: SECURITY CONSIDERATIONS

### 13.1 Authentication

- **OAuth**: Multi-provider (Google, GitHub, GitLab, Gitea)
- **Magic Links**: Email-based passwordless auth
- **Password**: Validated with zxcvbn
- **API Keys**: For programmatic access
- **Session**: Redis-backed, secure cookies

### 13.2 Authorization

- **Role-Based Access Control** (RBAC)
- **Workspace roles**: Owner, Admin, Member, Guest
- **Project roles**: Owner, Admin, Member
- **Permission classes**: Per-endpoint authorization
- **Resource-level checks**: User can only access their workspace

### 13.3 Data Security

- **CORS**: Configurable allowed origins
- **CSRF**: Django CSRF middleware
- **Security Headers**: SecurityMiddleware
- **X-Frame-Options**: Clickjacking protection
- **Request body limits**: Max 5MB
- **API logging**: Request/response logging with PII handling
- **HTML sanitization**: nh3 library for user content

### 13.4 Network Security

- **HTTPS/TLS**: Via Caddy (Let's Encrypt)
- **Trusted proxies**: Configurable X-Forwarded-For validation
- **Rate limiting**: Per-user/IP throttling
- **Client IP detection**: From headers (CloudFlare, DigitalOcean)

---

## SECTION 14: FILE ORGANIZATION SUMMARY

```
apps/api/
├── plane/                     # Main Django package
│   ├── __init__.py
│   ├── asgi.py               # ASGI app
│   ├── wsgi.py               # WSGI app
│   ├── urls.py               # Root URLs
│   ├── celery.py             # Celery config
│   ├── settings/             # Settings modules
│   ├── middleware/           # Global middleware
│   ├── authentication/       # Auth system
│   ├── app/                  # Legacy API v0
│   │   ├── urls/            # URL modules
│   │   ├── views/           # View functions
│   │   ├── serializers/     # DRF serializers
│   │   ├── permissions/     # Permission classes
│   │   └── middleware/      # App-level middleware
│   ├── api/                  # New API v1
│   │   ├── urls/            # API v1 URLs
│   │   ├── views/           # API v1 views
│   │   ├── serializers/     # API v1 serializers
│   │   └── middleware/      # API middleware
│   ├── space/                # Public API
│   ├── db/                   # Database
│   │   ├── models/          # 31 model files
│   │   ├── migrations/      # 120+ migrations
│   │   └── management/      # Management commands
│   ├── bgtasks/              # 36 Celery tasks
│   ├── utils/                # Utilities
│   │   ├── permissions/     # Permission utilities
│   │   ├── filters/         # Query filters
│   │   ├── exporters/       # Data export
│   │   └── ...
│   ├── analytics/            # Analytics module
│   ├── license/              # License/instance mgmt
│   ├── tests/                # Test suite
│   └── static/               # Static assets
├── bin/                       # Docker entrypoints
├── requirements/             # Dependency specs
└── pyproject.toml           # Project metadata

apps/proxy/
├── Caddyfile.ce             # Caddy config
├── Dockerfile.ce            # Proxy image
└── ...

deployments/
├── aio/community/           # All-in-one
├── cli/community/           # Docker Compose
│   └── docker-compose.yml
├── swarm/community/         # Docker Swarm
└── kubernetes/community/    # Kubernetes/Helm
```

---

## SECTION 15: KEY STATISTICS

| Metric | Value |
|--------|-------|
| Django Apps (INSTALLED_APPS) | 16 |
| Database Models | 31 (in plane.db.models) |
| Django Migrations | 120+ |
| Celery Background Tasks | 36+ |
| API Modules (v0) | 18 URL modules |
| API Modules (v1) | ~23 URL modules |
| Middleware (Global) | 13 |
| Dependencies (Core) | 50+ Python packages |
| Docker Compose Services | 13 |
| Deployment Methods | 4 (AIO, Compose, Swarm, K8s) |
| Supported OAuth Providers | 4 (Google, GitHub, GitLab, Gitea) |

---

## RESOLUTION SUMMARY

### Clear Findings
✓ Hybrid PostgreSQL + MongoDB architecture
✓ Celery-based async task processing with RabbitMQ
✓ Dual API versioning strategy (legacy + v1)
✓ Stateless application design for horizontal scaling
✓ Multi-deployment support (container orchestration)
✓ Comprehensive permission/role system
✓ Real-time capabilities via Channels/WebSocket
✓ Full OAuth & magic link auth support
✓ S3-compatible file storage via MinIO

### Deployment Flexibility
- Docker Compose for self-hosted
- All-in-one container for simple deployments
- Docker Swarm for cluster deployments
- Kubernetes/Helm for cloud-native deployments

### Technology Stack Rationale
- Django/DRF: Mature, feature-rich web framework
- PostgreSQL: ACID compliance, complex queries
- MongoDB: Flexible schema for logs/analytics
- Celery: Scalable async task processing
- RabbitMQ: Reliable message broker
- Redis: Fast caching & session store
- Caddy: Modern, auto-HTTPS reverse proxy
- MinIO: S3 compatibility without AWS lock-in

---

**Report Generated**: 2026-02-13
**Scout**: Explore Agent  
**Status**: Complete - Ready for documentation
