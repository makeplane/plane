# Plane Backend Architecture & Development Rules

**MANDATORY**: Read this rule and `./docs/code-standards.md` before implementing ANY backend changes.

## Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| Framework      | Django 4.x + Django REST Framework                          |
| Database       | PostgreSQL (UUID primary keys, OKLCH colors)                |
| Cache          | Redis (cache, sessions)                                     |
| Message Broker | RabbitMQ (Celery broker)                                    |
| Task Queue     | Celery (`@shared_task`)                                     |
| Auth           | Session-based (`BaseSessionAuthentication` via `crum`)      |
| Storage        | MinIO (S3-compatible)                                       |
| Real-time      | Express.js + Hocuspocus (Y.js CRDT) — separate `apps/live/` |

## Project Structure

```
apps/api/                         # Backend root
├── manage.py
├── plane/
│   ├── settings/                 # Django settings (common, local, production, test)
│   ├── urls.py                   # Root URL conf
│   ├── celery.py                 # Celery app
│   │
│   ├── db/                       # DATABASE LAYER — models only, no business logic
│   │   ├── models/               # All Django models (one file per domain)
│   │   ├── mixins.py             # AuditModel, SoftDeleteModel, ChangeTrackerMixin
│   │   └── migrations/
│   │
│   ├── app/                      # INTERNAL API — web app endpoints
│   │   ├── views/                # DRF ViewSets & APIViews (subdirs: issue/, workspace/, etc.)
│   │   ├── serializers/          # DRF serializers
│   │   ├── permissions/          # Permission classes & @allow_permission decorator
│   │   └── urls/                 # URL patterns (one file per domain)
│   │
│   ├── api/                      # EXTERNAL API — public API with OpenAPI specs (drf-spectacular)
│   │   ├── views/                # Has @extend_schema decorators
│   │   ├── serializers/          # Separate serializers for public API
│   │   └── urls/
│   │
│   ├── authentication/           # Auth providers, sessions, middleware
│   ├── bgtasks/                  # Celery background tasks
│   ├── license/                  # CE/EE license-specific logic (has own models, views, urls)
│   ├── space/                    # Public sharing endpoints
│   ├── middleware/                # Custom middleware (request logging, body size limit)
│   └── utils/                    # Shared utilities (filters, paginators, timezone, etc.)
```

**IMPORTANT**: `plane/app/` (internal) and `plane/api/` (external) are SEPARATE layers with their own serializers and views. Internal endpoints do NOT use OpenAPI decorators; external ones DO.

## Model Hierarchy

Plane has a strict model inheritance hierarchy. Use the correct base class:

```
AuditModel (mixins.py)
├── TimeAuditModel → created_at, updated_at
├── UserAuditModel → created_by, updated_by (via crum)
└── SoftDeleteModel → deleted_at, objects (filtered), all_objects (unfiltered)

BaseModel(AuditModel)             → id (UUID), all audit fields
├── Workspace, User, etc.         → workspace-level entities
│
ProjectBaseModel(BaseModel)       → + project FK, + workspace FK (auto-set from project)
├── Issue, State, Label, etc.     → project-scoped entities
```

### When to use which:

- **`BaseModel`** — workspace-level entities (Department, StaffProfile, etc.)
- **`ProjectBaseModel`** — project-scoped entities (Issue, Cycle, Module, etc.) — auto-sets `workspace` from `project` on save

## Custom Managers — CRITICAL

Models often have **multiple managers** that filter different subsets. Using the wrong one causes bugs:

### Issue

```python
Issue.objects          # SoftDeletionManager — excludes deleted_at
Issue.issue_objects    # IssueManager — excludes deleted + triage + archived + draft
Issue.all_objects      # Default manager — includes everything
```

**Rule**: Use `Issue.issue_objects` for user-facing queries. Use `Issue.objects` only when you need archived/draft/triage.

### State

```python
State.objects            # StateManager — excludes deleted + triage states
State.all_state_objects  # Default manager — includes triage
State.triage_objects     # Only triage states
```

### General pattern

```python
MyModel.objects      # SoftDeletionManager (default) — auto-excludes deleted_at
MyModel.all_objects  # includes soft-deleted records
```

## View Patterns

### Two base classes — choose correctly:

