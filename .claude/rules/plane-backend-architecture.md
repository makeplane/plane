# Plane Backend Architecture & Development Rules

**MANDATORY**: Read this rule, `./docs/code-standards.md`, and `./docs/system-architecture.md` before implementing ANY backend changes.

## Tech Stack

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Framework      | Django 4.2 + Django REST Framework 3.15                |
| Database       | PostgreSQL 15.7 (primary) + MongoDB (logs, optional)   |
| Cache          | Redis/Valkey (cache, sessions, pub-sub)                |
| Message Broker | RabbitMQ (Celery broker)                               |
| Task Queue     | Celery (`@shared_task`) + Celery Beat (scheduler)      |
| Auth           | Session-based (`BaseSessionAuthentication` via `crum`) |
| Storage        | MinIO (S3-compatible)                                  |
| Real-time      | Express.js + Hocuspocus (Y.js CRDT) — `apps/live/`     |
| Reverse Proxy  | Caddy 2.10 — `apps/proxy/`                             |
| WSGI           | Gunicorn (port 8000)                                   |

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
│   │   ├── models/               # All Django models (one file per domain, 33+ files)
│   │   ├── mixins.py             # AuditModel, SoftDeleteModel, ChangeTrackerMixin
│   │   └── migrations/           # 120+ Django migrations
│   │
│   ├── app/                      # INTERNAL API (v0) — web app endpoints (NO OpenAPI)
│   │   ├── views/                # DRF ViewSets & APIViews (subdirs: issue/, workspace/, etc.)
│   │   ├── serializers/          # DRF serializers for internal API
│   │   ├── permissions/          # Permission classes & @allow_permission decorator
│   │   └── urls/                 # URL patterns (one file per domain)
│   │
│   ├── api/                      # EXTERNAL API (v1) — public API WITH OpenAPI specs
│   │   ├── views/                # Has @extend_schema decorators (drf-spectacular)
│   │   ├── serializers/          # SEPARATE serializers for public API
│   │   └── urls/
│   │
│   ├── authentication/           # Auth providers, sessions, middleware, rate limiting
│   │   ├── adapter/              # Auth adapters + exception handler
│   │   ├── middleware/           # Session middleware
│   │   ├── provider/             # Auth providers (magic link, password, OAuth)
│   │   ├── session.py            # BaseSessionAuthentication
│   │   └── views/                # Auth endpoints
│   │
│   ├── bgtasks/                  # 36+ Celery background tasks
│   ├── license/                  # CE/EE license-specific logic (own models, views, urls)
│   ├── space/                    # Public sharing endpoints
│   ├── web/                      # Web-specific endpoints
│   ├── middleware/                # Custom middleware (request logging, body size limit)
│   └── utils/                    # Shared utilities (filters, paginators, timezone, etc.)
```

### Two API Layers — CRITICAL DISTINCTION

|             | `plane/app/` (Internal) | `plane/api/` (External)               |
| ----------- | ----------------------- | ------------------------------------- |
| API Version | `/api/`, `/api/v0/`     | `/api/v1/`                            |
| Auth        | Session (cookie-based)  | API Key (`X-API-Key`) or OAuth Bearer |
| OpenAPI     | ❌ No decorators        | ✅ `@extend_schema` (drf-spectacular) |
| Serializers | Own set                 | Own SEPARATE set                      |
| Purpose     | Web app frontend        | Third-party integrations              |

**NEVER** mix serializers between layers. Each has its own `serializers/` directory.

## Request Lifecycle (Middleware Pipeline)

```
Request → CorsMiddleware → SecurityMiddleware → WhiteNoiseMiddleware
→ SessionMiddleware → CommonMiddleware → CsrfViewMiddleware
→ AuthenticationMiddleware → XFrameOptionsMiddleware
→ CurrentRequestUserMiddleware (crum) → GZipMiddleware
→ RequestBodySizeLimitMiddleware → APITokenLogMiddleware
→ RequestLoggerMiddleware → URL Router → View → Response
```

Key: `crum.CurrentRequestUserMiddleware` enables auto-set of `created_by`/`updated_by` on models.

## Model Hierarchy

### Inheritance chain (from `plane/db/mixins.py` and `plane/db/models/base.py`):

```python
# mixins.py
class TimeAuditModel:     # → created_at, updated_at (auto)
class UserAuditModel:     # → created_by, updated_by (auto via crum)
class SoftDeleteModel:    # → deleted_at, objects (SoftDeletionManager), all_objects
class AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel): ...

