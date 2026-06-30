# Phase 02: Transactional Project Creation - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File                                                         | Role       | Data Flow                   | Closest Analog                                                   | Match Quality |
| ------------------------------------------------------------------------- | ---------- | --------------------------- | ---------------------------------------------------------------- | ------------- |
| `apps/api/plane/app/services/__init__.py`                                 | config     | import/package              | `apps/api/plane/app/serializers/__init__.py`                     | partial       |
| `apps/api/plane/app/services/project_creation.py`                         | service    | request-response + CRUD     | `apps/api/plane/api/views/project.py`                            | composite     |
| `apps/api/plane/app/services/project_template_apply.py`                   | service    | transform + CRUD            | `apps/api/plane/app/serializers/project_template.py`             | composite     |
| `apps/api/plane/app/serializers/project.py`                               | serializer | request-response validation | `apps/api/plane/app/serializers/project.py`                      | exact         |
| `apps/api/plane/app/views/project/base.py`                                | controller | request-response            | `apps/api/plane/app/views/project/base.py`                       | exact         |
| `apps/api/plane/api/serializers/project.py`                               | serializer | request-response validation | `apps/api/plane/api/serializers/project.py`                      | exact         |
| `apps/api/plane/api/views/project.py`                                     | controller | request-response            | `apps/api/plane/api/views/project.py`                            | exact         |
| `apps/api/plane/tests/unit/services/test_project_template_apply.py`       | test       | transform + CRUD            | `apps/api/plane/tests/unit/serializers/test_project_template.py` | role-match    |
| `apps/api/plane/tests/contract/app/test_project_template_creation_app.py` | test       | request-response            | `apps/api/plane/tests/contract/app/test_project_app.py`          | exact         |
| `apps/api/plane/tests/contract/api/test_projects.py`                      | test       | request-response            | `apps/api/plane/tests/contract/api/test_projects.py`             | exact         |

## Pattern Assignments

### `apps/api/plane/app/services/__init__.py` (config, import/package)

**Analog:** `apps/api/plane/app/serializers/__init__.py`

**Pattern:** Keep package init minimal. No project-local `apps/api/plane/app/services/` package exists today; create the package only if new service modules are added, and avoid side-effect imports unless the planner needs a stable import surface.

---

### `apps/api/plane/app/services/project_creation.py` (service, request-response + CRUD)

**Analog:** `apps/api/plane/api/views/project.py`

**Imports pattern** (lines 8-18, 23-48):

```python
from django.db import IntegrityError, transaction
from django.db.models import Exists, F, Func, OuterRef, Prefetch, Q, Subquery, Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from plane.db.models import (
    Project,
    ProjectMember,
    State,
    DEFAULT_STATES,
    Workspace,
)
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.utils.exception_logger import log_exception
from plane.utils.host import base_host
```

**Core transaction pattern** (lines 224-264):

```python
serializer = ProjectCreateSerializer(data={**request.data}, context={"workspace_id": workspace.id})

if serializer.is_valid():
    with transaction.atomic():
        serializer.save()

        ProjectMember.objects.create(project_id=serializer.instance.id, member=request.user, role=20)

        if (
            serializer.instance.project_lead_id is not None
            and serializer.instance.project_lead_id != request.user.id
        ):
            ProjectMember.objects.create(
                project_id=serializer.instance.id,
                member_id=serializer.instance.project_lead_id,
                role=20,
            )

        State.objects.bulk_create([... for state in DEFAULT_STATES])
```

**Post-commit activity pattern** (lines 266-292):

```python
def _dispatch_model_activity():
    model_activity.delay(
        model_name="project",
        model_id=str(project.id),
        requested_data=request.data,
        current_instance=None,
        actor_id=request.user.id,
        slug=slug,
        origin=base_host(request=request, is_app=True),
    )

transaction.on_commit(_dispatch_model_activity, robust=True)
```

**Error handling pattern** (lines 297-330):

