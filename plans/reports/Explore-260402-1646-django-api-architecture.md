# Django Backend Architecture Exploration Report

**Date:** 2026-04-02 | **Project:** Plane | **Location:** /apps/api/

---

## 1. Project Structure Overview

```
apps/api/plane/
├── db/                          # Data layer (models only, no business logic)
│   ├── models/                  # 37 core entity models
│   ├── migrations/              # ~171 schema migrations
│   ├── signals/                 # Model signal handlers
│   ├── management/              # Custom Django management commands
│   └── mixins.py                # AuditModel, SoftDeletionManager, ChangeTrackerMixin
│
├── app/                         # Internal API v0 (session auth, frontend-facing)
│   ├── views/                   # ~31 ViewSet/APIView modules
│   ├── serializers/             # ~32 app-specific serializers
│   ├── urls/                    # ~27 URL route modules (modular routing)
│   ├── permissions/             # Role-based access control (ROLE enum, @allow_permission)
│   └── middleware/              # API authentication middleware
│
├── api/                         # External API v1 (API key auth, public-facing)
│   ├── views/                   # ~16 external-only viewsets
│   ├── serializers/             # ~17 separate serializer set
│   ├── urls/                    # External API routes
│   ├── middleware/              # API key authentication
│   └── rate_limit.py            # ApiKeyRateThrottle, ServiceTokenRateThrottle
│
├── bgtasks/                     # Celery task modules (41 task files)
│   ├── issue_activities_task.py
│   ├── email_notification_task.py
│   ├── export_task.py
│   ├── webhook_task.py
│   ├── cleanup_task.py          # Hard deletes, version cleanup
│   └── [36+ other async tasks]
│
├── authentication/              # Auth layer
│   ├── adapter/                 # DRF exception handlers
│   ├── provider/                # OAuth/social login providers
│   ├── middleware/              # Session auth, API token logging
│   ├── session.py               # Custom session authentication
│   └── urls.py                  # Auth endpoints
│
├── utils/                       # Shared utilities (45+ modules)
│   ├── cache.py                 # Redis caching
│   ├── email.py                 # Email sending
│   ├── issue_filters.py         # Issue query filters
│   ├── issue_search.py          # Full-text search logic
│   ├── exception_logger.py      # Centralized error logging
│   ├── analytics_events.py      # Event tracking
│   ├── exporters/               # CSV/JSON export utilities
│   ├── porters/                 # Importer/exporter adapters
│   ├── openapi/                 # OpenAPI schema generation
│   └── [40+ other utilities]
│
├── middleware/                  # Global request middleware
│   ├── logger.py                # Request/response logging to Celery
│   ├── request_body_size.py    # Request payload size limits
│   └── db_routing.py            # Database read replica routing
│
├── settings/                    # Django settings management
│   ├── common.py                # Base config (DRF, CORS, Auth, Celery, Redis)
│   ├── production.py            # Production overrides
│   ├── local.py                 # Development config
│   ├── test.py                  # Test config
│   ├── redis.py                 # Redis configuration
│   ├── mongo.py                 # MongoDB configuration
│   ├── storage.py               # S3/storage backend config
│   └── openapi.py               # DRF Spectacular config
│
├── license/                     # Instance admin / God Mode
├── space/                       # Public API (workspace invites, etc.)
├── analytics/                   # Analytics data pipeline
├── web/                         # Frontend static file serving
├── seeds/                       # Database seeders
└── celery.py                    # Celery app configuration + beat schedule
```

---

## 2. Major Apps/Modules & Purpose

| Module             | Purpose                                           | Key Files                          |
| ------------------ | ------------------------------------------------- | ---------------------------------- |
| **db**             | ORM models, no business logic                     | models/\*.py (37 entity types)     |
| **app** (v0)       | Internal APIs for Plane's web frontend            | views/_, serializers/_, urls/\*    |
| **api** (v1)       | External APIs for third-party integrations        | views/_, serializers/_, urls/\*    |
| **bgtasks**        | Async Celery tasks (email, exports, webhooks)     | 41 task modules                    |
| **authentication** | Session auth, OAuth, JWT, API keys                | session.py, provider/_, adapter/_  |
| **license**        | Instance-level admin APIs (God Mode)              | Instance admin permissions         |
| **space**          | Public workspace APIs (read-only, guest access)   | Workspace invites, public pages    |
| **analytics**      | Event tracking & analytics pipeline               | Event queue, analytics aggregation |
| **utils**          | Shared helpers (caching, search, export, logging) | 45+ utility modules                |

---