# base.py
class BaseModel(AuditModel):
    id = UUIDField(primary_key=True, default=uuid4)
    # Provides: id, created_at, updated_at, created_by, updated_by, deleted_at
    # objects = SoftDeletionManager (auto-excludes deleted_at)
    # all_objects = models.Manager (includes soft-deleted)

# project.py
class ProjectBaseModel(BaseModel):
    project = ForeignKey(Project, on_delete=CASCADE)
    workspace = ForeignKey(Workspace, on_delete=CASCADE)
    # workspace auto-set from project on save()
```

### When to use which base class:

- **`BaseModel`** — workspace-level entities (Department, StaffProfile, Workspace-scoped)
- **`ProjectBaseModel`** — project-scoped entities (Issue, State, Label, Cycle, Module)
  - Auto-sets `workspace = self.project.workspace` on save — don't set manually

### ChangeTrackerMixin (from `plane/db/mixins.py`):

Use when you need to detect field changes between init→save:

```python
class MyModel(ChangeTrackerMixin, ProjectBaseModel):
    TRACKED_FIELDS = ["name", "status"]
    # On save, self.changed_fields contains set of modified field names
```

## Custom Managers — CRITICAL

Models often have **multiple managers** that filter different subsets. Using the wrong one causes data leaks or missing records.

### Issue

```python
Issue.objects          # SoftDeletionManager — excludes deleted_at only
Issue.issue_objects    # IssueManager — excludes deleted + triage + archived + draft
Issue.all_objects      # Default manager — includes everything (including soft-deleted)
```

**Rule**: Use `Issue.issue_objects` for user-facing queries. Use `Issue.objects` only when you explicitly need archived/draft/triage items.

### State

```python
State.objects            # StateManager — excludes deleted + triage states
State.all_state_objects  # Default — includes triage states
State.triage_objects     # Only triage states
```

### General pattern for all models inheriting BaseModel:

```python
MyModel.objects      # SoftDeletionManager (default) — auto-excludes deleted_at IS NOT NULL
MyModel.all_objects  # Includes soft-deleted records
```

## View Patterns

### Two base classes:

```python
from plane.app.views.base import BaseViewSet, BaseAPIView
```

**`BaseViewSet`** (for standard CRUD resources) inherits:

- `TimezoneMixin` — auto-activates user timezone per request
- `ReadReplicaControlMixin` — supports read replica database routing
- `ModelViewSet` — standard DRF CRUD
- `BasePaginator` — provides `self.paginate()` method

**`BaseAPIView`** (for custom endpoints) — same base features, minus ModelViewSet CRUD.

Both provide:

```python
self.workspace_slug  # → self.kwargs.get("slug")
self.project_id      # → self.kwargs.get("project_id")
self.fields          # → parsed from ?fields=a,b,c query param
self.expand          # → parsed from ?expand=a,b,c query param
```

Both include:

- `SessionAuthentication` + `IsAuthenticated` permission
- `DjangoFilterBackend` + `SearchFilter`
- Exception handling for `IntegrityError`, `ValidationError`, `ObjectDoesNotExist`, `KeyError`

### Complete ViewSet example (from actual Issue codebase):

```python
class IssueViewSet(BaseViewSet):
    model = Issue
    webhook_event = "issue"       # Triggers webhook on mutations
    search_fields = ["name"]
    filter_backends = (ComplexFilterBackend,)
    filterset_class = IssueFilterSet

    def get_serializer_class(self):
        # Different serializer for write vs read
        if self.action in ["create", "update", "partial_update"]:
            return IssueCreateSerializer
        return IssueSerializer

    def get_queryset(self):
        # ALWAYS filter by workspace + project
        return Issue.issue_objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).distinct()

    @method_decorator(gzip_page)  # For large list responses
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        # Apply filters
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = self.get_queryset().filter(**filters)

        # Apply annotations (computed fields)
        issue_queryset = self.apply_annotations(issue_queryset)

        # Order, group, paginate
        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset, _ = order_issue_queryset(issue_queryset, order_by_param)

        group_by = request.GET.get("group_by", False)
        if group_by:
            return self.paginate(
                request=request,
                queryset=issue_queryset,
                order_by=order_by_param,
                paginator_cls=GroupedOffsetPaginator,
                ...
            )
        return self.paginate(request=request, queryset=issue_queryset, order_by=order_by_param)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)
        serializer = IssueCreateSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )
        if serializer.is_valid():
            serializer.save()

            # ① Activity tracking (always after create/update/delete)
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

            # ② Webhook event (always after mutations on webhook-enabled resources)
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

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
    def partial_update(self, request, slug, project_id, pk=None):
        # ① Capture current state BEFORE update (for activity diff)
        current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)

        serializer = IssueCreateSerializer(issue, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # ② Track activity with before/after state
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                current_instance=current_instance,  # ← before state
                ...
            )