```python
except IntegrityError as e:
    if "already exists" in str(e):
        return Response({"name": "The project name is already taken"}, status=status.HTTP_409_CONFLICT)
    log_exception(e)
    return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
except Workspace.DoesNotExist:
    return Response({"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND)
except ValidationError:
    return Response({"identifier": "The project identifier is already taken"}, status=status.HTTP_409_CONFLICT)
except Exception as e:
    log_exception(e)
    return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**Apply guidance:** Move the write orchestration into this service, not the serializer. Keep both no-template and template branches inside one `transaction.atomic()`. Register activity with `transaction.on_commit(..., robust=True)` after core writes are prepared.

---

### `apps/api/plane/app/services/project_template_apply.py` (service, transform + CRUD)

**Analogs:** `apps/api/plane/app/serializers/project_template.py`, target model files, and relation serializers.

**Payload validation pattern** (lines 384-408, 574-578):

```python
def validate_project_template_payload(payload):
    if not isinstance(payload, dict):
        raise serializers.ValidationError({"payload": "Payload must be a JSON object"})

    errors = []
    schema_version = payload.get("schema_version")
    if schema_version != PROJECT_TEMPLATE_SCHEMA_VERSION:
        errors.append({"schema_version": f"Must equal {PROJECT_TEMPLATE_SCHEMA_VERSION}"})

    states = payload.get("states", []) or []
    labels = payload.get("labels", []) or []
    modules = payload.get("modules", []) or []
    cycles = payload.get("cycles", []) or []
    starter_issues = payload.get("starter_issues", []) or []

    if errors:
        raise serializers.ValidationError(errors)
    return payload
```

**Reference validation pattern** (lines 519-563):

```python
issue_state = issue.get("state_key")
if not issue_state or issue_state not in state_keys:
    errors.append({"starter_issues": f"Entry {index} references unknown state_key {issue_state!r}"})

for label_key in issue.get("label_keys", []) or []:
    if label_key not in label_keys:
        errors.append({"starter_issues": f"Entry {index} references unknown label_key {label_key!r}"})

module_key = issue.get("module_key")
if module_key is not None and module_key not in module_keys:
    errors.append({"starter_issues": f"Entry {index} references unknown module_key {module_key!r}"})
```

**Ordering hook constraints**:

`apps/api/plane/db/models/state.py` lines 117-126:

```python
def save(self, *args, **kwargs):
    self.slug = slugify(self.name)
    if self._state.adding:
        last_id = State.objects.filter(project=self.project).aggregate(largest=models.Max("sequence"))["largest"]
        if last_id is not None:
            self.sequence = last_id + 15000
    return super().save(*args, **kwargs)
```

`apps/api/plane/db/models/label.py` lines 46-54:

```python
def save(self, *args, **kwargs):
    if self._state.adding:
        last_id = Label.objects.filter(project=self.project).aggregate(largest=models.Max("sort_order"))["largest"]
        if last_id is not None:
            self.sort_order = last_id + 10000
    super(Label, self).save(*args, **kwargs)
```

`apps/api/plane/db/models/module.py` lines 115-124 and `apps/api/plane/db/models/cycle.py` lines 88-97 assign new `sort_order` from existing rows. Use explicit `bulk_create` for template states/labels/modules/cycles when payload order must win.

**Issue creation pattern** (lines 180-214):

```python
def save(self, *args, **kwargs):
    self._ensure_default_state()
    kwargs = self._sync_completed_at(kwargs)

    if self._state.adding:
        with transaction.atomic():
            lock_key = convert_uuid_to_integer(self.project.id)
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])
            last_sequence = IssueSequence.objects.filter(project=self.project).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            self.sequence_id = last_sequence + 1 if last_sequence else 1
            super(Issue, self).save(*args, **kwargs)
            IssueSequence.objects.create(issue=self, sequence=self.sequence_id, project=self.project)
```

**Explicit-state requirement** (lines 228-236):

```python
def _ensure_default_state(self):
    if self.state is not None:
        return
    default_state = State.objects.filter(~models.Q(is_triage=True), project=self.project, default=True).first()
    self.state = default_state or State.objects.filter(~models.Q(is_triage=True), project=self.project).first()
```

**Relation row pattern**:

`apps/api/plane/db/models/issue.py` lines 543-551:

```python
class IssueLabel(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="label_issue")
    label = models.ForeignKey("db.Label", on_delete=models.CASCADE, related_name="label_issue")
```

`apps/api/plane/db/models/module.py` lines 152-168 and `apps/api/plane/db/models/cycle.py` lines 104-124 define `ModuleIssue` and `CycleIssue`. Existing serializers bulk-create relation rows, e.g. `apps/api/plane/api/serializers/issue.py` lines 213-228:

```python
IssueLabel.objects.bulk_create(
    [
        IssueLabel(
            label_id=label_id,
            issue=issue,
            project_id=project_id,
            workspace_id=workspace_id,
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )
        for label_id in labels
    ],
    batch_size=10,
)
```

**Apply guidance:** Re-run `validate_project_template_payload(payload)` before any template writes. Build key maps (`state_key`, `label_key`, `module_key`, `cycle_key`) from newly created objects. Raise on every missing key; do not use `ignore_conflicts=True` for template reference rows.

---

### `apps/api/plane/app/serializers/project.py` (serializer, request-response validation)

**Analog:** `apps/api/plane/app/serializers/project.py`

**Imports pattern** (lines 5-27):

```python
from rest_framework import serializers
import re

