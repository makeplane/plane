# Phase 01: template-catalog-foundation - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 11 new/modified files
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/plane/db/models/project_template.py` | model | CRUD | `apps/api/plane/db/models/workspace.py` + `apps/api/plane/db/models/module.py` | role-match |
| `apps/api/plane/db/models/__init__.py` | config/export | transform | `apps/api/plane/db/models/__init__.py` | exact |
| `apps/api/plane/db/migrations/0122_projecttemplate_seed_builtins.py` | migration | batch | `apps/api/plane/db/migrations/0118_remove_workspaceuserproperties_product_tour_and_more.py` | role-match |
| `apps/api/plane/app/serializers/project_template.py` | serializer | CRUD/transform | `apps/api/plane/app/serializers/draft.py` + `apps/api/plane/app/serializers/module.py` | role-match |
| `apps/api/plane/app/serializers/__init__.py` | config/export | transform | `apps/api/plane/app/serializers/__init__.py` | exact |
| `apps/api/plane/app/views/workspace/project_template.py` | controller/viewset | request-response CRUD | `apps/api/plane/app/views/workspace/draft.py` + `apps/api/plane/app/views/workspace/member.py` | role-match |
| `apps/api/plane/app/views/__init__.py` | config/export | transform | `apps/api/plane/app/views/__init__.py` | exact |
| `apps/api/plane/app/urls/workspace.py` | route | request-response | `apps/api/plane/app/urls/workspace.py` | exact |
| `apps/api/plane/tests/unit/serializers/test_project_template.py` | test | transform/validation | `apps/api/plane/tests/unit/serializers/test_label.py` | role-match |
| `apps/api/plane/tests/unit/models/test_project_template.py` | test | CRUD | `apps/api/plane/tests/unit/models/test_workspace_model.py` | role-match |
| `apps/api/plane/tests/contract/app/test_project_templates_app.py` | test | request-response CRUD | `apps/api/plane/tests/contract/app/test_project_app.py` | role-match |

## Pattern Assignments

### `apps/api/plane/db/models/project_template.py` (model, CRUD)

**Analog:** `apps/api/plane/db/models/workspace.py`, `apps/api/plane/db/models/module.py`, `apps/api/plane/db/models/base.py`

**Imports pattern** (`workspace.py` lines 9-17):
```python
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .base import BaseModel
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.color import get_random_color
```

**Base model/audit pattern** (`base.py` lines 17-44):
```python
class BaseModel(AuditModel):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)

    class Meta:
        abstract = True

    def save(self, *args, created_by_id=None, disable_auto_set_user=False, **kwargs):
        if not disable_auto_set_user:
            if created_by_id:
                self.created_by_id = created_by_id
            else:
                user = get_current_user()
                if user is None or user.is_anonymous:
                    self.created_by = None
                    self.updated_by = None
                elif self._state.adding:
                    self.created_by = user
                    self.updated_by = None
                else:
                    self.updated_by = user
        super(BaseModel, self).save(*args, **kwargs)
```

**Workspace FK + JSON/default pattern** (`workspace.py` lines 198-213):
```python
class WorkspaceMember(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_member")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_workspace",
    )
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5)
    view_props = models.JSONField(default=get_default_props)
    default_props = models.JSONField(default=get_default_props)
    issue_props = models.JSONField(default=get_issue_props)
    is_active = models.BooleanField(default=True)
    getting_started_checklist = models.JSONField(default=dict)
```

**Choice + JSON + constraint pattern** (`module.py` lines 58-109):
```python
class ModuleStatus(models.TextChoices):
    BACKLOG = "backlog"
    PLANNED = "planned"
    IN_PROGRESS = "in-progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Module(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Module Name")
    description = models.TextField(verbose_name="Module Description", blank=True)
    description_text = models.JSONField(verbose_name="Module Description RT", blank=True, null=True)
    logo_props = models.JSONField(default=dict)

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=Q(deleted_at__isnull=True),
                name="module_unique_name_project_when_deleted_at_null",
            )
        ]
        db_table = "modules"
        ordering = ("-created_at",)