```

### Post-mutation patterns (IMPORTANT):

After **create/update/delete**, always fire these Celery tasks:

1. **`issue_activity.delay()`** — issue-specific activity log + push notifications
2. **`model_activity.delay()`** — webhook events to external consumers
3. **`recent_visited_task.delay()`** — on retrieve/list for recent visit tracking

For non-issue models, use `model_activity.delay()` at minimum for webhook support.

### Timezone conversion for responses:

```python
from plane.utils.timezone_converter import user_timezone_converter

datetime_fields = ["created_at", "updated_at"]
data = user_timezone_converter(data, datetime_fields, request.user.user_timezone)
```

### Guest access pattern:

```python
# Check if user is guest AND project doesn't allow guest view all
if (
    ProjectMember.objects.filter(
        workspace__slug=slug, project_id=project_id,
        member=request.user, role=5, is_active=True,
    ).exists()
    and not project.guest_view_all_features
):
    issue_queryset = issue_queryset.filter(created_by=request.user)
```

## Permission Patterns

### @allow_permission decorator (preferred for per-method control):

```python
from plane.app.permissions import ROLE, allow_permission

# Workspace-level permission
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def create(self, request, slug):
    ...

# Project-level permission (default level)
@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
def list(self, request, slug, project_id):
    ...

# Creator can also access (bypasses role check if created_by matches)
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
def partial_update(self, request, slug, project_id, pk=None):
    ...
```

### Class-based permissions (for different permissions per HTTP method):

```python
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceEntityPermission

class MyEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [WorkspaceEntityPermission]  # ADMIN + MEMBER + GUEST read
        else:
            self.permission_classes = [WorkSpaceAdminPermission]   # ADMIN only write
        return super().get_permissions()
```

### Available permission classes:

| Class                       | Who can access                                                               |
| --------------------------- | ---------------------------------------------------------------------------- |
| `WorkSpaceBasePermission`   | POST: anyone auth'd; GET: any member; PUT/PATCH: admin+member; DELETE: admin |
| `WorkSpaceAdminPermission`  | Workspace admin only                                                         |
| `WorkspaceEntityPermission` | Any active workspace member (admin, member, guest)                           |
| `ProjectEntityPermission`   | Any active project member                                                    |
| `ProjectMemberPermission`   | Project admin + member (not guest)                                           |
| `ProjectLitePermission`     | Read-only project access                                                     |

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

# Simple serializer
class MyModelSerializer(BaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
        read_only_fields = ["id", "workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]

# Dynamic serializer (supports ?fields=a,b&expand=c,d query params)
class MyModelDynamicSerializer(DynamicBaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
```

### Write vs Read serializers:

Create separate serializers when write operations need different field handling:

```python
# Read serializer — returns computed/annotated fields
class IssueSerializer(DynamicBaseSerializer): ...

# Write serializer — accepts related IDs, handles M2M creation
class IssueCreateSerializer(BaseSerializer):
    label_ids = serializers.ListField(child=serializers.PrimaryKeyRelatedField(...), write_only=True)
    assignee_ids = serializers.ListField(child=serializers.PrimaryKeyRelatedField(...), write_only=True)

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        obj = MyModel.objects.create(**validated_data, project_id=self.context["project_id"])
        if assignees:
            IssueAssignee.objects.bulk_create([...], batch_size=10)
        return obj
```

### Validation patterns (from actual codebase):

- Validate related objects belong to the **same project** (prevent cross-project references)
- Sanitize HTML: `validate_html_content()` from `plane.utils.content_validator`
- Validate binary data: `validate_binary_data()`
- Check date ranges: `start_date < target_date`
- Validate assignees have correct role: `ProjectMember.filter(role__gte=15)`