## 3. Database Models Overview (37 Core Entities)

### Core Domain Models

- **Workspace**: Multi-tenant workspace, top-level container
- **Project**: Project within workspace; has members, modules, cycles
- **Issue**: Main work item; tracks description versions, activity log
- **IssueActivity**: Audit log for issue changes (priority, assignee, state, etc.)
- **Module**: Project sprint/iteration container
- **Cycle**: Release/sprint cycle management
- **State**: Issue state (Todo, In Progress, Done, etc.)
- **Label**: Issue tags/labels
- **Page**: Project documentation pages with versions
- **Notification**: User notifications (email + in-app)

### Supporting Models

- **User/Profile**: Auth user + extended profile
- **WorkspaceMember**: User membership + role (Admin/Member/Guest)
- **ProjectMember**: Project membership with role scoping
- **IssueAssignee**: M2M between Issue & User (soft-deletes)
- **IssueSubscriber**: Issue watchers
- **FileAsset**: S3 file attachments
- **Webhook**: Event webhooks + logs
- **APIToken**: API keys for v1 external API
- **Estimate/EstimatePoint**: Story point schemes
- **Department/Staff**: Organizational hierarchy (Shinhan custom)
- **Worklog/WorkItem**: Time tracking (Shinhan custom)
- **Intake**: Issue triage queue
- **Draft**: Draft issues (unpublished)
- **Exporter/Importer**: Data import/export history

### Model Features

- **Base Hierarchy**: `BaseModel` → `ProjectBaseModel` / `WorkspaceBaseModel`
- **Soft Deletes**: `SoftDeletionManager` (excludes deleted items from queries by default)
- **Audit Trail**: `AuditModel` (created_by, updated_by, created_at, updated_at)
- **Custom Managers**: `IssueManager` filters by state group, excludes drafts & archived
- **Change Tracking**: `ChangeTrackerMixin` captures diffs for activity logs

---

## 4. API Patterns & Design

### Two-Layer Architecture (CRITICAL)

#### `plane.app.*` (Internal/v0)

- **Auth**: Django session cookies
- **Target**: Plane's own web frontend (apps/web)
- **OpenAPI**: NO (`@extend_schema` NOT used)
- **Throttle**: Default anon throttle (30 req/min)
- **Base**: `BaseViewSet` / `BaseAPIView`
- **Example**: Dashboard, notifications, user settings

#### `plane.api.*` (External/v1)

- **Auth**: API Key (X-Api-Key header) or OAuth
- **Target**: Third-party integrations, webhooks
- **OpenAPI**: YES (all endpoints have `@extend_schema`)
- **Throttle**: ApiKeyRateThrottle / ServiceTokenRateThrottle
- **Base**: `plane.api.views.BaseAPIView` (different from app version)
- **Example**: Issue CRUD, project settings for integrations

### Permission Model

- **Decorator**: `@allow_permission(allowed_roles=[ROLE.ADMIN, ...], level="PROJECT")`
- **Levels**: `"PROJECT"` | `"WORKSPACE"`
- **Roles**: `ROLE.ADMIN` (20), `ROLE.MEMBER` (15), `ROLE.GUEST` (5)
- **Special**: creator=True, assignee=True, workspace_admin overrides project role
- **Location**: `plane.app.permissions.base`

### ViewSet Patterns

```python
class IssueViewSet(BaseViewSet):
    model = Issue
    serializer_class = IssueDetailedSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["state__slug", "priority", "assignees__id"]
    search_fields = ["name", "issue_link__web_url"]

    @allow_permission([ROLE.MEMBER], level="PROJECT")
    def create(self, request, *args, **kwargs):
        # Create issue, trigger activity task
        issue_activity.delay(...)
        return response
```

### Serializers

- **Separation**: App & API have independent serializer sets (never shared)
- **Pattern**: List vs Detail serializers (ListSerializer, DetailedSerializer)
- **Nested**: Use `SerializerMethodField` or `nested=True` for related objects
- **Example**: `IssueSerializer` (v0 app) vs `IssueDetailedSerializer` (v1 api)

---

## 5. Key Integrations

### Celery + RabbitMQ

- **Broker**: RabbitMQ (default) or AMQP
- **Beat Schedule**: 10 scheduled tasks (emails, hard deletes, archival, cleanup)
- **Autodiscover**: `app.autodiscover_tasks()` loads all `plane.bgtasks.*`
- **Task Format**: `@shared_task` with JSON serialization
- **Notable Tasks**:
  - `email_notification_task.stack_email_notification()` - every 5min
  - `issue_activities_task.issue_activity_update()` - triggered on issue change
  - `hard_delete()` - daily at 00:00 UTC
  - `archive_and_close_old_issues()` - daily at 01:00 UTC

