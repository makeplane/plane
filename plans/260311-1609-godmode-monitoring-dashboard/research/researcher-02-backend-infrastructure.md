# Backend Infrastructure Research: Celery Monitoring

## EmailNotificationLog Model

**Location**: `apps/api/plane/db/models/notification.py` (lines 122-150)

Core fields:

- `receiver` (FK User) - email recipient
- `triggered_by` (FK User) - user who triggered the action
- `entity_identifier` (UUID) - link to domain object (issue, page, etc.)
- `entity_name` (CharField) - entity type name
- `entity` (CharField) - entity classification
- `data` (JSONField) - metadata payload
- `processed_at` (DateTimeField) - when task processed email
- `sent_at` (DateTimeField) - actual send time
- `old_value` / `new_value` (CharField) - change tracking
- Inherited from BaseModel: `id`, `created_at`, `updated_at`

**Indexes**: Composite indexes on (receiver, status), (receiver, entity), (receiver, state)
**Table**: `email_notification_logs`

---

## Celery Configuration

**Location**: `apps/api/plane/celery.py`

### Broker & Scheduling

- Broker: Redis (configured via Django settings)
- Scheduler: `django_celery_beat.schedulers.DatabaseScheduler` — tasks persisted in DB
- Beat schedule file defines 10+ periodic tasks

### Beat Schedule (Current Tasks)

```
• "check-every-five-minutes-to-send-email-notifications"
  Task: plane.bgtasks.email_notification_task.stack_email_notification
  Schedule: Every 5 minutes (crontab minute="*/5")

• "run-every-6-hours-for-instance-trace"
  Task: plane.license.bgtasks.tracer.instance_traces
  Schedule: Every 6 hours (crontab hour="*/6", minute=0)

• "check-every-day-to-delete-hard-delete"
  Task: plane.bgtasks.deletion_task.hard_delete
  Schedule: Daily 00:00 UTC

• "check-every-day-to-delete-exporter-history"
  Task: plane.bgtasks.exporter_expired_task.delete_old_s3_link
  Schedule: Daily 01:30 UTC

• "check-every-day-to-delete-file-asset"
  Task: plane.bgtasks.file_asset_task.delete_unuploaded_file_asset
  Schedule: Daily 02:00 UTC

• "check-every-day-to-delete-api-logs"
  Task: plane.bgtasks.cleanup_task.delete_api_logs
  Schedule: Daily 02:30 UTC

• "check-every-day-to-delete-email-notification-logs"
  Task: plane.bgtasks.cleanup_task.delete_email_notification_logs
  Schedule: Daily 02:45 UTC

• "check-every-day-to-send-worklog-reminder"
  Task: plane.bgtasks.worklog_reminder_task.worklog_daily_reminder
  Schedule: Daily 09:00 UTC
```

### Task Registration

- All tasks use `@shared_task` decorator from `celery`
- 35+ task files in `apps/api/plane/bgtasks/`
- Auto-discovery enabled: `app.autodiscover_tasks()`
- JSON logging configured for all task workers

---

## Celery Inspect API Capabilities

Django-Celery provides `celery` application with Inspect API:

**Available inspect() methods:**

```python
from plane.celery import app
inspector = app.control.inspect()

# Active tasks running right now
inspector.active()

# Scheduled tasks (beat schedule)
inspector.scheduled()

# Worker stats/registered tasks
inspector.stats()

# Registered task names
inspector.registered()

# Active tasks, reserved queue items
inspector.query_task_states()
```

**Expected responses structure:**

```json
{
  "celery@worker1": {
    "active": [
      {
        "id": "task-uuid",
        "name": "task.name",
        "args": [],
        "kwargs": {},
        "time_start": 1234567890.5
      }
    ],
    "scheduled": [
      {
        "request": {
          "id": "task-uuid",
          "name": "task.name"
        },
        "eta": "2026-03-11T12:00:00Z",
        "priority": 6
      }
    ]
  }
}
```

---

## Instance/Admin API Pattern

**Location**: `apps/api/plane/license/api/views/`

