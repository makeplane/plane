# Phase 1: Backend API Endpoints

## Context Links

- [Plan Overview](./plan.md)
- [God Mode Patterns Research](./research/researcher-01-godmode-patterns.md)
- [Backend Infrastructure Research](./research/researcher-02-backend-infrastructure.md)
- Base view: `apps/api/plane/license/api/views/base.py`
- License URLs: `apps/api/plane/license/urls.py`
- EmailNotificationLog: `apps/api/plane/db/models/notification.py` (line 122)

## Overview

- **Priority:** P2
- **Status:** complete
- **Effort:** 2.5h
- **Description:** 3 read-only API endpoints under `/api/instances/monitoring/` for email logs, scheduled jobs, and worker health.

## Key Insights

- `BaseAPIView` already includes `BasePaginator` with `self.paginate()` method
- `InstanceAdminPermission` checks `role >= 15` — set as `permission_classes`
- `@cache_response(timeout, user=False)` available for read-only endpoints
- `PeriodicTask` from `django_celery_beat.models` is already installed
- Celery Inspect API via `plane.celery.app.control.inspect()` — may timeout if no workers running; must handle gracefully
- Email logs use `BaseModel` inheritance (has `id`, `created_at`, `updated_at`)

## Requirements

### Functional

- GET `/api/instances/monitoring/email-logs/` — paginated (50/page), filterable by date range + entity_name. Tracks issue notification emails only (from email_notification_task.py), not all emails.
<!-- Updated: Validation Session 1 - Clarified email logs scope: issue notifications only -->
- GET `/api/instances/monitoring/scheduled-jobs/` — list all PeriodicTask records
- GET `/api/instances/monitoring/worker-health/` — live Celery worker stats via Inspect API

### Non-Functional

- Admin-only access (InstanceAdminPermission)
- Cache worker-health for 30s to avoid hammering workers
- Graceful fallback when no Celery workers are reachable
- No new package dependencies

## Architecture

```
plane/license/api/
  views/
    monitoring.py          <- 3 view classes (NEW)
  serializers/
    monitoring.py          <- 2 serializers (NEW)

plane/license/urls.py      <- add 3 URL patterns (MODIFY)
plane/license/api/views/__init__.py  <- export new views (MODIFY)
```

### Endpoint Specifications

#### 1. Email Logs — `EmailLogMonitoringEndpoint`

```
GET /api/instances/monitoring/email-logs/
Query params:
  - cursor (pagination)
  - per_page (default 50, max 100)
  - date_from (ISO date, filter created_at__gte)
  - date_to (ISO date, filter created_at__lte)
  - entity_name (exact match filter)

Response: paginated list via self.paginate()
  results[]: { id, receiver_email, triggered_by_email, entity_name,
               entity, created_at, processed_at, sent_at }
```

#### 2. Scheduled Jobs — `ScheduledJobMonitoringEndpoint`

```
GET /api/instances/monitoring/scheduled-jobs/

Response: { results: [...] }
  results[]: { id, name, task, schedule_display, enabled,
               last_run_at, total_run_count }

schedule_display: human-readable string built from crontab/interval FK
```

#### 3. Worker Health — `WorkerHealthMonitoringEndpoint`

```
GET /api/instances/monitoring/worker-health/

Response: { workers: [...], summary: {...} }
  workers[]: { name, active_tasks, uptime, pool_info }
  summary: { total_workers, total_active_tasks }

Cache: 30s via @cache_response
Fallback: { workers: [], summary: { total_workers: 0, ... }, error: "..." }
```

## Related Code Files

### Files to Create

| File                                                   | Purpose                               |
| ------------------------------------------------------ | ------------------------------------- |
| `apps/api/plane/license/api/views/monitoring.py`       | 3 view classes                        |
| `apps/api/plane/license/api/serializers/monitoring.py` | Email log + scheduled job serializers |

### Files to Modify

| File                                                 | Change                        |
| ---------------------------------------------------- | ----------------------------- |
| `apps/api/plane/license/urls.py`                     | Add 3 monitoring URL patterns |
| `apps/api/plane/license/api/views/__init__.py`       | Export monitoring views       |
| `apps/api/plane/license/api/serializers/__init__.py` | Export monitoring serializers |

## Implementation Steps

### Step 1: Create serializers (`serializers/monitoring.py`)