```

**Apply to template model:** inherit `BaseModel` rather than `WorkspaceBaseModel` because built-ins have `workspace = NULL`; use `workspace = models.ForeignKey("db.Workspace", ..., null=True, blank=True)`, `payload = models.JSONField(default=dict)`, `is_active = models.BooleanField(default=True)`, and DB constraints that distinguish global system rows from workspace custom rows.

---

### `apps/api/plane/db/models/__init__.py` (config/export, transform)

**Analog:** `apps/api/plane/db/models/__init__.py`

**Import/export grouping pattern** (lines 11-17, 49, 68-78):
```python
from .draft import (
    DraftIssue,
    DraftIssueAssignee,
    DraftIssueLabel,
    DraftIssueModule,
    DraftIssueCycle,
)
from .module import Module, ModuleIssue, ModuleLink, ModuleMember, ModuleUserProperties
from .workspace import (
    Workspace,
    WorkspaceBaseModel,
    WorkspaceMember,
    WorkspaceMemberInvite,
    WorkspaceTheme,
    WorkspaceUserProperties,
    WorkspaceUserLink,
    WorkspaceHomePreference,
    WorkspaceUserPreference,
)
```

**Apply to template model:** add a direct import such as `from .project_template import ProjectTemplate` near related project/workspace domain imports.

---

### `apps/api/plane/db/migrations/0122_projecttemplate_seed_builtins.py` (migration, batch)

**Analog:** `apps/api/plane/db/migrations/0118_remove_workspaceuserproperties_product_tour_and_more.py`

**RunPython + historical model pattern** (lines 37-50, 53-69):
```python
def migrate_all_the_product_tour_to_true(apps, _schema_editor):
    Profile = apps.get_model('db', 'Profile')
    WorkspaceMember = apps.get_model('db', 'WorkspaceMember')

    default_product_tour = set_default_product_tour()
    Profile.objects.all().update(product_tour=default_product_tour)

class Migration(migrations.Migration):
    dependencies = [
        ('db', '0117_rename_description_draftissue_description_json_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='product_tour',
            field=models.JSONField(default=plane.db.models.user.get_default_product_tour),
        ),
        migrations.RunPython(migrate_all_the_product_tour_to_true, reverse_code=migrations.RunPython.noop)
    ]
```

**JSONField default + RunPython pattern** (`0113_webhook_version.py` lines 26-30, 50-65):
```python
def populate_product_tour(apps, _schema_editor):
    WorkspaceUserProperties = apps.get_model('db', 'WorkspaceUserProperties')
    default_value = get_default_product_tour()
    WorkspaceUserProperties.objects.all().update(product_tour=default_value)

migrations.AddField(
    model_name='workspaceuserproperties',
    name='product_tour',
    field=models.JSONField(default=set_default_product_tour_to_false),
),
migrations.RunPython(populate_product_tour, reverse_code=migrations.RunPython.noop),
```

**Apply to template seed:** current latest migration is `0121_alter_estimate_type.py`; make `0122...` depend on it. Use `apps.get_model("db", "ProjectTemplate")` inside the seed function and `update_or_create(system_key=..., is_system=True, workspace__isnull=True, defaults={...})` so built-ins are idempotent and custom copies are untouched.

---

### `apps/api/plane/app/serializers/project_template.py` (serializer, CRUD/transform)

**Analog:** `apps/api/plane/app/serializers/draft.py`, `apps/api/plane/app/serializers/module.py`, `apps/api/plane/app/serializers/base.py`

**Imports pattern** (`draft.py` lines 5-30):
```python
from django.utils import timezone
from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import (
    User,
    Issue,
    Label,
    State,
    DraftIssue,
    ProjectMember,
    EstimatePoint,
)
from plane.app.permissions import ROLE
```

**Serializer base pattern** (`base.py` lines 8-10):
```python
class BaseSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)
```

**Read/write serializer pattern** (`module.py` lines 26-48):
```python
class ModuleWriteSerializer(BaseSerializer):
    lead_id = serializers.PrimaryKeyRelatedField(
        source="lead", queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "archived_at",
            "deleted_at",
        ]
