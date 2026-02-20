# Plane Backend Architecture & Development Rules

**MANDATORY**: Read this rule and `./docs/code-standards.md` before implementing ANY backend changes.

## Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Framework    | Django 4.x + Django REST Framework                          |
| Database     | PostgreSQL (UUID primary keys)                              |
| Cache/Broker | Redis (cache, sessions) + RabbitMQ (Celery broker)          |
| Task Queue   | Celery (shared_task pattern)                                |
| Auth         | Session-based (BaseSessionAuthentication)                   |
| Storage      | MinIO (S3-compatible)                                       |
| Real-time    | Express.js + Hocuspocus (Y.js CRDT) — separate `apps/live/` |

## Project Structure

```
apps/api/                         # Backend root
├── manage.py
├── plane/
│   ├── settings/                 # Django settings (common, local, production, test)
│   ├── urls.py                   # Root URL conf
│   ├── celery.py                 # Celery app
│   ├── db/                       # Database layer
│   │   ├── models/               # All Django models
│   │   ├── mixins.py             # AuditModel, SoftDeleteModel, ChangeTrackerMixin
│   │   └── migrations/           # Django migrations
│   ├── app/                      # Main app (internal API, web-facing)
│   │   ├── views/                # DRF ViewSets & APIViews
│   │   ├── serializers/          # DRF serializers
│   │   ├── permissions/          # Permission classes & decorators
│   │   └── urls/                 # URL patterns (one file per domain)
│   ├── api/                      # External API (public API tokens)
│   │   ├── views/
│   │   ├── serializers/
│   │   └── urls/
│   ├── authentication/           # Auth providers, sessions, middleware
│   ├── bgtasks/                  # Celery background tasks
│   ├── license/                  # License/CE-specific logic
│   ├── space/                    # Public sharing endpoints
│   ├── middleware/                # Custom middleware
│   ├── utils/                    # Shared utilities
│   └── web/                      # Web-specific endpoints
```

## Model Patterns

### BaseModel — ALL models must inherit from this

```python
from plane.db.models.base import BaseModel

class MyModel(BaseModel):
    # BaseModel provides:
    # - id: UUIDField (primary key, auto-generated)
    # - created_at: DateTimeField (auto)
    # - updated_at: DateTimeField (auto)
    # - created_by: ForeignKey(User, nullable)
    # - updated_by: ForeignKey(User, nullable)
    # - deleted_at: DateTimeField (soft delete)
    # - objects: SoftDeletionManager (auto-filters deleted_at__isnull=True)
    # - all_objects: Manager (includes soft-deleted)

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="my_models",
    )
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "my_models"
        verbose_name = "My Model"
        ordering = ["-created_at"]
```

### Key Model Conventions

- **UUID primary keys** — never use auto-incrementing integers
- **Soft deletion** — use `deleted_at` field; `objects` manager auto-filters; use `all_objects` for including deleted
- **Audit fields** — `created_by`, `updated_by` set automatically via `crum.get_current_user()`
- **Workspace scoping** — most models have a `workspace` ForeignKey
- **related_name** — always specify explicitly
- **ChangeTrackerMixin** — use when you need to detect field changes on save

### Model Location

All models go in `plane/db/models/` with one file per domain:

- `issue.py`, `project.py`, `workspace.py`, `cycle.py`, `module.py`, etc.
- Register in `plane/db/models/__init__.py`

## Serializer Patterns

### BaseSerializer & DynamicBaseSerializer

```python
from plane.app.serializers.base import BaseSerializer, DynamicBaseSerializer

# Simple serializer
class MyModelSerializer(BaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

# Dynamic serializer (supports field filtering & expansion)
class MyModelDynamicSerializer(DynamicBaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
```

### Serializer Conventions

- Inherit from `BaseSerializer` (provides `id` as read-only)
- Use `DynamicBaseSerializer` when clients need to select/expand fields
- Create separate serializers for Create vs Read vs List when needed (e.g., `IssueCreateSerializer`, `IssueDetailSerializer`, `IssueListDetailSerializer`)
- Validate in serializer methods, not in views
- Use `read_only_fields` for auto-managed fields

## View Patterns

### BaseViewSet & BaseAPIView

```python
from plane.app.views.base import BaseViewSet, BaseAPIView

# For CRUD resources
class MyModelViewSet(BaseViewSet):
    model = MyModel
    serializer_class = MyModelSerializer
    # BaseViewSet provides:
    # - SessionAuthentication
    # - IsAuthenticated permission
    # - DjangoFilterBackend + SearchFilter
    # - Timezone handling (TimezoneMixin)
    # - Read replica support (ReadReplicaControlMixin)
    # - Pagination (BasePaginator)

# For custom endpoints
class MyCustomEndpoint(BaseAPIView):
    # BaseAPIView provides same base features minus ModelViewSet CRUD
    pass
```

### View Conventions

- **CRUD resources** → use `BaseViewSet`
- **Custom endpoints** → use `BaseAPIView` with explicit `get()`, `post()`, `put()`, `patch()`, `delete()`
- **Never use raw Django views** — always DRF views
- **Error handling** — BaseViewSet handles `IntegrityError`, `ValidationError`, `ObjectDoesNotExist` automatically
- **Workspace slug** — accessed via `kwargs["slug"]` in URL patterns

## Permission Patterns

### Decorator-based (preferred for granular control)