## URL Patterns

### Convention:

```python
# plane/app/urls/my_domain.py
from django.urls import path
from plane.app.views import MyViewSet, MyEndpoint

urlpatterns = [
    # Workspace-scoped: List + Create
    path(
        "workspaces/<str:slug>/my-models/",
        MyViewSet.as_view({"get": "list", "post": "create"}),
        name="my-models",
    ),
    # Workspace-scoped: Detail
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
2. Import in `plane/app/urls/__init__.py`:
   ```python
   from .my_domain import urlpatterns as my_domain_urls
   ```
3. Add to combined urlpatterns:
   ```python
   urlpatterns = [..., *my_domain_urls, ...]
   ```

### URL rules:

- **Workspace scope**: `workspaces/<str:slug>/...`
- **Project scope**: `workspaces/<str:slug>/projects/<uuid:project_id>/...`
- **kebab-case** for URL segments
- **UUID** for entity IDs: `<uuid:pk>`, `<uuid:project_id>`

## Background Tasks (Celery)

```python
# plane/bgtasks/my_task.py
from celery import shared_task
from plane.utils.exception_logger import log_exception

@shared_task
def my_task(model_id):
    """Always pass IDs as strings, never model instances (not serializable)."""
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return  # Gracefully handle missing objects
    except Exception as e:
        log_exception(e)
        raise
```

### Trigger from views:

```python
my_task.delay(str(obj.id))  # Always str() for UUID
```

### Celery Beat (scheduled tasks):

Configured via `django_celery_beat` in INSTALLED_APPS. Use Django admin or migrations to add periodic tasks.

## QuerySet Best Practices

```python
# ✅ select_related for FK (single SQL JOIN)
Department.objects.filter(...).select_related("manager", "linked_project")

# ✅ prefetch_related for reverse FK / M2M
Issue.issue_objects.filter(...).prefetch_related("labels", "assignees", "issue_module__module")

# ✅ Prefetch with custom queryset
queryset.prefetch_related(
    Prefetch("issue_reactions", queryset=IssueReaction.objects.select_related("issue", "actor"))
)

# ✅ Annotate computed fields (avoid N+1)
queryset.annotate(
    staff_count=Count("staff_members", filter=Q(staff_members__deleted_at__isnull=True))
)

# ✅ Subquery for cross-model aggregation (Plane's standard pattern)
queryset.annotate(
    cycle_id=Subquery(CycleIssue.objects.filter(issue=OuterRef("id")).values("cycle_id")[:1])
)

# ✅ ArrayAgg + Coalesce for M2M ID lists (Plane's standard pattern)
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

# ✅ Use Exists() for boolean annotations
queryset.annotate(
    is_subscribed=Exists(
        IssueSubscriber.objects.filter(issue_id=OuterRef("pk"), subscriber=request.user)
    )
)
```

## Frontend ↔ Backend Integration Pattern

When adding a new backend feature, you also need frontend integration:

### 1. TypeScript Types (`packages/types/`)

```typescript
export interface IMyModel {
  id: string;
  name: string;
  workspace: string;
  created_at: string;
  // ... matches serializer output
}
```

### 2. API Service (`apps/web/core/services/`)

```typescript
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class MyModelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<IMyModel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/my-models/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
  // POST, PATCH, DELETE follow same pattern
}
```

### 3. MobX Store (`apps/web/core/store/`)

```typescript
import { makeObservable, observable, action, runInAction } from "mobx";

export class MyModelStore {
  models: Record<string, IMyModel> = {};
  // ... computed getters, fetch/create/update/delete actions
}
```

### URL pattern matching (frontend → backend):

- Frontend: `/api/workspaces/${workspaceSlug}/my-models/`
- Backend: `workspaces/<str:slug>/my-models/`
- Django prepends `/api/` via ROOT_URLCONF

## i18n (Internationalization)

### Translation structure:

```
packages/i18n/src/locales/
├── en/
│   ├── core.json           # Critical translations
│   └── translations.json   # All translations
├── fr/
│   └── translations.json
└── [language]/
    └── translations.json