### Redis (Valkey-compatible)

- **Config**: `REDIS_URL` env var (supports SSL: rediss://)
- **Uses**:
  - Cache backend (cache framework)
  - Session store
  - Rate throttling
  - WebSocket channel layer (likely)
- **Code**: `plane.settings.redis.redis_instance()`

### AWS S3 (Storage)

- **Config**: `plane.settings.storage`
- **Uses**: File assets, export downloads, backups
- **Task**: `copy_s3_object.py`, `exporter_expired_task.py` (cleanup old exports)

### DRF Spectacular (OpenAPI)

- **Config**: `ENABLE_DRF_SPECTACULAR` flag
- **Endpoints**: `/api/schema/`, `/api/schema/swagger-ui/`, `/api/schema/redoc/`
- **Usage**: API v1 (api/\*) uses `@extend_schema` decorators
- **Ignored**: API v0 (app/\*) does NOT document externally

### Middleware Stack

1. **CorsMiddleware** - Handle cross-origin requests
2. **SecurityMiddleware** + **WhiteNoiseMiddleware** - Static file serving
3. **SessionMiddleware** (custom Plane version)
4. **CsrfViewMiddleware** - CSRF protection
5. **AuthenticationMiddleware** - Django auth
6. **RequestBodySizeLimitMiddleware** - Payload size limits
7. **APITokenLogMiddleware** - Log API key usage (async to Celery)
8. **RequestLoggerMiddleware** - Log all requests (async to Celery)
9. **GZipMiddleware** - Response compression
10. **ReadReplicaControlMixin** - Route reads to replica DB if available

---

## 6. Custom Utilities & Middleware

### Exception Handling

- **Centralized Logger**: `plane.utils.exception_logger.log_exception(e)`
- **Custom Handler**: `plane.authentication.adapter.exception.auth_exception_handler`
- **Logging**: JSON-formatted logs via pythonjsonlogger

### Filtering & Search

- **Issue Filters**: `plane.utils.issue_filters` - Complex filter builder
- **Issue Search**: `plane.utils.issue_search` - Full-text search queries
- **Dynamic Filters**: Query params → FilterBackend chain

### Caching Strategy

- **Cache Layer**: Redis with key prefixes
- **Cache Functions**: `plane.utils.cache` - Decorator-based cache invalidation
- **TTL**: Custom per endpoint

### Activity Tracking (Audit Trail)

- **Trigger**: Post-update, fire `issue_activity.delay(issue_id, user_id, type, ...)`
- **Storage**: `IssueActivity` model captures before/after state
- **Task**: `plane.bgtasks.issue_activities_task.issue_activity_update()`

### Email & Notifications

- **Task**: `email_notification_task.stack_email_notification()` - batches 5min
- **Provider**: Django mail backend (SMTP/SES configurable)
- **Template**: HTML templates for issue updates, invites, etc.

### Export/Import

- **Exporters**: CSV, JSON, Markdown (in `plane.utils.exporters/`)
- **Importers**: Jira, GitHub, Linear (in `plane.utils.porters/`)
- **S3 Upload**: Temporary signed URLs for large exports

### Request/Response Logging

- **Middleware**: Captures method, path, status, duration, user_id, IP
- **Async**: Logs sent to Celery task for DB storage
- **Retention**: `cleanup_task.delete_api_logs()` daily at 02:30 UTC

### Read Replica Support

- **Mixin**: `ReadReplicaControlMixin` in base views
- **Flag**: `use_read_replica = True` per viewset
- **Router**: `plane.middleware.db_routing` routes via query parameter

---

## 7. Authentication & Authorization

### Session Auth (v0 Internal API)

- **Middleware**: `plane.authentication.middleware.session.SessionMiddleware`
- **Class**: `BaseSessionAuthentication`
- **Mechanism**: Django session cookies + `crum.CurrentRequestUserMiddleware`
- **User Access**: `request.user` always available

### API Key Auth (v1 External API)

- **Header**: `X-Api-Key: <token>`
- **Middleware**: `plane.api.middleware.api_authentication.APIKeyAuthentication`
- **Model**: `APIToken(token, user, workspace, is_active, is_service, ...)`
- **Lookup**: Validates token format & expiry

### OAuth/Social Login

- **Provider**: `plane.authentication.provider` directory
- **Adapters**: Google, GitHub, Microsoft OAuth flows
- **Callback**: Returns JWT or session token

### Rate Limiting

- **v0**: Default anon throttle (30 req/min)
- **v1**:
  - `ApiKeyRateThrottle` - 1000 req/hour per API key
  - `ServiceTokenRateThrottle` - Higher limits for service tokens
- **Config**: `plane.api.rate_limit`

---

## 8. Key Architectural Insights

### Modular URL Routing

- **Pattern**: Each feature has own `urls/<feature>.py`
- **Aggregation**: `urls/__init__.py` imports all and combines into single urlpatterns
- **Benefits**: Scalable, avoids circular imports

### Timezone Handling

- **Mixin**: `TimezoneMixin` activates `request.user.user_timezone` for each request
- **Deactivation**: Auto-deactivates for unauthenticated requests
- **Database**: Stores times in UTC, converts on output

### Lazy Query Execution

- **Prefetch**: Heavy use of `prefetch_related()` for M2M & reverse relations
- **Select**: `select_related()` for ForeignKey optimization
- **Pagination**: `BasePaginator` with cursor & limit-offset support

### Signal Handlers

- **Location**: `plane.db.signals/`
- **Use**: Post-save hooks for secondary model creation, cache invalidation
- **Example**: Create workspace members on workspace creation

### Middleware Exception Handling

- **Dispatch Override**: BaseViewSet/BaseAPIView override `dispatch()` to catch exceptions
- **Response Mapping**: IntegrityError → 400, ValidationError → 400, ObjectDoesNotExist → 404
- **Logging**: All exceptions logged via `log_exception()`

### Custom Management Commands

- **Location**: `plane/db/management/commands/`
- **Use**: Data seeding, migrations, bulk operations
- **Example**: Seed workspace, populate default states

---

## 9. Settings & Configuration

### Environment Variables (Loaded in common.py)

| Var                      | Purpose                 | Example                                        |
| ------------------------ | ----------------------- | ---------------------------------------------- |
| `SECRET_KEY`             | Django secret           | (auto-generated if missing)                    |
| `DEBUG`                  | Dev mode                | 0/1                                            |
| `ALLOWED_HOSTS`          | CORS allowlist          | localhost,example.com                          |
| `REDIS_URL`              | Redis/Valkey connection | redis://localhost:6379 or rediss://...         |
| `RABBITMQ_*`             | RabbitMQ broker         | RABBITMQ_HOST, RABBITMQ_PORT, etc.             |
| `DATABASE_URL`           | PostgreSQL connection   | postgres://...                                 |
| `ENABLE_DRF_SPECTACULAR` | OpenAPI docs            | true/false                                     |
| `AWS_S3_*`               | S3 storage              | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc. |

### Installed Apps

- **Django**: auth, contenttypes, sessions, staticfiles
- **Plane**: analytics, app, space, bgtasks, db, utils, web, middleware, license, api, authentication
- **Third-party**: rest_framework, corsheaders, django_celery_beat, drf_spectacular

---

## 10. Data Flow Examples

### Issue Create Flow (v0 Internal API)

1. POST `/api/workspaces/<slug>/projects/<id>/issues/`
2. `IssueViewSet.create()` deserializes with `IssueSerializer`
3. Save to DB → auto-set created_by via `BaseModel.save()`
4. Fire async task: `issue_activity.delay(issue_id=...)`
5. Celery task creates `IssueActivity` record + notification
6. Respond with 201 + serialized issue

### Issue Update + Webhook Flow

1. PATCH `/api/workspaces/<slug>/projects/<id>/issues/<pk>/`
2. Capture current state: `current_instance = Issue.objects.get(pk=pk)`
3. Deserialize & update
4. Fire activity task with before/after diffs
5. Fire webhook task: `webhook_task.delay(workspace_id, event_type, payload)`
6. Celery sends webhook to registered endpoints

### Background Task: Email Notification (every 5 minutes)

1. Beat scheduler triggers `stack_email_notification()`
2. Query `EmailNotificationLog` → group by user
3. Render HTML templates for 5-min window of changes
4. Send via SMTP/SES
5. Mark logs as sent

---

## Unresolved Questions

1. **MongoDB integration**: `plane.settings.mongo` exists but unclear if actively used (PostgreSQL is primary)
2. **Analytics pipeline**: `plane.analytics` module structure & real-time vs batch processing
3. **WebSocket support**: Read replica middleware suggests real-time, but no explicit ws config found
4. **Backward compatibility**: No explicit versioning strategy found between API versions
5. **Rate limit storage**: Redis likely, but explicit configuration not visible in common.py scan

---

**End of Report**
