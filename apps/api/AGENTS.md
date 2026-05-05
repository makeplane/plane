# API Backend — Agent Rules

> Rules for `apps/api/`. Read root `AGENTS.md` first for universal rules.

## Stack

Django 4.2 + DRF 3.15 + PostgreSQL 15.7 + Celery 5.4.0 + RabbitMQ + Redis/Valkey + MongoDB 4.6 (logs)

## Structure

```
apps/api/plane/
├── app/              # Legacy v0 API (/api/, /api/v0/)
│   ├── views/        # ViewSets (BaseViewSet, BaseAPIView)
│   ├── serializers/
│   ├── permissions/  # @allow_permission, ROLE
│   └── urls/
├── api/              # New v1 API (/api/v1/)
├── db/models/        # 39 model files
├── db/migrations/    # 163+ migrations
├── bgtasks/          # 36+ Celery tasks
├── license/          # God Mode / Instance Admin
│   └── api/views/    # BaseAPIView from plane.license.api.views
├── authentication/   # OAuth, magic link, Swing SSO
└── utils/
```

## API Versions

- `/api/` and `/api/v0/` — Legacy (under `plane.app`)
- `/api/v1/` — New endpoints (under `plane.api`)
- `/api/public/` — Public/shared space APIs
- `/auth/` — Authentication endpoints
- `/god-mode/instances/` — Admin instance endpoints

## Model Hierarchy

```python
TimeAuditModel     → created_at, updated_at (auto)
UserAuditModel     → created_by, updated_by (auto via crum)
SoftDeleteModel    → deleted_at; objects = SoftDeletionManager; all_objects = default
AuditModel         = TimeAuditModel + UserAuditModel + SoftDeleteModel
BaseModel(Audit)   → id: UUID pk. Use for workspace-level entities.
ProjectBaseModel   → project FK + workspace FK (auto-set from project on save)
```

## Custom Managers (CRITICAL)

```python
Issue.objects          # SoftDeletionManager — excludes deleted only
Issue.issue_objects    # IssueManager — excludes deleted + triage + archived + draft
Issue.all_objects      # Default — includes everything (soft-deleted too)
State.objects          # StateManager — excludes deleted + triage
State.triage_objects   # Only triage states
```

**Rule:** `Issue.issue_objects` for user-facing queries. `Issue.objects` only when you need archived/draft/triage.

## ViewSet Patterns

### Workspace/Project API (BaseViewSet)

```python
from plane.app.views.base import BaseViewSet, BaseAPIView
# Both provide: self.workspace_slug, self.project_id, self.fields, self.expand

class IssueViewSet(BaseViewSet):
    model = Issue
    webhook_event = "issue"

    def get_queryset(self):
        return Issue.issue_objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        return self.paginate(request=request, queryset=self.get_queryset())
```

### God Mode API (Instance Admin)

```python
from plane.license.api.views import BaseAPIView  # NOT plane.app.views
from plane.license.api.permissions import InstanceAdminPermission

class MyInstanceView(BaseAPIView):
    permission_classes = [InstanceAdminPermission]
    # No workspace_slug, no project_id, no @allow_permission
```

## Permissions

| Decorator/Class                                                           | Use Case                    |
| ------------------------------------------------------------------------- | --------------------------- |
| `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`                            | Workspace/project endpoints |
| `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`                      | Workspace-level             |
| `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)` | Creator bypass              |
| `InstanceAdminPermission`                                                 | God Mode endpoints only     |

**Role values:** ADMIN=20, MEMBER=15, GUEST=5

**Guest access:** If `project.guest_view_all_features=False`, guests see only own issues.

## Post-Mutation Requirements (IMPORTANT)

After create/update/delete:

1. `issue_activity.delay()` — activity log + push notifications
2. `model_activity.delay()` — webhook events to external consumers
3. `recent_visited_task.delay()` — on retrieve for recent visit tracking

For `partial_update`, capture `current_instance` BEFORE update:

```python
current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)
```

## URL Registration (3 places)

1. Create `plane/app/urls/my_domain.py`
2. Import in `plane/app/urls/__init__.py`
3. Add to combined urlpatterns

```python
# URL patterns
path("workspaces/<str:slug>/my-models/",
     MyViewSet.as_view({"get": "list", "post": "create"}), name="my-models"),
path("workspaces/<str:slug>/my-models/<uuid:pk>/",
     MyViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})),
```

Rules: kebab-case URL segments, `<uuid:pk>` for entity IDs, `<str:slug>` for workspace.

## Celery Tasks

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def my_task(self, model_id):
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return  # Skip silently
    except Exception as e:
        log_exception(e)
        self.retry(exc=e)
```

- Auto-discovered via `autodiscover_tasks()` in `plane/celery.py`
- Always `str()` for UUID when passing to `.delay()`
- Scheduled tasks: register in `plane/celery.py` `beat_schedule`
- Pass IDs as strings, never model instances

## QuerySet Best Practices

```python
# FK joins (single query)
.select_related("manager", "linked_project")

# Reverse FK / M2M (separate query, cached)
.prefetch_related("labels", "assignees")

# Boolean annotation
.annotate(is_favorite=Exists(UserFavorite.objects.filter(user=request.user, entity=OuterRef("pk"))))

# M2M ID list
.annotate(label_ids=Coalesce(
    Subquery(IssueLabel.objects.filter(issue_id=OuterRef("pk"))
        .values("issue_id").annotate(arr=ArrayAgg("label_id")).values("arr")),
    Value([], output_field=ArrayField(UUIDField()))))
```

## Authentication

- Session cookie (Redis-backed) — web/admin apps
- Bearer token (JWT/API key) — external API v1
- OAuth (Google, GitHub, GitLab, Gitea)
- Magic link (email token)
- Swing SSO (staff ID + password OR token from Swing portal)
  - Keys: `IS_SWING_SSO_ENABLED`, `SWING_SSO_URL`, `SWING_SSO_CLIENT_ID`, `SWING_SSO_CLIENT_SECRET`, `SWING_SSO_COMPANY_CODE`

## Key Feature Models

| Feature         | Model                                                                 | Notes                                         |
| --------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| Task Categories | `MainTaskCategory`, `SubTaskCategory`                                 | Instance-level 2-tier, FK on Issue            |
| Worklogs        | `IssueWorkLog`                                                        | 1-720 min, 7-day edit, ADMIN-only edit/delete |
| Workflow        | `ProjectWorkflow`, `WorkflowTransition`, `WorkflowTransitionApprover` | 403 unauthorized, 400 restricted              |
| Department      | `Department`                                                          | Hierarchical max 6 levels, manager FK         |
| Staff           | `StaffProfile`                                                        | 1:1 User per workspace, employment status     |
| Priority        | Issue.priority                                                        | 4 levels, default "medium", "none" removed    |
| Favorites       | `UserFavorite`                                                        | Polymorphic, annotate `is_favorite` on lists  |