```

### Key format:

```json
{
  "issue": {
    "label": "Work item",
    "title": { "label": "Work item title" }
  }
}
```

### Pluralization (ICU MessageFormat):

```json
{ "items": "{count, plural, one {Work item} other {Work items}}" }
```

When adding new user-facing strings:

1. Add key to ALL language files (use English as placeholder)
2. Keep nesting structure consistent across languages
3. Use `useTranslation()` hook in frontend components

## Testing

### Test structure:

```
plane/tests/
├── conftest.py          # Shared fixtures (api_client, session_client, create_user, etc.)
├── factories.py         # Factory Boy factories (UserFactory, WorkspaceFactory, etc.)
├── unit/                # Unit tests (models, serializers, utils)
├── contract/            # API contract tests (endpoint behavior)
└── smoke/               # End-to-end smoke tests
```

### Key fixtures:

- `session_client` — authenticated client for `plane/app/` (internal API)
- `api_key_client` — API key authenticated client for `plane/api/` (external API)
- `create_user`, `api_token` — user and token setup

### Writing tests:

```python
@pytest.mark.django_db
class TestMyEndpoint:
    def test_list(self, session_client):
        url = reverse("my-models")
        response = session_client.get(url)
        assert response.status_code == 200
```

### Commands:

```bash
cd apps/api
python run_tests.py   # or pytest
```

## Coding Guidelines (from CONTRIBUTING.md)

- All features or bug fixes must be tested by one or more specs (unit-tests)
- ESLint 9 + Prettier for frontend linting/formatting
- Python: follow patterns in `./docs/code-standards.md`
- File size limits: Django views <150 lines per view class
- Commit format: conventional commits, no AI references
- **NEVER** commit secrets, API keys, or .env files

## Adding a New Feature — Complete Checklist

### Backend:

1. **Model**: Create in `plane/db/models/`, inherit `BaseModel` or `ProjectBaseModel`, register in `__init__.py`
2. **Migration**: `python manage.py makemigrations` from `apps/api/`
3. **Serializer**: Create in `plane/app/serializers/`, inherit `BaseSerializer`, register in `__init__.py`
4. **Views**: Create in `plane/app/views/`, inherit `BaseViewSet` or `BaseAPIView`, register in `__init__.py`
5. **Permissions**: Use `@allow_permission` decorator or class-based permissions
6. **URLs**: Create in `plane/app/urls/`, register in `__init__.py`
7. **Activity/Webhooks**: Fire `issue_activity.delay()` and/or `model_activity.delay()` after mutations
8. **Background tasks**: If needed, create in `plane/bgtasks/` using `@shared_task`
9. **Tests**: Add in `plane/tests/` (unit + contract)

### Frontend (parallel):

10. **Types**: Add TypeScript interfaces in `packages/types/`
11. **Service**: Create API service in `apps/web/core/services/`
12. **Store**: Create MobX store in `apps/web/core/store/`
13. **Components**: Build UI following `plane-design-system.md` rule

## Common Mistakes to Avoid

- ❌ Using `Issue.objects` instead of `Issue.issue_objects` for user-facing queries (leaks triage/archived/draft)
- ❌ Using `State.all_state_objects` when you should use `State.objects` (leaks triage states)
- ❌ Forgetting `workspace__slug=slug` filtering (data leak across workspaces)
- ❌ Not inheriting from `BaseModel`/`ProjectBaseModel` (loses UUID pk, audit, soft delete)
- ❌ Using auto-incrementing integer PKs instead of UUID
- ❌ Manually setting `workspace` on `ProjectBaseModel` (auto-set from project on save)
- ❌ Hard-deleting — default `obj.delete()` is soft delete; use `all_objects` to query deleted
- ❌ Forgetting to register model/view/serializer/url in respective `__init__.py` files
- ❌ Passing model instances to Celery tasks — pass `str(obj.id)` only (serialization)
- ❌ Using `print()` for error logging — use `log_exception()` from `plane.utils.exception_logger`
- ❌ Missing activity tracking after data mutations (`issue_activity`, `model_activity`)
- ❌ Not handling `deleted_at` in custom querysets or raw SQL
- ❌ Forgetting `select_related`/`prefetch_related` → N+1 queries in list views
- ❌ Mixing `plane/app/` serializers with `plane/api/` views or vice versa
- ❌ Not validating related objects belong to same project (cross-project data leak)
- ❌ Not sanitizing HTML content before saving (`validate_html_content()`)
- ❌ Forgetting timezone conversion for datetime responses (`user_timezone_converter`)
- ❌ Not capturing `current_instance` before update (breaks activity diff tracking)