```python
from plane.app.permissions import ROLE, allow_permission

class MyViewSet(BaseViewSet):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        ...

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        ...
```

### Class-based (for view-level permissions)

```python
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceEntityPermission

class MyEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [WorkspaceEntityPermission]
        else:
            self.permission_classes = [WorkSpaceAdminPermission]
        return super().get_permissions()
```

### Role Hierarchy

| Role   | Value | Access Level                   |
| ------ | ----- | ------------------------------ |
| ADMIN  | 20    | Full workspace/project control |
| MEMBER | 15    | Standard operations            |
| GUEST  | 5     | Read-only + limited write      |

### Permission Levels

- `level="WORKSPACE"` — checks `WorkspaceMember` role
- `level="PROJECT"` (default) — checks `ProjectMember` role, falls back to workspace admin

## URL Patterns

### Convention

```python
# plane/app/urls/my_domain.py
from django.urls import path
from plane.app.views import MyViewSet, MyEndpoint

urlpatterns = [
    # List + Create
    path(
        "workspaces/<str:slug>/my-models/",
        MyViewSet.as_view({"get": "list", "post": "create"}),
        name="my-models",
    ),
    # Retrieve + Update + Delete
    path(
        "workspaces/<str:slug>/my-models/<uuid:pk>/",
        MyViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="my-model-detail",
    ),
]
```

### URL Rules

- **Always scope under workspace**: `workspaces/<str:slug>/...`
- **Project-scoped**: `workspaces/<str:slug>/projects/<uuid:project_id>/...`
- **Use kebab-case** for URL segments
- **UUID params**: use `<uuid:pk>`, `<uuid:project_id>`
- **Register** in `plane/app/urls/__init__.py`

## Background Tasks (Celery)

```python
# plane/bgtasks/my_task.py
from celery import shared_task
from plane.db.models import MyModel
from plane.utils.exception_logger import log_exception

@shared_task
def my_background_task(model_id):
    try:
        obj = MyModel.objects.get(id=model_id)
        # ... process
    except MyModel.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        raise
```

### Task Conventions

- Use `@shared_task` decorator (not `@app.task`)
- Always handle `DoesNotExist` gracefully
- Use `log_exception()` for error logging
- Pass IDs (strings/UUIDs), not model instances
- Trigger from views: `my_background_task.delay(str(obj.id))`

## Migrations

- One migration file per feature/change
- **Never** manually edit existing migrations
- Run: `python manage.py makemigrations` from `apps/api/`
- Naming: auto-generated is fine; Django handles numbering
- **Test migrations** both forward and backward when possible

## Testing

- Tests in `plane/tests/` (unit + smoke + contract)
- Use factories from `plane/tests/factories.py`
- Config: `pytest.ini` at `apps/api/`
- Run: `python run_tests.py` or `pytest`

## QuerySet Best Practices

```python
# ✅ Use select_related for ForeignKey (single join)
Department.objects.filter(...).select_related("manager", "linked_project")

# ✅ Use prefetch_related for reverse FK / M2M
Issue.objects.filter(...).prefetch_related("labels", "assignees")

# ✅ Use annotations for computed fields
departments.annotate(
    staff_count=Count("staff_members", filter=Q(staff_members__deleted_at__isnull=True))
)

# ✅ Filter soft-deleted records (objects manager does this by default)
MyModel.objects.filter(workspace__slug=slug)  # auto-excludes deleted

# ❌ Don't use .all() without filters in views
# ❌ Don't do N+1 queries — always select_related/prefetch_related
# ❌ Don't use all_objects unless you explicitly need soft-deleted records
```

## Common Mistakes to Avoid

- ❌ Forgetting to inherit from `BaseModel` (loses UUID pk, audit, soft delete)
- ❌ Using `models.AutoField` or `models.BigAutoField` for primary keys
- ❌ Hard-deleting records instead of soft delete (`obj.delete()` is soft by default)
- ❌ Forgetting to register URLs in `plane/app/urls/__init__.py`
- ❌ Forgetting to register models in `plane/db/models/__init__.py`
- ❌ Writing business logic in serializers — keep it in views or utils
- ❌ Returning raw querysets — always serialize with DRF serializers
- ❌ Skipping permission checks on new endpoints
- ❌ Using `print()` for logging — use `log_exception()` or Django logging
- ❌ Passing model instances to Celery tasks — pass UUIDs only
- ❌ Forgetting `workspace__slug=slug` filtering (data leak across workspaces)
- ❌ Not handling `deleted_at` in custom querysets/raw SQL

## Adding a New Feature — Checklist

1. **Model**: Create in `plane/db/models/`, inherit `BaseModel`, add to `__init__.py`
2. **Migration**: `python manage.py makemigrations`
3. **Serializer**: Create in `plane/app/serializers/`, inherit `BaseSerializer`, add to `__init__.py`
4. **Views**: Create in `plane/app/views/`, inherit `BaseViewSet` or `BaseAPIView`, add to `__init__.py`
5. **Permissions**: Use `@allow_permission` or class-based permissions
6. **URLs**: Create in `plane/app/urls/`, register in `__init__.py`
7. **Background tasks**: If needed, create in `plane/bgtasks/`
8. **Tests**: Add unit tests in `plane/tests/`
9. **Scope**: Always filter by `workspace__slug` — never expose cross-workspace data