```python
from plane.app.views.base import BaseViewSet, BaseAPIView

# BaseViewSet — for standard CRUD resources
class MyModelViewSet(BaseViewSet):
    model = MyModel
    serializer_class = MyModelSerializer
    webhook_event = "my_model"  # Optional: triggers webhook on changes
    search_fields = ["name"]
    filter_backends = (ComplexFilterBackend,)

    # BaseViewSet provides:
    # - SessionAuthentication + IsAuthenticated
    # - DjangoFilterBackend + SearchFilter
    # - TimezoneMixin (auto timezone per user)
    # - ReadReplicaControlMixin
    # - BasePaginator (self.paginate method)
    # - workspace_slug, project_id, fields, expand properties
    # - Exception handling (IntegrityError, ValidationError, ObjectDoesNotExist, KeyError)

# BaseAPIView — for custom endpoints (non-CRUD)
class MyEndpoint(BaseAPIView):
    # Same base features, but for custom get/post/put/delete methods
    pass
```

### Properties available on both:

```python
self.workspace_slug  # → self.kwargs.get("slug")
self.project_id      # → self.kwargs.get("project_id")
self.fields          # → parsed from ?fields=a,b,c query param
self.expand          # → parsed from ?expand=a,b,c query param
```

### View method pattern (from actual Issue codebase):

```python
class IssueViewSet(BaseViewSet):
    model = Issue
    webhook_event = "issue"

    def get_serializer_class(self):
        # Different serializer for write vs read
        return IssueCreateSerializer if self.action in ["create", "update", "partial_update"] else IssueSerializer

    def get_queryset(self):
        # ALWAYS filter by workspace + project
        return Issue.issue_objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).distinct()

    @method_decorator(gzip_page)  # For large list responses
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        ...

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        serializer = IssueCreateSerializer(
            data=request.data,
            context={  # Pass context for validation
                "project_id": project_id,
                "workspace_id": project.workspace_id,
            },
        )
        if serializer.is_valid():
            serializer.save()

            # 1. Track activity (Celery)
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id")),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

            # 2. Webhook event (Celery)
            model_activity.delay(
                model_name="issue",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            return Response(issue, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### Activity tracking pattern (IMPORTANT for data-mutating endpoints):

After create/update/delete, always fire:

1. **`issue_activity.delay()`** — for issue-specific activity log + notifications
2. **`model_activity.delay()`** — for webhook events
3. **`recent_visited_task.delay()`** — for recent visit tracking (on retrieve/list)

For non-issue models, use `model_activity.delay()` at minimum.

## Permission Patterns

### @allow_permission decorator (preferred):

```python
from plane.app.permissions import ROLE, allow_permission

# Workspace-level
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def create(self, request, slug):
    ...

# Project-level (default)
@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
def list(self, request, slug, project_id):
    ...

# Creator can also access (even if not in allowed roles)
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
def partial_update(self, request, slug, project_id, pk=None):
    ...
```

### Class-based (for different permissions per HTTP method):

```python
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceEntityPermission

class MyEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [WorkspaceEntityPermission]  # ADMIN + MEMBER + GUEST
        else:
            self.permission_classes = [WorkSpaceAdminPermission]   # ADMIN only
        return super().get_permissions()
```

### Role values:

| Role   | Value | Constant      |
| ------ | ----- | ------------- |
| ADMIN  | 20    | `ROLE.ADMIN`  |
| MEMBER | 15    | `ROLE.MEMBER` |
| GUEST  | 5     | `ROLE.GUEST`  |

## Serializer Patterns

### Base classes:

```python
from plane.app.serializers.base import BaseSerializer, DynamicBaseSerializer

class MyModelSerializer(BaseSerializer):
    # BaseSerializer adds: id (read-only PrimaryKeyRelatedField)
    class Meta:
        model = MyModel
        fields = "__all__"
        read_only_fields = ["id", "workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]
```

### Related object handling (M2M via through tables):

```python
class MyCreateSerializer(BaseSerializer):
    # Accept IDs for related objects
    label_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True, required=False,
    )
    assignee_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True, required=False,
    )

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        obj = MyModel.objects.create(**validated_data, project_id=self.context["project_id"])

        if assignees:
            IssueAssignee.objects.bulk_create([
                IssueAssignee(assignee_id=aid, issue=obj, project_id=..., workspace_id=...)
                for aid in assignees
            ], batch_size=10)
        return obj