```

**Validation pattern** (`draft.py` lines 71-140):
```python
def validate(self, attrs):
    if (
        attrs.get("start_date", None) is not None
        and attrs.get("target_date", None) is not None
        and attrs.get("start_date", None) > attrs.get("target_date", None)
    ):
        raise serializers.ValidationError("Start date cannot exceed target date")

    if attrs.get("label_ids"):
        label_ids = [label.id for label in attrs["label_ids"]]
        attrs["label_ids"] = list(
            Label.objects.filter(project_id=self.context.get("project_id"), id__in=label_ids).values_list(
                "id", flat=True
            )
        )

    if (
        attrs.get("state")
        and not State.objects.filter(
            project_id=self.context.get("project_id"),
            pk=attrs.get("state").id,
        ).exists()
    ):
        raise serializers.ValidationError("State is not valid please pass a valid state_id")

    return attrs
```

**Duplicate guard pattern** (`module.py` lines 64-74, 94-120):
```python
def create(self, validated_data):
    members = validated_data.pop("member_ids", None)
    project = self.context["project"]

    module_name = validated_data.get("name")
    if module_name:
        if Module.objects.filter(name=module_name, project=project).exists():
            raise serializers.ValidationError({"error": "Module with this name already exists"})

    module = Module.objects.create(**validated_data, project=project)
    return module

def update(self, instance, validated_data):
    module_name = validated_data.get("name")
    if module_name:
        if Module.objects.filter(name=module_name, project=instance.project).exclude(id=instance.id).exists():
            raise serializers.ValidationError({"error": "Module with this name already exists"})
    return super().update(instance, validated_data)
```

**Apply to template serializer:** keep all payload shape and cross-reference checks in serializer/helper functions invoked by `validate`. Raise `serializers.ValidationError({...})` for duplicate keys/names, invalid enum values, dangling `state_key`/`label_keys`/`module_key`/`cycle_key`, missing `schema_version`, and system-template mutation attempts.

---

### `apps/api/plane/app/serializers/__init__.py` (config/export, transform)

**Analog:** `apps/api/plane/app/serializers/__init__.py`

**Export pattern** (lines 86-93, 132-136):
```python
from .module import (
    ModuleDetailSerializer,
    ModuleWriteSerializer,
    ModuleSerializer,
    ModuleIssueSerializer,
    ModuleLinkSerializer,
    ModuleUserPropertiesSerializer,
)