### Base Architecture

- **Base Class**: `BaseAPIView` (extends TimezoneMixin + APIView + BasePaginator)
- **Default Permission**: `InstanceAdminPermission`
- **Authentication**: `BaseSessionAuthentication`
- **Error Handling**: Catches IntegrityError, ValidationError, ObjectDoesNotExist, KeyError
- **Features**: Method-level permission override, caching decorators, pagination

### InstanceAdminPermission

**Location**: `apps/api/plane/license/api/permissions/instance.py`

```python
class InstanceAdminPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        instance = Instance.objects.first()
        return InstanceAdmin.objects.filter(
            role__gte=15,          # role >= 15 = admin
            instance=instance,
            user=request.user
        ).exists()
```

**Pattern**: Query InstanceAdmin join for role-based access (role >= 15)

### Example View Pattern

```python
class InstanceEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [InstanceAdminPermission()]
        return [AllowAny()]

    @cache_response(timeout, user=False)
    def get(self, request):
        # read-only response
        instance = Instance.objects.first()
        serializer = InstanceSerializer(instance)
        return Response(serializer.data)

    @invalidate_cache(path="/api/instances/", user=False)
    def patch(self, request):
        # admin-only mutation
        instance = Instance.objects.first()
        serializer = InstanceSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
```

---

## Admin URL Registration Pattern

**Location**: `apps/api/plane/license/urls.py`

### URL Structure

```python
from django.urls import path
from plane.license.api.views import InstanceAdminEndpoint, ...

urlpatterns = [
    path("", InstanceEndpoint.as_view()),
    path("admins/", InstanceAdminEndpoint.as_view()),
    path("admins/me/", InstanceAdminUserMeEndpoint.as_view()),
    path("admins/<uuid:pk>/", InstanceAdminEndpoint.as_view()),
    path("configurations/", InstanceConfigurationEndpoint.as_view()),
]
```

### Integration into Main URLs

**Location**: Main URL router includes license URLs with prefix `/api/instances/`

Example from main urls.py:

```python
path("api/instances/", include("plane.license.urls"))
```

**Full endpoint path**: `/api/instances/{path}`

**Admin access pattern**: `/api/instances/admins/` → requires `InstanceAdminPermission`

---

## Django-Celery-Beat Model (PeriodicTask)

Standard model from django-celery-beat package. Key queryable fields:

- `name` (CharField) - unique task identifier
- `task` (CharField) - full task path (e.g., "plane.bgtasks.cleanup_task.delete_api_logs")
- `schedule` (ForeignKey CrontabSchedule or IntervalSchedule) - when to run
- `args` (JSONField) - positional args
- `kwargs` (JSONField) - keyword args
- `options` (JSONField) - task options (retry, time_limit, etc.)
- `enabled` (BooleanField) - is task active
- `last_run_at` (DateTimeField) - when was it last executed
- `total_run_count` (IntegerField) - execution count

**Usage in monitoring dashboard**: Query PeriodicTask to list all scheduled jobs, their status, last run time

---

## Key Integration Points for Monitoring Dashboard

1. **Email Metrics**: Query `EmailNotificationLog` for processed/sent counts, pending items
2. **Active Jobs**: Use `app.control.inspect().active()` via Celery API
3. **Scheduled Jobs**: Use `app.control.inspect().scheduled()` or query PeriodicTask model
4. **Admin Guard**: Wrap all monitoring endpoints with `InstanceAdminPermission`
5. **URL Prefix**: Register monitoring endpoints under `/api/instances/celery/` or similar
6. **Caching**: Use `@cache_response()` for read-only metrics endpoints (60-600s)
7. **Task History**: Create separate CeleryTaskLog model for persistence (optional but recommended)

---

## Unresolved Questions

1. Does `last_run_at` in PeriodicTask get updated by DatabaseScheduler automatically?
2. What is the max retention period for PeriodicTask execution history?
3. Should we cache Celery inspect API results to avoid worker queries on every dashboard refresh?
4. Does Celery include retry counts in task state or only in Flower integration?