```python
# EmailNotificationLogSerializer
class Meta:
    model = EmailNotificationLog
    fields = ["id", "entity_name", "entity", "created_at", "processed_at", "sent_at"]

# Add receiver_email + triggered_by_email as SerializerMethodField
# Use select_related("receiver", "triggered_by") in view queryset
```

```python
# ScheduledJobSerializer — plain Serializer (not ModelSerializer)
# because PeriodicTask is third-party model
# Fields: id, name, task, schedule_display, enabled, last_run_at, total_run_count
# Build schedule_display from crontab or interval FK
```

### Step 2: Create views (`views/monitoring.py`)

```python
class EmailLogMonitoringEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        queryset = EmailNotificationLog.objects.select_related(
            "receiver", "triggered_by"
        ).order_by("-created_at")

        # Apply filters from query params
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        entity_name = request.query_params.get("entity_name")

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if entity_name:
            queryset = queryset.filter(entity_name=entity_name)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda r: EmailNotificationLogSerializer(r, many=True).data,
            default_per_page=50,
            max_per_page=100,
        )
```

```python
class ScheduledJobMonitoringEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        tasks = PeriodicTask.objects.select_related(
            "crontab", "interval"
        ).order_by("name")
        # Build response manually — serialize each task
        # schedule_display logic:
        #   if task.crontab: f"{task.crontab}"
        #   elif task.interval: f"every {task.interval.every} {task.interval.period}"
        return Response(results, status=200)
```

```python
class WorkerHealthMonitoringEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    @cache_response(30, user=False)
    def get(self, request):
        try:
            inspector = app.control.inspect(timeout=3.0)
            active = inspector.active() or {}
            stats = inspector.stats() or {}
        except Exception:
            return Response({
                "workers": [],
                "summary": {"total_workers": 0, "total_active_tasks": 0},
                "error": "Could not reach Celery workers"
            })

        # Build worker list from active + stats dicts
        # Keys are worker names like "celery@hostname"
        return Response({"workers": [...], "summary": {...}})
```

### Step 3: Register URLs (`urls.py`)

Add after existing URL patterns:

```python
# Monitoring
path("monitoring/email-logs/", EmailLogMonitoringEndpoint.as_view(), name="monitoring-email-logs"),
path("monitoring/scheduled-jobs/", ScheduledJobMonitoringEndpoint.as_view(), name="monitoring-scheduled-jobs"),
path("monitoring/worker-health/", WorkerHealthMonitoringEndpoint.as_view(), name="monitoring-worker-health"),
```

### Step 4: Update `__init__.py` exports

Add to `views/__init__.py`:

```python
from .monitoring import (
    EmailLogMonitoringEndpoint,
    ScheduledJobMonitoringEndpoint,
    WorkerHealthMonitoringEndpoint,
)
```

Add to `serializers/__init__.py`:

```python
from .monitoring import EmailNotificationLogSerializer
```

## Todo List

- [ ] Create `serializers/monitoring.py` with EmailNotificationLogSerializer
- [ ] Create `views/monitoring.py` with 3 endpoint classes
- [ ] Add URL patterns to `urls.py`
- [ ] Update `views/__init__.py` exports
- [ ] Update `serializers/__init__.py` exports
- [ ] Test email-logs pagination + filters via curl/httpie
- [ ] Test scheduled-jobs returns all PeriodicTask records
- [ ] Test worker-health graceful fallback when no workers running

## Success Criteria

- All 3 endpoints return 200 for authenticated admin users
- Non-admin users receive 403
- Email logs properly paginated (50/page default)
- Date range and entity_name filters work correctly
- Worker health returns graceful error when workers unavailable
- No N+1 queries (use select_related)

## Risk Assessment

| Risk                                | Likelihood     | Mitigation                                        |
| ----------------------------------- | -------------- | ------------------------------------------------- |
| Celery Inspect hangs if no workers  | High (dev env) | 3s timeout + try/except fallback                  |
| PeriodicTask model API changes      | Low            | django-celery-beat is stable, pin version         |
| Large email_notification_logs table | Medium         | Pagination + date range filters, db indexes exist |

## Security Considerations

- All endpoints require `InstanceAdminPermission` (role >= 15)
- Read-only access only (GET methods)
- Email addresses exposed in logs — acceptable for instance admins
- Cache worker-health to prevent Inspect API abuse
- No user input passed to raw queries — ORM only