from .base import BaseSerializer, DynamicBaseSerializer
from django.db.models import Max
from plane.db.models import Project, ProjectMember, ProjectIdentifier, IssueSequence
from plane.utils.content_validator import validate_html_content
```

**Validation pattern** (lines 39-88):

```python
def validate_name(self, name):
    project_id = self.instance.id if self.instance else None
    workspace_id = self.context["workspace_id"]
    if re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, name):
        raise serializers.ValidationError(detail="PROJECT_NAME_CANNOT_CONTAIN_SPECIAL_CHARACTERS")
    project = Project.objects.filter(name=name, workspace_id=workspace_id)
    if project_id:
        project = project.exclude(id=project_id)
    if project.exists():
        raise serializers.ValidationError(detail="PROJECT_NAME_ALREADY_EXIST")
    return name

def validate(self, data):
    if "description_html" in data and data["description_html"]:
        is_valid, error_msg, sanitized_html = validate_html_content(str(data["description_html"]))
        if sanitized_html is not None:
            data["description_html"] = sanitized_html
        if not is_valid:
            raise serializers.ValidationError({"error": "html content is not valid"})
    return data
```

**Create pattern** (lines 90-97):

```python
def create(self, validated_data):
    workspace_id = self.context["workspace_id"]
    project = Project.objects.create(**validated_data, workspace_id=workspace_id)
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace_id=workspace_id)
    return project
```

**Apply guidance:** Add `template_id` as an explicit `write_only` field. Omitted/null should pass through as no template; blank string must produce serializer 400. Pop it before model creation or let the service consume it before calling project creation.

---

### `apps/api/plane/app/views/project/base.py` (controller, request-response)

**Analog:** `apps/api/plane/app/views/project/base.py`

**Permission/auth pattern** (lines 257-263):

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def create(self, request, slug):
    workspace = Workspace.objects.get(slug=slug)

    serializer = ProjectSerializer(data={**request.data}, context={"workspace_id": workspace.id})
    if serializer.is_valid():
        serializer.save()
```

**Existing no-template scaffolding** (lines 265-295):

```python
ProjectMember.objects.create(project_id=serializer.data["id"], member=request.user, role=ROLE.ADMIN.value)

if serializer.data["project_lead"] is not None and str(serializer.data["project_lead"]) != str(request.user.id):
    ProjectMember.objects.create(
        project_id=serializer.data["id"],
        member_id=serializer.data["project_lead"],
        role=ROLE.ADMIN.value,
    )

State.objects.bulk_create(
    [
        State(
            name=state["name"],
            color=state["color"],
            project=serializer.instance,
            sequence=state["sequence"],
            workspace=serializer.instance.workspace,
            group=state["group"],
            default=state.get("default", False),
            created_by=request.user,
        )
        for state in DEFAULT_STATES
    ]
)
```

**Response pattern** (lines 297-312):

```python
project = self.get_queryset().filter(pk=serializer.data["id"]).first()
serializer = ProjectListSerializer(project)
return Response(serializer.data, status=status.HTTP_201_CREATED)
return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**Apply guidance:** Keep the existing permission decorator. Delegate creation to `project_creation.py`, then return `ProjectListSerializer(project)` to preserve app response shape.

---

### `apps/api/plane/api/serializers/project.py` (serializer, request-response validation)

**Analog:** `apps/api/plane/api/serializers/project.py`

**Create serializer field pattern** (lines 71-105):

```python
class Meta:
    model = Project
    fields = [
        "name",
        "description",
        "project_lead",
        "default_assignee",
        "identifier",
        "icon_prop",
        "emoji",
        "cover_image",
        "module_view",
        "cycle_view",
        "issue_views_view",
        "page_view",
        "intake_view",
        "guest_view_all_features",
        "archive_in",
        "close_in",
        "timezone",
        "external_source",
        "external_id",
        "is_issue_type_enabled",
        "is_time_tracking_enabled",
    ]
```

**Workspace member validation pattern** (lines 117-140):

```python
project_lead = data.get("project_lead")
if (
    project_lead
    and not WorkspaceMember.objects.filter(
        workspace_id=self.context["workspace_id"],
        member=project_lead,
        is_active=True,
    ).exists()
):
    raise serializers.ValidationError({"project_lead": "The provided user is not a member of this workspace."})