```

### Validation rules (from actual codebase):

- Validate related objects belong to the same project
- Sanitize HTML content with `validate_html_content()`
- Validate binary data with `validate_binary_data()`
- Check date ranges (start_date < target_date)

## URL Patterns

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
    # Project-scoped
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/my-models/",
        MyViewSet.as_view({"get": "list", "post": "create"}),
        name="project-my-models",
    ),
]
```

### URL registration — 3 places to update:

1. Create `plane/app/urls/my_domain.py`
2. Import in `plane/app/urls/__init__.py`: `from .my_domain import urlpatterns as my_domain_urls`
3. Add to combined: `urlpatterns = [..., *my_domain_urls, ...]`

### URL conventions:

- **Workspace scope**: `workspaces/<str:slug>/...`
- **Project scope**: `workspaces/<str:slug>/projects/<uuid:project_id>/...`
- **kebab-case** for segments
- **UUID** for entity IDs: `<uuid:pk>`, `<uuid:project_id>`

## Background Tasks (Celery)

```python
from celery import shared_task
from plane.utils.exception_logger import log_exception

@shared_task
def my_task(model_id):
    """Always pass IDs as strings, never model instances."""
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        raise
```

### Trigger from views:

```python
my_task.delay(str(obj.id))
```

## QuerySet Best Practices

```python
# ✅ select_related for FK (single SQL JOIN)
Department.objects.filter(...).select_related("manager", "linked_project")

# ✅ prefetch_related for reverse FK / M2M
Issue.issue_objects.filter(...).prefetch_related("labels", "assignees", "issue_module__module")

# ✅ Annotate computed fields instead of Python-side calculation
queryset.annotate(
    staff_count=Count("staff_members", filter=Q(staff_members__deleted_at__isnull=True))
)

# ✅ Use Subquery for cross-model aggregation (Plane pattern)
queryset.annotate(
    cycle_id=Subquery(CycleIssue.objects.filter(issue=OuterRef("id")).values("cycle_id")[:1])
)

# ✅ Use ArrayAgg + Coalesce for M2M ID lists (Plane pattern)
queryset.annotate(
    label_ids=Coalesce(
        Subquery(
            IssueLabel.objects.filter(issue_id=OuterRef("pk"))
            .values("issue_id")
            .annotate(arr=ArrayAgg("label_id", distinct=True))
            .values("arr")
        ),
        Value([], output_field=ArrayField(UUIDField())),
    )
)

# ✅ Timezone conversion for datetime responses
from plane.utils.timezone_converter import user_timezone_converter
data = user_timezone_converter(data, ["created_at", "updated_at"], request.user.user_timezone)
```

## Model Registration Checklist

When adding a new model:

1. Create `plane/db/models/my_model.py` — inherit `BaseModel` or `ProjectBaseModel`
2. Add to `plane/db/models/__init__.py` — explicit import
3. Create migration: `python manage.py makemigrations`

When adding new views:

1. Create view in `plane/app/views/` (file or subdirectory)
2. Import in `plane/app/views/__init__.py` — explicit named imports
3. Create `plane/app/urls/my_domain.py`
4. Register in `plane/app/urls/__init__.py`

When adding new serializers:

1. Create in `plane/app/serializers/my_domain.py`
2. Import in `plane/app/serializers/__init__.py`

## Common Mistakes to Avoid

- ❌ Using `Issue.objects` instead of `Issue.issue_objects` for user-facing queries (leaks triage/archived/draft)
- ❌ Using `State.all_state_objects` when you should use `State.objects` (leaks triage states)
- ❌ Forgetting `workspace__slug=slug` filtering (data leak across workspaces)
- ❌ Not inheriting from `BaseModel`/`ProjectBaseModel` (loses UUID pk, audit, soft delete)
- ❌ Using auto-incrementing integer PKs instead of UUID
- ❌ Hard-deleting with `obj.delete(soft=False)` — default `obj.delete()` is soft delete
- ❌ Forgetting to register model/view/serializer/url in respective `__init__.py`
- ❌ Passing model instances to Celery tasks — pass `str(obj.id)` only
- ❌ Using `print()` for logging — use `log_exception()` or Django logging
- ❌ Missing activity tracking after data mutations (issue_activity, model_activity)
- ❌ Not handling `deleted_at` in custom querysets or raw SQL
- ❌ Forgetting `select_related`/`prefetch_related` → N+1 queries
- ❌ Using inline styles or hardcoded values for model choices — use enum classes
- ❌ Mixing `plane/app/` serializers with `plane/api/` views or vice versa