from .draft import (
    DraftIssueCreateSerializer,
    DraftIssueSerializer,
    DraftIssueDetailSerializer,
)
```

**Apply to template serializers:** export read/write/duplicate serializers so views can import from `plane.app.serializers`.

---

### `apps/api/plane/app/views/workspace/project_template.py` (controller/viewset, request-response CRUD)

**Analog:** `apps/api/plane/app/views/workspace/draft.py`, `apps/api/plane/app/views/workspace/member.py`, `apps/api/plane/app/views/base.py`

**Imports pattern** (`draft.py` lines 19-40):
```python
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    IssueCreateSerializer,
    DraftIssueCreateSerializer,
    DraftIssueSerializer,
    DraftIssueDetailSerializer,
)
from plane.db.models import (
    Issue,
    DraftIssue,
    Workspace,
)
from .. import BaseViewSet
```

**BaseViewSet auth/error pattern** (`base.py` lines 48-68, 70-109):
```python
class BaseViewSet(TimezoneMixin, ReadReplicaControlMixin, ModelViewSet, BasePaginator):
    model = None
    permission_classes = [IsAuthenticated]
    filter_backends = (DjangoFilterBackend, SearchFilter)
    authentication_classes = [BaseSessionAuthentication]

    def get_queryset(self):
        try:
            return self.model.objects.all()
        except Exception as e:
            log_exception(e)
            raise APIException("Please check the view", status.HTTP_400_BAD_REQUEST)

    def handle_exception(self, exc):
        try:
            response = super().handle_exception(exc)
            return response
        except Exception as e:
            if isinstance(e, ObjectDoesNotExist):
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            log_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
```

**Workspace queryset + list/create pattern** (`draft.py` lines 46-54, 97-154):
```python
class WorkspaceDraftIssueViewSet(BaseViewSet):
    model = DraftIssue

    def get_queryset(self):
        return (
            DraftIssue.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "draft_issue_module__module")
        ).distinct()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        issues = self.get_queryset().filter(created_by=request.user).order_by("-created_at")
        return self.paginate(
            request=request,
            queryset=(issues),
            on_results=lambda issues: DraftIssueSerializer(issues, many=True).data,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = DraftIssueCreateSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**Admin-only write + soft deactivate pattern** (`member.py` lines 76-99, 143-150):
```python
@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
def partial_update(self, request, slug, pk):
    workspace_member = WorkspaceMember.objects.get(
        pk=pk, workspace__slug=slug, member__is_bot=False, is_active=True
    )
    serializer = WorkSpaceMemberSerializer(workspace_member, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
def destroy(self, request, slug, pk):
    workspace_member = WorkspaceMember.objects.get(
        workspace__slug=slug, pk=pk, member__is_bot=False, is_active=True
    )
    workspace_member.is_active = False
    workspace_member.save()
    return Response(status=status.HTTP_204_NO_CONTENT)
```

**Apply to template viewset:** list should allow `[ROLE.ADMIN, ROLE.MEMBER]` only, because Phase 1 excludes guests. Write/copy/deactivate should use `[ROLE.ADMIN]`. `get_queryset()` should include workspace custom templates and global built-ins for list, but write lookups must filter `workspace__slug=slug, is_system=False`.

---

### `apps/api/plane/app/views/__init__.py` (config/export, transform)

**Analog:** `apps/api/plane/app/views/__init__.py`

**Workspace view export pattern** (lines 46-62, 80-84):
```python
from .workspace.draft import WorkspaceDraftIssueViewSet

from .workspace.member import (
    WorkSpaceMemberViewSet,
    WorkspaceMemberUserEndpoint,
    WorkspaceProjectMemberEndpoint,
    WorkspaceMemberUserViewsEndpoint,
)
from .workspace.module import WorkspaceModulesEndpoint
from .workspace.cycle import WorkspaceCyclesEndpoint
from .workspace.quick_link import QuickLinkViewSet
from .workspace.sticky import WorkspaceStickyViewSet
```

**Apply to template view:** export `WorkspaceProjectTemplateViewSet` or the chosen endpoint class from `.workspace.project_template`.

---

### `apps/api/plane/app/urls/workspace.py` (route, request-response)

**Analog:** `apps/api/plane/app/urls/workspace.py`

**Import pattern** (lines 8-39):
```python
from plane.app.views import (
    UserWorkspaceInvitationsViewSet,
    WorkSpaceViewSet,
    WorkSpaceMemberViewSet,
    WorkspaceDraftIssueViewSet,
    QuickLinkViewSet,
    WorkspaceHomePreferenceViewSet,
    WorkspaceStickyViewSet,
    WorkspaceUserPreferenceViewSet,
)
```

**Route pattern** (lines 202-216):
```python
path(
    "workspaces/<str:slug>/draft-issues/",
    WorkspaceDraftIssueViewSet.as_view({"get": "list", "post": "create"}),
    name="workspace-draft-issues",
),
path(
    "workspaces/<str:slug>/draft-issues/<uuid:pk>/",
    WorkspaceDraftIssueViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
    name="workspace-drafts-issues",
),
path(
    "workspaces/<str:slug>/draft-to-issue/<uuid:draft_id>/",
    WorkspaceDraftIssueViewSet.as_view({"post": "create_draft_to_issue"}),
    name="workspace-drafts-issues",
),
```

**Apply to template routes:** add collection/detail routes under `workspaces/<str:slug>/project-templates/`. Add a custom duplicate route, e.g. `workspaces/<str:slug>/project-templates/<uuid:pk>/duplicate/`, mapping `{"post": "duplicate"}`.

---

### `apps/api/plane/tests/unit/serializers/test_project_template.py` (test, transform/validation)

**Analog:** `apps/api/plane/tests/unit/serializers/test_label.py`

**Unit serializer test pattern** (lines 5-25, 32-41):
```python
import pytest
from plane.app.serializers import LabelSerializer
from plane.db.models import Project, Label

@pytest.mark.unit
class TestLabelSerializer:
    @pytest.mark.django_db
    def test_label_serializer_create_valid_data(self, db, workspace):
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)

        serializer = LabelSerializer(
            data={"name": "Test Label"},
            context={"project_id": project.id},
        )
        assert serializer.is_valid()
        assert serializer.errors == {}
        serializer.save(project_id=project.id)

    @pytest.mark.django_db
    def test_label_serializer_create_duplicate_name(self, db, workspace):
        Label.objects.create(name="Test Label", project=project)
        serializer = LabelSerializer(data={"name": "Test Label"}, context={"project_id": project.id})
        assert not serializer.is_valid()
        assert serializer.errors == {"name": ["LABEL_NAME_ALREADY_EXISTS"]}
```

**Apply to template serializer tests:** mark class `@pytest.mark.unit`; create payload fixtures inline; assert `serializer.is_valid()` for a minimal valid payload and `not serializer.is_valid()` for duplicate keys/names, missing `schema_version`, invalid enum/color/group/priority values, dangling references, and system/custom mutation guards.

---

### `apps/api/plane/tests/unit/models/test_project_template.py` (test, CRUD)

**Analog:** `apps/api/plane/tests/unit/models/test_workspace_model.py`

**Unit model test pattern** (lines 5-21, 29-48):
```python
import pytest
from uuid import uuid4

from plane.db.models import Workspace, WorkspaceMember

@pytest.mark.unit
class TestWorkspaceModel:
    @pytest.mark.django_db
    def test_workspace_creation(self, create_user):
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", id=uuid4(), owner=create_user
        )
        assert workspace.id is not None
        assert workspace.name == "Test Workspace"

    @pytest.mark.django_db
    def test_workspace_member_creation(self, create_user):
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=create_user,
            role=20,
        )
        assert workspace_member.id is not None
        assert workspace_member.role == 20
```

**Apply to template model tests:** assert global built-ins can have `workspace=None`, custom templates require workspace, `payload` defaults to `{}`, `is_active` defaults true, uniqueness/constraints reject duplicate custom names per workspace and duplicate system keys for built-ins.

---

### `apps/api/plane/tests/contract/app/test_project_templates_app.py` (test, request-response CRUD)

**Analog:** `apps/api/plane/tests/contract/app/test_project_app.py`, `apps/api/plane/tests/conftest.py`

**Fixture/auth pattern** (`conftest.py` lines 67-71, 125-139):
```python
@pytest.fixture
def session_client(api_client, create_user):
    api_client.force_authenticate(user=create_user)
    return api_client

@pytest.fixture
def workspace(create_user):
    created_workspace = Workspace.objects.create(
        name="Test Workspace",
        owner=create_user,
        slug="test-workspace",
    )
    WorkspaceMember.objects.create(workspace=created_workspace, member=create_user, role=20)
    return created_workspace
```

**URL helper pattern** (`test_project_app.py` lines 20-44):
```python
class TestProjectBase:
    def get_project_url(self, workspace_slug: str, pk: uuid.UUID = None, details: bool = False) -> str:
        base_url = f"/api/workspaces/{workspace_slug}/projects/"
        if pk:
            return f"{base_url}{pk}/"
        if details:
            return f"{base_url}details/"
        return base_url
```

**Contract test pattern** (`test_project_app.py` lines 47-59, 126-143, 400-418):
```python
@pytest.mark.contract
class TestProjectAPIPost(TestProjectBase):
    @pytest.mark.django_db
    def test_create_project_empty_data(self, session_client, workspace):
        url = self.get_project_url(workspace.slug)
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_project_guest_forbidden(self, session_client, workspace):
        guest_user = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5)
        session_client.force_authenticate(user=guest_user)
        response = session_client.post(url, project_data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_partial_update_project_forbidden_non_admin(self, session_client, workspace):
        member_user = User.objects.create_user(email="member@example.com", username="member")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        session_client.force_authenticate(user=member_user)
        response = session_client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
```

**Apply to template API tests:** use explicit `/api/workspaces/{slug}/project-templates/` URLs. Cover list admin/member allowed, guest forbidden, custom create/update/deactivate admin allowed, member/guest writes forbidden, built-ins included in list, built-in patch/delete forbidden, duplicate built-in to custom succeeds, inactive custom excluded from list.

## Shared Patterns

### Authentication And Permissions

**Source:** `apps/api/plane/app/permissions/base.py` lines 13-19, 40-84
**Apply to:** All template view methods
```python
class ROLE(Enum):
    ADMIN = 20
    MEMBER = 15
    GUEST = 5

def allow_permission(allowed_roles, level="PROJECT", creator=False, model=None):
    ...
    allowed_role_values = [role.value if isinstance(role, ROLE) else role for role in allowed_roles]
    if level == "WORKSPACE":
        if WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=kwargs["slug"],
            role__in=allowed_role_values,
            is_active=True,
        ).exists():
            return view_func(instance, request, *args, **kwargs)
    return Response(
        {"error": "You don't have the required permissions."},
        status=status.HTTP_403_FORBIDDEN,
    )
```

**Important:** do not use `WorkSpaceAdminPermission` for admin-only template writes. `apps/api/plane/app/permissions/workspace.py` lines 61-71 show it permits `[Admin, Member]`, which conflicts with Phase 1 admin-only writes.

### View Error Handling

**Source:** `apps/api/plane/app/views/base.py` lines 70-109
**Apply to:** Template viewset
```python
if isinstance(e, IntegrityError):
    return Response({"error": "The payload is not valid"}, status=status.HTTP_400_BAD_REQUEST)
if isinstance(e, ValidationError):
    return Response({"error": "Please provide valid detail"}, status=status.HTTP_400_BAD_REQUEST)
if isinstance(e, ObjectDoesNotExist):
    return Response({"error": "The required object does not exist."}, status=status.HTTP_404_NOT_FOUND)
log_exception(e)
return Response({"error": "Something went wrong please try again later"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### Serializer Validation

**Source:** `apps/api/plane/app/serializers/draft.py` lines 71-140 and `apps/api/plane/app/serializers/module.py` lines 64-120
**Apply to:** Template payload create/update/copy serializers
```python
raise serializers.ValidationError("Start date cannot exceed target date")
raise serializers.ValidationError({"error": "Module with this name already exists"})
return super().update(instance, validated_data)
```

### Soft Deactivation

**Source:** `apps/api/plane/app/views/workspace/member.py` lines 143-150
**Apply to:** Custom template `destroy`/deactivate endpoint
```python
workspace_member.is_active = False
workspace_member.save()
return Response(status=status.HTTP_204_NO_CONTENT)
```

Use the same response shape, but update `ProjectTemplate.is_active = False` and never deactivate `is_system=True` rows.

### Testing Fixtures

**Source:** `apps/api/plane/tests/conftest.py` lines 67-71, 125-139
**Apply to:** Unit and contract tests
```python
api_client.force_authenticate(user=create_user)
WorkspaceMember.objects.create(workspace=created_workspace, member=create_user, role=20)
```

## No Analog Found

All planned files have usable local analogs. There is no existing `ProjectTemplate` domain; planner should copy the workspace/project resource patterns above rather than looking for a catalog-specific predecessor.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | All listed files have role or exact analogs. |

## Metadata

**Analog search scope:** `apps/api/plane/db/models`, `apps/api/plane/db/migrations`, `apps/api/plane/app/serializers`, `apps/api/plane/app/views`, `apps/api/plane/app/urls`, `apps/api/plane/app/permissions`, `apps/api/plane/tests`
**Files scanned:** 120+ Python files by `rg --files`/`rg`
**Strong analogs read:** 17 files
**Pattern extraction date:** 2026-06-30