```

**Create pattern** (lines 142-162):

```python
def create(self, validated_data):
    identifier = validated_data.get("identifier", "").strip().upper()
    if identifier == "":
        raise serializers.ValidationError(detail="Project Identifier is required")
    if ProjectIdentifier.objects.filter(name=identifier, workspace_id=self.context["workspace_id"]).exists():
        raise serializers.ValidationError(detail="Project Identifier is taken")
    project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
    return project
```

**Apply guidance:** If v1 API is in scope, add the same `template_id` field/blank validation to `ProjectCreateSerializer`. Keep `ProjectIdentifier` behavior aligned with the current v1 create flow.

---

### `apps/api/plane/api/views/project.py` (controller, request-response)

**Analog:** `apps/api/plane/api/views/project.py`

**OpenAPI request pattern** (lines 197-214):

```python
@project_docs(
    operation_id="create_project",
    summary="Create project",
    description="Create a new project in the workspace with default states and member assignments.",
    request=OpenApiRequest(
        request=ProjectCreateSerializer,
        examples=[PROJECT_CREATE_EXAMPLE],
    ),
    responses={
        201: OpenApiResponse(description="Project created successfully", response=ProjectSerializer),
        404: WORKSPACE_NOT_FOUND_RESPONSE,
        409: PROJECT_NAME_TAKEN_RESPONSE,
    },
)
def post(self, request, slug):
```

**Controller pattern:** Use the `project_creation.py` service and preserve v1 response serialization with `ProjectSerializer(project)` (lines 294-295).

---

### `apps/api/plane/tests/unit/services/test_project_template_apply.py` (test, transform + CRUD)

**Analog:** `apps/api/plane/tests/unit/serializers/test_project_template.py`

**Fixture pattern** (lines 19-71):

```python
def _valid_payload():
    return {
        "schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION,
        "states": [
            {"state_key": "backlog", "name": "Backlog", "color": "#60646C", "group": "backlog", "sequence": 15000, "default": True},
            {"state_key": "todo", "name": "Todo", "color": "#3F76FF", "group": "unstarted", "sequence": 25000},
        ],
        "labels": [{"label_key": "bug", "name": "Bug", "color": "#F59E0B", "order": 100}],
        "modules": [{"module_key": "core", "name": "Core", "status": "planned"}],
        "cycles": [{"cycle_key": "sprint-1", "name": "Sprint 1"}],
        "starter_issues": [
            {"name": "First issue", "state_key": "backlog", "label_keys": ["bug"], "module_key": "core", "cycle_key": "sprint-1", "priority": "medium"}
        ],
    }
```

**Unit test style** (lines 74-84, 143-149):

```python
@pytest.mark.unit
class TestProjectTemplateSerializer:
    @pytest.mark.django_db
    def test_payload_helper_accepts_minimal_valid_payload(self):
        payload = _valid_payload()
        result = validate_project_template_payload(payload)
        assert result == payload

    @pytest.mark.django_db
    def test_payload_helper_rejects_dangling_starter_issue_state(self):
        payload = _valid_payload()
        payload["starter_issues"][0]["state_key"] = "missing-state"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)
```

**Apply guidance:** New service unit tests should assert generated states/labels/modules/cycles/issues and hard-failure on dangling keys. Include relative date resolution and explicit issue state assertions.

---

### `apps/api/plane/tests/contract/app/test_project_template_creation_app.py` (test, request-response)

**Analog:** `apps/api/plane/tests/contract/app/test_project_app.py`

**URL helper pattern** (lines 20-44):

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

**Create assertions pattern** (lines 61-98):

```python
response = session_client.post(url, project_data, format="json")
assert response.status_code == status.HTTP_201_CREATED

assert Project.objects.count() == 1
project = Project.objects.get(name=project_data["name"])
assert project.workspace == workspace
assert ProjectMember.objects.count() == 1
assert ProjectUserProperty.objects.filter(project=project, user=user).exists()

states = State.objects.filter(project=project)
assert states.count() == 5
```

**Permission pattern** (lines 126-143):

```python
guest_user = User.objects.create_user(email="guest@example.com", username="guest")
WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5)
session_client.force_authenticate(user=guest_user)
response = session_client.post(url, project_data, format="json")
assert response.status_code == status.HTTP_403_FORBIDDEN
assert Project.objects.count() == 0
```

**Template fixture pattern:** Use `apps/api/plane/tests/contract/app/test_project_templates_app.py` lines 28-51 to seed built-ins and lines 149-174 for a minimal valid custom payload.

---

### `apps/api/plane/tests/contract/api/test_projects.py` (test, request-response)

**Analog:** `apps/api/plane/tests/contract/api/test_projects.py`

**v1 URL and baseline create pattern** (lines 45-82):

```python
@pytest.mark.contract
class TestProjectListCreateAPIEndpoint:
    def get_url(self, workspace_slug):
        return f"/api/v1/workspaces/{workspace_slug}/projects/"

    @pytest.mark.django_db
    def test_create_project_with_lead_as_creator(self, api_key_client, workspace, create_user):
        response = api_key_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        assert State.objects.filter(project=project).count() == 5
```

**Rollback pattern** (lines 145-184):

```python
forced_error = RuntimeError("forced failure for rollback test")

with (
    mock.patch("plane.api.views.project.State.objects.bulk_create", side_effect=forced_error),
    mock.patch("plane.api.views.project.model_activity") as mocked_activity,
):
    response = api_key_client.post(url, payload, format="json")

assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
assert Project.objects.count() == 0
assert ProjectMember.objects.count() == 0
assert State.objects.count() == 0
mocked_activity.delay.assert_not_called()
```

**Robust activity pattern** (lines 186-216):

```python
@pytest.mark.django_db(transaction=True)
def test_response_still_201_when_broker_dispatch_fails(self, api_key_client, workspace, create_user):
    with mock.patch("plane.api.views.project.model_activity") as mocked_activity:
        mocked_activity.delay.side_effect = RuntimeError("broker unavailable")
        response = api_key_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    project = Project.objects.get(id=response.data["id"])
    assert ProjectMember.objects.filter(project=project).count() == 1
    assert State.objects.filter(project=project).count() == 5
    mocked_activity.delay.assert_called_once()
```

## Shared Patterns

### Authentication And Permissions

**Source:** `apps/api/plane/app/views/project/base.py` lines 257-258 and `apps/api/plane/app/views/workspace/project_template.py` lines 78-85  
**Apply to:** App project create and template availability tests.

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def create(self, request, slug):
    ...

@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
def create(self, request, slug):
    ...
```

### Template Availability

**Source:** `apps/api/plane/app/views/workspace/project_template.py` lines 33-40 and 60-69  
**Apply to:** `project_creation.py` template resolver.

```python
return ProjectTemplate.objects.filter(
    Q(workspace__slug=self.kwargs.get("slug"), is_active=True, is_system=False)
    | Q(is_system=True, is_active=True, workspace__isnull=True)
).distinct()

if candidate.workspace_id is None or candidate.workspace.slug != slug or not candidate.is_active:
    return None, Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
```

For Phase 2, use one generic 404 for missing, inactive, or foreign templates. Built-ins are usable when `is_system=True`, `is_active=True`, and `workspace__isnull=True`; custom templates are usable only in the current workspace when active.

### Default State Creation

**Source:** `apps/api/plane/app/views/project/base.py` lines 281-295 and `apps/api/plane/api/views/project.py` lines 248-262  
**Apply to:** No-template branch only.

```python
State.objects.bulk_create(
    [
        State(
            name=state["name"],
            color=state["color"],
            project=serializer.instance,
            sequence=state["sequence"],
            workspace=serializer.instance.workspace,
            group=state["group"],
            default=state.get("default", False),
            created_by=request.user,
        )
        for state in DEFAULT_STATES
    ]
)
```

### Transaction And Activity Safety

**Source:** `apps/api/plane/api/views/project.py` lines 227-292  
**Apply to:** Both app and v1 project creation paths.

```python
with transaction.atomic():
    ...
    transaction.on_commit(_dispatch_model_activity, robust=True)
```

### Validation Error Shape

**Source:** `apps/api/plane/api/serializers/project.py` lines 117-130 and `apps/api/plane/app/serializers/project_template.py` lines 574-576  
**Apply to:** `template_id` serializer validation and stale payload validation.

```python
raise serializers.ValidationError({"project_lead": "The provided user is not a member of this workspace."})

if errors:
    raise serializers.ValidationError(errors)
```

## No Analog Found

No file lacks a usable codebase analog. The two new service files have no same-role `plane.app.services` analog because that package does not exist yet, so their assignments above intentionally compose from existing project view, serializer, model, and test patterns.

## Metadata

**Analog search scope:** `apps/api/plane/app`, `apps/api/plane/api`, `apps/api/plane/db/models`, `apps/api/plane/tests`
**Files scanned:** 18 targeted files plus `rg` role searches
**Pattern extraction date:** 2026-06-30
