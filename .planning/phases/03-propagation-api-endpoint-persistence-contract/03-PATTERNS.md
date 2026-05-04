# Phase 3: Propagation API Endpoint, Persistence & Contract — Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 7 (3 NEW, 4 UPDATED)
**Analogs found:** 6 / 7 (1 has "no analog — first usage in codebase")

This map is the consumed input for `gsd-planner`. Every pattern below is anchored to a concrete `<file>:<line>` excerpt from the existing codebase or, where no codebase analog exists, to Phase 2 surface or Django 4.2 docs (explicitly marked).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/plane/app/views/issue/timeline_propagation.py` (NEW) | controller (DRF view) | request-response, transactional CRUD | `apps/api/plane/app/views/issue/base.py:1093-1170` (`IssueBulkUpdateDateEndpoint`) | role-match (POST + bulk_update + per-issue activity loop); diverges on `transaction.atomic`, `select_for_update`, `transaction.on_commit`, and `{code, message}` envelope |
| `apps/api/plane/app/serializers/timeline_propagation.py` (NEW) | serializer (DRF) | request-response | `apps/api/plane/app/serializers/issue.py:82-114` (`IssueCreateSerializer`) | role-match (typed fields with `UUIDField`/`DateField`/`DateTimeField`); structural-only validation (no semantic `validate()`) |
| `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (NEW) | test (pytest contract) | request-response | `apps/api/plane/tests/contract/app/test_project_app.py:1-150` | exact (same `@pytest.mark.contract` + `@pytest.mark.django_db` + `session_client` shape) |
| `apps/api/plane/app/urls/issue.py` (UPDATED) | route registration | URL → view | `apps/api/plane/app/urls/issue.py:251-255` (`issue-dates` registration) | exact (same module, same path-style, same `name=` convention) |
| `apps/api/plane/app/views/__init__.py` (UPDATED) | re-export barrel | static | `apps/api/plane/app/views/__init__.py:118-129` (existing `from .issue.base import (...)`) | exact |
| `apps/api/plane/app/serializers/__init__.py` (UPDATED) | re-export barrel | static | `apps/api/plane/app/serializers/__init__.py:55-80` (existing `from .issue import (...)`) | exact |
| `apps/api/plane/tests/factories.py` (UPDATED) | test factory (factory_boy) | static | `apps/api/plane/tests/factories.py:74-85` (`ProjectMemberFactory`) | role-match (extend the same module's existing `DjangoModelFactory` shape) |

---

## Pattern Assignments

### `apps/api/plane/app/views/issue/timeline_propagation.py` (controller, request-response)

**Analog:** `apps/api/plane/app/views/issue/base.py:1093-1170` (`IssueBulkUpdateDateEndpoint`)

#### Imports pattern (mirrored from `views/issue/base.py:1-77` selectively)

```python
# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import F
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.app.serializers import (
    TimelinePropagationRequestSerializer,
    TimelinePropagationResponseSerializer,
)
from plane.app.services.timeline_propagation import (
    MoveIntent,
    PropagationErrorCode,
    ScheduledWorkItem,
    load_precedence_graph,
    propagate_move,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import Issue, IssueRelation, ProjectMember
from plane.utils.host import base_host

from ..base import BaseAPIView
```

Notes:
- `from plane.app.permissions import ROLE` — drop `allow_permission` per CONTEXT D-02; the decorator's `{"error": ...}` envelope is incompatible with `{code, message}`.
- `from plane.app.services.timeline_propagation import …` — barrel import only (CONTEXT D-12). Never import from `.scheduling` / `.propagation` / `.types` directly.
- `from ..base import BaseAPIView` — same relative-import idiom used by every other `views/issue/*.py` module (see `views/issue/base.py:77`).

#### Class skeleton pattern (mirrors `IssueBulkUpdateDateEndpoint`, base.py:1093 + 1113-1114)

Existing analog (lines 1093-1114):

```python
class IssueBulkUpdateDateEndpoint(BaseAPIView):
    def validate_dates(self, current_start, current_target, new_start, new_target):
        ...

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        updates = request.data.get("updates", [])
        ...
```

Phase 3 deviates (no decorator, inline membership check):

```python
class TimelinePropagationView(BaseAPIView):
    """Owner of the {code, message} wire contract for Dependency Schedule Propagation.

    Deliberately does NOT stack @allow_permission([ROLE.ADMIN, ROLE.MEMBER]) — see
    CONTEXT.md D-02. The shared decorator returns Response({"error": "..."}, 403),
    which would break the stable failure envelope (API-05, ERR-06).
    """

    def post(self, request, slug, project_id):
        ...
```

#### HTTP-status-by-code mapping (single source of truth — RESEARCH §"Common Operation 4")

```python
STATUS_BY_CODE: dict[PropagationErrorCode, int] = {
    PropagationErrorCode.PERMISSION_DENIED: status.HTTP_403_FORBIDDEN,
    PropagationErrorCode.SCHEDULE_CHANGED: status.HTTP_409_CONFLICT,
    PropagationErrorCode.DEPENDENCY_CYCLE: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.INCOMPLETE_SCHEDULE: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PropagationErrorCode.INVALID_DATE_RANGE: status.HTTP_422_UNPROCESSABLE_ENTITY,
}


def _error(code: PropagationErrorCode, message: str) -> Response:
    return Response({"code": code.value, "message": message}, status=STATUS_BY_CODE[code])
```

Notes:
- `_error(...)` is module-private (single underscore prefix). One helper, one envelope shape, one assertion target.
- No `status=` parameter to `_error(...)` — the table is the only source of truth (CONTEXT D-03 wire contract).

#### Inline membership check pattern (mirrors `permissions/base.py:53-59`, applied inline)

Existing analog (`permissions/base.py:53-59`):

```python
is_user_has_allowed_role = ProjectMember.objects.filter(
    member=request.user,
    workspace__slug=kwargs["slug"],
    project_id=kwargs["project_id"],
    role__in=allowed_role_values,
    is_active=True,
).exists()
```

Phase 3 mirror (inline at top of `post`, same filter shape, GUEST excluded):

```python
is_member = ProjectMember.objects.filter(
    member=request.user,
    workspace__slug=slug,
    project_id=project_id,
    role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
    is_active=True,
).exists()
if not is_member:
    return _error(
        PropagationErrorCode.PERMISSION_DENIED,
        "You don't have the required permissions.",
    )
```

Notes:
- Workspace-admin fallback (`permissions/base.py:64-78`) is intentionally NOT mirrored (CONTEXT D-02b — least privilege for write).
- `IssueDetailIdentifierEndpoint` at `views/issue/base.py:1208-1217` does the same shape of inline check (`.exists()` → 403) — confirming the idiom is established.

#### Transaction + select_for_update pattern (NO codebase analog — first usage of `transaction.on_commit` and only one `select_for_update` to mirror)

Closest existing `select_for_update` use across the codebase: NONE in `apps/api/plane/app/views/`. RESEARCH.md confirms zero prior `transaction.on_commit` usage in `apps/api/plane`. This is genuinely net-new.

Cite Django 4.2 docs in the module docstring:
- https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit
- https://docs.djangoproject.com/en/4.2/ref/models/querysets/#select-for-update

Phase 3 implementation (from RESEARCH §"Pattern 3" + CONTEXT D-05):

```python
now = timezone.now()  # CAPTURED ONCE (CONTEXT D-05a)

# ... serializer parse + permission check OUTSIDE the transaction ...

with transaction.atomic():
    try:
        Issue.issue_objects.select_for_update().get(
            id=move_intent.work_item_id,
            workspace__slug=slug,
            project_id=project_id,
        )
    except Issue.DoesNotExist:
        return _error(
            PropagationErrorCode.PERMISSION_DENIED,
            "You don't have the required permissions.",
        )  # info-leak prevention (CONTEXT D-05c)

    # IssueRelation queryset with cross-project annotation (CONTEXT D-11)
    relations = (
        IssueRelation.objects
        .filter(project_id=project_id, deleted_at__isnull=True)
        .annotate(
            issue_project_id=F("issue__project_id"),
            related_project_id=F("related_issue__project_id"),
        )
        .select_related("issue", "related_issue")
    )
    graph = load_precedence_graph(relations, project_id=project_id)

    # Issue queryset (CONTEXT D-10 belt-and-suspenders; Issue.issue_objects already
    # excludes archived/draft/triage per db/models/issue.py:92-101)
    items = (
        Issue.issue_objects
        .filter(
            workspace__slug=slug,
            project_id=project_id,
            archived_at__isnull=True,
            is_draft=False,
        )
        .only("id", "project_id", "start_date", "target_date", "updated_at")
    )
    work_items_by_id = {
        i.id: ScheduledWorkItem(
            id=i.id,
            project_id=i.project_id,
            start_date=i.start_date,
            target_date=i.target_date,
            updated_at=i.updated_at,
        )
        for i in items
    }

    expected_versions = {move_intent.work_item_id: validated["expected_updated_at"]}
    result = propagate_move(graph, work_items_by_id, move_intent, expected_versions)

    if result.failure is not None:
        return _error(result.failure.code, result.failure.message)

    # success path: bulk_update + on_commit registration (see next section)
```

#### Bulk update + on_commit pattern (mirrors `views/issue/base.py:1142-1168`, wrapped in `on_commit`)

Existing analog (`views/issue/base.py:1141-1168`):

```python
if start_date:
    issue_activity.delay(
        type="issue.activity.updated",
        requested_data=json.dumps({"start_date": update.get("start_date")}),
        current_instance=json.dumps({"start_date": str(issue.start_date)}),
        issue_id=str(issue_id),
        actor_id=str(request.user.id),
        project_id=str(project_id),
        epoch=epoch,
    )
    issue.start_date = start_date
    issues_to_update.append(issue)

if target_date:
    issue_activity.delay(
        type="issue.activity.updated",
        requested_data=json.dumps({"target_date": update.get("target_date")}),
        current_instance=json.dumps({"target_date": str(issue.target_date)}),
        issue_id=str(issue_id),
        actor_id=str(request.user.id),
        project_id=str(project_id),
        epoch=epoch,
    )
    issue.target_date = target_date
    issues_to_update.append(issue)

# Bulk update issues
Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])
```

Phase 3 deviations:

1. **Include `"updated_at"` in `bulk_update` field list** and set `instance.updated_at = now` explicitly (RESEARCH Pitfall 1 — `auto_now=True` does NOT fire under `bulk_update`).
2. **Wrap every `.delay(...)` in `transaction.on_commit(lambda ...)`** with default-arg capture (RESEARCH Pitfall 4 — late-binding loop variables).
3. **`epoch = int(now.timestamp())`** — derive from the same `now` captured at top.
4. **Pre-update snapshot from `work_items_by_id`** — capture `current_instance` BEFORE assignment, since `bulk_update` mutates instance attributes in place.

```python
# Pre-update snapshot for audit/webhook current_instance
pre_update_snapshot = {upd.id: work_items_by_id[upd.id] for upd in result.updates}

# Build instances + bulk_update
instances = []
for upd in result.updates:
    inst = Issue(id=upd.id)
    inst.start_date = upd.start_date
    inst.target_date = upd.target_date
    inst.updated_at = now  # MUST set; auto_now bypassed by bulk_update
    instances.append(inst)

Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])

epoch = int(now.timestamp())
origin = base_host(request=request, is_app=True)

# Per-pair issue_activity (mirrors base.py:1141-1166 shape, on_commit-wrapped)
for inst in instances:
    pre = pre_update_snapshot[inst.id]
    if inst.start_date != pre.start_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre: issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(
                    {"start_date": str(inst.start_date)}, cls=DjangoJSONEncoder
                ),
                current_instance=json.dumps(
                    {"start_date": str(pre.start_date)}, cls=DjangoJSONEncoder
                ),
                issue_id=str(inst.id),
                actor_id=str(request.user.id),
                project_id=str(project_id),
                epoch=epoch,
            )
        )
    if inst.target_date != pre.target_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre: issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(
                    {"target_date": str(inst.target_date)}, cls=DjangoJSONEncoder
                ),
                current_instance=json.dumps(
                    {"target_date": str(pre.target_date)}, cls=DjangoJSONEncoder
                ),
                issue_id=str(inst.id),
                actor_id=str(request.user.id),
                project_id=str(project_id),
                epoch=epoch,
            )
        )

# Per-issue model_activity (mirrors views/module/base.py:708-716 shape, on_commit-wrapped)
for inst in instances:
    pre = pre_update_snapshot[inst.id]
    transaction.on_commit(
        lambda inst=inst, pre=pre: model_activity.delay(
            model_name="issue",
            model_id=str(inst.id),
            requested_data=json.dumps(
                {"start_date": str(inst.start_date), "target_date": str(inst.target_date)},
                cls=DjangoJSONEncoder,
            ),
            current_instance=json.dumps(
                {"start_date": str(pre.start_date), "target_date": str(pre.target_date)},
                cls=DjangoJSONEncoder,
            ),
            actor_id=request.user.id,
            slug=slug,
            origin=origin,
        )
    )
```

#### Success response payload pattern

Mirrors success-response shape used across `BaseAPIView` subclasses (`Response({...}, status=status.HTTP_200_OK)`); 200 not 201 because `bulk_update` is an update, not a create (CONTEXT D-03 / RFC 9110).

```python
return Response(
    {
        "requested_work_item_id": str(move_intent.work_item_id),
        "total_updated_count": len(result.updates),
        "client_preview_count": validated.get("client_preview_count"),
        "work_items": [
            {
                "id": str(upd.id),
                "start_date": upd.start_date.isoformat() if upd.start_date else None,
                "target_date": upd.target_date.isoformat() if upd.target_date else None,
                "updated_at": now.isoformat(),
            }
            for upd in result.updates
        ],
    },
    status=status.HTTP_200_OK,
)
```

#### Error handling pattern (DELEGATE — do not catch operational errors)

`BaseAPIView.handle_exception` at `views/base.py:167-204` already maps:
- `IntegrityError` → `Response({"error": "The payload is not valid"}, 400)`
- `ValidationError` → 400
- `ObjectDoesNotExist` → 404
- generic `Exception` → 500

Phase 3 honors CONTEXT D-13: any exception that is not a typed `PropagationFailure` (e.g., `IntegrityError`, `OperationalError` from `select_for_update`) propagates up to `handle_exception`. The 7 typed codes are domain failures only — operational failures use the generic envelope.

Implication: do **not** wrap `with transaction.atomic():` in a broad `try`/`except` that swallows generic `Exception` into `_error(...)`. Only catch the one targeted `Issue.DoesNotExist` per CONTEXT D-05c.

---

### `apps/api/plane/app/serializers/timeline_propagation.py` (serializer, request-response)

**Analog:** `apps/api/plane/app/serializers/issue.py:82-114` (`IssueCreateSerializer`)

#### Imports pattern (mirrors `serializers/issue.py:1-49`)

```python
# Third Party imports
from rest_framework import serializers
```

Notes:
- These are **plain DRF `Serializer` classes**, not `BaseSerializer`/`ModelSerializer`. The Phase 3 request body has no Django model backing it (CONTEXT D-04 — fields are an RPC envelope, not a model representation), so `BaseSerializer` (`serializers/base.py`) inheritance is not applicable.
- No `from .base import BaseSerializer` import (unlike `serializers/issue.py:15`).
- No model imports (Phase 3 serializers do not declare `Meta.model`).

#### Field declaration pattern (typed-field shape, mirrors fields used in `IssueCreateSerializer`)

Existing analog excerpts from `serializers/issue.py:84-101` for typed-field syntax:

```python
state_id = serializers.PrimaryKeyRelatedField(
    source="state", queryset=State.all_state_objects.all(), required=False, allow_null=True
)
project_id = serializers.UUIDField(source="project.id", read_only=True)
```

Phase 3 request shape (CONTEXT D-04 — structural validation only):

```python
class TimelinePropagationRequestSerializer(serializers.Serializer):
    """Structural validation for POST /timeline-propagation/.

    Semantic checks (date-range validity, duration mismatch, dependency cycle,
    cross-project, etc.) are owned by `propagate_move(...)` per CONTEXT D-04 and
    Phase 2 D-06. NO cross-field `validate(...)` here — it would create a
    duplicate failure surface and bypass the {code, message} envelope.
    """

    work_item_id = serializers.UUIDField(required=True)
    original_start_date = serializers.DateField(required=True)
    original_target_date = serializers.DateField(required=True)
    expected_updated_at = serializers.DateTimeField(required=True)
    requested_start_date = serializers.DateField(required=True)
    requested_target_date = serializers.DateField(required=True)
    operation = serializers.ChoiceField(choices=[("move", "move")], required=True)
    client_preview_count = serializers.IntegerField(required=False, min_value=0)
```

Notes:
- `DateField` defaults to `%Y-%m-%d` (matches Django's `DateField` ISO output).
- `DateTimeField` defaults to ISO 8601 with microseconds (matches Django `auto_now=True` output via `TimeAuditModel`; CONTEXT D-04). **Do not** pass a custom `format=` kwarg.
- `operation` is a one-element enum to pin "move-only" at the parser layer (CONTEXT D-04 / PROP-18 / FE-09). Sending `"resize"` returns DRF default 400 — NOT the `{code, message}` envelope (this is intentional, locks structural-vs-domain split; pinned by `test_serializer_rejects_resize_operation`).
- `client_preview_count` is optional; the view echoes it back in the response only when present.

#### Response & Error serializers (existence for OpenAPI schema only — CONTEXT D-04)

```python
class TimelinePropagationWorkItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    start_date = serializers.DateField(allow_null=True)
    target_date = serializers.DateField(allow_null=True)
    updated_at = serializers.DateTimeField()


class TimelinePropagationResponseSerializer(serializers.Serializer):
    requested_work_item_id = serializers.UUIDField()
    total_updated_count = serializers.IntegerField(min_value=0)
    client_preview_count = serializers.IntegerField(allow_null=True, required=False)
    work_items = TimelinePropagationWorkItemSerializer(many=True)


class TimelinePropagationErrorSerializer(serializers.Serializer):
    code = serializers.ChoiceField(
        choices=[(c.value, c.value) for c in PropagationErrorCode]
    )
    message = serializers.CharField()
```

Notes:
- `TimelinePropagationErrorSerializer` is **not invoked at runtime** — the view crafts the failure dict directly via `_error(...)` (CONTEXT D-04). It exists for `drf-spectacular` schema generation.
- `from plane.app.services.timeline_propagation import PropagationErrorCode` is required for the choices enumeration.

---

### `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (test, request-response)

**Analog:** `apps/api/plane/tests/contract/app/test_project_app.py:1-150`

#### Imports + decorators pattern (mirrors `test_project_app.py:1-17, 47-52`)

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse
from rest_framework import status

from plane.app.services.timeline_propagation import PropagationErrorCode
from plane.tests.factories import (
    IssueFactory,
    IssueRelationFactory,
    ProjectFactory,
    ProjectMemberFactory,
    StateFactory,
    WorkspaceFactory,
)


@pytest.mark.contract
class TestTimelinePropagation:
    """Contract tests for POST /timeline-propagation/ (Phase 3).

    The 7 typed PropagationErrorCode envelopes use the {code, message} shape and
    fixed HTTP status codes (CONTEXT.md D-03). DRF parser failures (missing
    field, malformed UUID/date, operation != "move") return DRF default 400 with
    the DRF default body — NOT envelope-shaped. See pitfall 8.
    """

    @pytest.mark.django_db
    def test_unauthenticated_request_returns_401(self, api_client, workspace):
        ...

    @pytest.mark.django_db
    def test_non_member_returns_permission_denied_403(self, session_client, workspace):
        ...
```

Notes:
- `reverse("project-timeline-propagation", kwargs={"slug": slug, "project_id": pid})` is the canonical URL builder (RESEARCH "Don't Hand-Roll" — `project-timeline-propagation` is a unique URL name unlike `project-issue`, so `reverse` works without the duplicate-name workaround at `test_project_app.py:22-44`).
- `session_client` fixture (`tests/conftest.py:67-71`) authenticates as `create_user`; for non-member tests, fetch a separate `User`/`force_authenticate` shape similar to `test_project_app.py:131-132`.
- `api_client` (unauthenticated) fixture from `conftest.py:19-22` is used for the 401 test.
- One test per error code per CONTEXT D-14 (don't over-parameterize).

#### Test case shape pattern (mirrors `test_project_app.py:51-97`)

```python
@pytest.mark.django_db
def test_chain_propagation_returns_200_with_full_payload(self, session_client, workspace):
    project = ProjectFactory(workspace=workspace)
    ProjectMemberFactory(project=project, member=workspace.owner, role=20)
    state = StateFactory(project=project)
    a = IssueFactory(project=project, state=state, start_date="2026-01-01", target_date="2026-01-02")
    b = IssueFactory(project=project, state=state, start_date="2026-01-03", target_date="2026-01-04")
    c = IssueFactory(project=project, state=state, start_date="2026-01-05", target_date="2026-01-06")
    IssueRelationFactory(project=project, issue=b, related_issue=a)  # b blocked_by a
    IssueRelationFactory(project=project, issue=c, related_issue=b)  # c blocked_by b

    url = reverse(
        "project-timeline-propagation",
        kwargs={"slug": workspace.slug, "project_id": project.id},
    )
    response = session_client.post(url, {
        "work_item_id": str(a.id),
        "original_start_date": "2026-01-01",
        "original_target_date": "2026-01-02",
        "expected_updated_at": a.updated_at.isoformat(),
        "requested_start_date": "2026-01-10",
        "requested_target_date": "2026-01-11",
        "operation": "move",
    }, format="json")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["total_updated_count"] == 3
    # All updated_at values share the single now (CONTEXT D-05a / D-05f)
    timestamps = {item["updated_at"] for item in body["work_items"]}
    assert len(timestamps) == 1
```

#### `transaction.on_commit` regression test pattern (RESEARCH Pitfall 9)

`pytest.mark.django_db` rolls back the test transaction — `on_commit` callbacks NEVER fire. To assert the registration without waiting for commit, monkeypatch `transaction.on_commit` to invoke immediately:

```python
@pytest.mark.django_db
def test_activity_tasks_registered_on_commit(self, mocker, session_client, ...):
    on_commit_spy = mocker.patch(
        "plane.app.views.issue.timeline_propagation.transaction.on_commit",
        side_effect=lambda fn: fn(),
    )
    delay_spy = mocker.patch(
        "plane.app.views.issue.timeline_propagation.issue_activity.delay"
    )
    response = session_client.post(url, valid_payload, format="json")
    assert response.status_code == 200
    assert on_commit_spy.call_count >= len(expected_updates)
    assert delay_spy.call_count >= len(expected_updates)
```

Patch path is `plane.app.views.issue.timeline_propagation.transaction` (the imported module name in the view) NOT `django.db.transaction` (would not intercept the local rebound name).

---

### `apps/api/plane/app/urls/issue.py` (UPDATED — route registration)

**Analog:** `apps/api/plane/app/urls/issue.py:251-255` (existing `issue-dates` registration)

#### Existing analog excerpt (lines 251-260, the seam)

```python
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/issue-dates/",
    IssueBulkUpdateDateEndpoint.as_view(),
    name="project-issue-dates",
),
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/versions/",
    IssueVersionEndpoint.as_view(),
    name="issue-versions",
),
```

#### Phase 3 insertion (between line 255 and line 256, per CONTEXT D-01)

```python
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/issue-dates/",
    IssueBulkUpdateDateEndpoint.as_view(),
    name="project-issue-dates",
),
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/timeline-propagation/",
    TimelinePropagationView.as_view(),
    name="project-timeline-propagation",
),
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/versions/",
    IssueVersionEndpoint.as_view(),
    name="issue-versions",
),
```

#### Import addition (mirrors lines 7-34 of the same file)

```python
from plane.app.views import (
    ...,
    IssueBulkUpdateDateEndpoint,
    IssueVersionEndpoint,
    ...,
    TimelinePropagationView,        # ADD (alphabetic placement; matches existing convention)
    WorkItemDescriptionVersionEndpoint,
    ...,
)
```

Notes:
- The existing import block does not enforce strict alphabetical order (e.g., `IssueBulkUpdateDateEndpoint` precedes `IssueVersionEndpoint` precedes `WorkItemDescriptionVersionEndpoint`). Add `TimelinePropagationView` between `IssueDetailIdentifierEndpoint` and the workspace items, or at end of block — either is consistent with existing style.

---

### `apps/api/plane/app/views/__init__.py` (UPDATED — re-export barrel)

**Analog:** `apps/api/plane/app/views/__init__.py:118-129` (existing `from .issue.base import (...)` block)

#### Existing analog excerpt (lines 118-132)

```python
from .issue.base import (
    IssueListEndpoint,
    IssueViewSet,
    ProjectUserDisplayPropertyEndpoint,
    BulkDeleteIssuesEndpoint,
    DeletedIssuesListViewSet,
    IssuePaginatedViewSet,
    IssueDetailEndpoint,
    IssueBulkUpdateDateEndpoint,
    IssueMetaEndpoint,
    IssueDetailIdentifierEndpoint,
)

from .issue.activity import IssueActivityEndpoint
```

#### Phase 3 addition (mirror the per-submodule import line idiom — see lines 131, 133, 141, 143, 145, 147, 149, 151, 153, 155)

```python
from .issue.timeline_propagation import TimelinePropagationView
```

Add anywhere in the `from .issue.* import ...` block (e.g., after `from .issue.subscriber import IssueSubscriberViewSet` at line 153). Style precedent: each submodule has its own one-line import.

---

### `apps/api/plane/app/serializers/__init__.py` (UPDATED — re-export barrel)

**Analog:** `apps/api/plane/app/serializers/__init__.py:55-80` (existing `from .issue import (...)` block)

#### Phase 3 addition (mirror the existing per-module import idiom)

```python
from .timeline_propagation import (
    TimelinePropagationErrorSerializer,
    TimelinePropagationRequestSerializer,
    TimelinePropagationResponseSerializer,
    TimelinePropagationWorkItemSerializer,
)
```

Place after the `.issue` import block (lines 55-80) for narrative cohesion ("issue serializers, then issue-adjacent timeline serializers").

---

### `apps/api/plane/tests/factories.py` (UPDATED — factory_boy factories)

**Analog:** `apps/api/plane/tests/factories.py:74-85` (`ProjectMemberFactory`)

#### Existing pattern (lines 1-85)

```python
import factory
from uuid import uuid4
from django.utils import timezone

from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember


class ProjectMemberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectMember

    id = factory.LazyFunction(uuid4)
    project = factory.SubFactory(ProjectFactory)
    member = factory.SubFactory(UserFactory)
    role = 20  # Admin role by default
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
```

#### Phase 3 additions (mirror the same `DjangoModelFactory` shape; CONTEXT D-14)

```python
from plane.db.models import (
    Issue,
    IssueRelation,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


class StateFactory(factory.django.DjangoModelFactory):
    """Factory for creating State instances. Required because Issue.save()
    auto-assigns a default State if absent (db/models/issue.py:178-202), which
    triggers a State.objects query and is awkward in tests."""

    class Meta:
        model = State

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"State {n}")
    color = "#000000"
    project = factory.SubFactory(ProjectFactory)
    workspace = factory.SelfAttribute("project.workspace")
    group = "backlog"  # StateGroup.BACKLOG.value — non-triage so IssueManager keeps it
    default = True
    created_by = factory.SelfAttribute("project.created_by")
    updated_by = factory.SelfAttribute("project.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class IssueFactory(factory.django.DjangoModelFactory):
    """Factory for creating Issue instances with a usable State + sequence_id.

    Issue.save() acquires a per-project advisory lock and computes a sequence
    (db/models/issue.py:204-234), so factories MUST flow through .save() (which
    DjangoModelFactory does by default). DO NOT bypass with bulk_create."""

    class Meta:
        model = Issue

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Issue {n}")
    project = factory.SubFactory(ProjectFactory)
    workspace = factory.SelfAttribute("project.workspace")
    state = factory.SubFactory(StateFactory, project=factory.SelfAttribute("..project"))
    created_by = factory.SelfAttribute("project.created_by")
    updated_by = factory.SelfAttribute("project.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
    # start_date / target_date / is_draft / archived_at left to test override


class IssueRelationFactory(factory.django.DjangoModelFactory):
    """Factory for creating IssueRelation instances. Default relation_type is
    'blocked_by' — the only type the precedence-graph loader honors per Phase 1
    D-04 (db/models/issue.py:263-281)."""

    class Meta:
        model = IssueRelation

    id = factory.LazyFunction(uuid4)
    issue = factory.SubFactory(IssueFactory)
    related_issue = factory.SubFactory(IssueFactory)
    project = factory.SelfAttribute("issue.project")
    workspace = factory.SelfAttribute("issue.workspace")
    relation_type = "blocked_by"
    created_by = factory.SelfAttribute("issue.created_by")
    updated_by = factory.SelfAttribute("issue.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
```

Notes:
- `ProjectFactory` (existing, lines 58-71) already has `created_by` / `updated_by` resolved to `workspace.owner`; the new factories chain through that.
- `factory.SelfAttribute("project.workspace")` resolves the parent's workspace consistently — required because `Issue` and `IssueRelation` are both `ProjectBaseModel` subclasses with `workspace` and `project` FKs.
- Default `relation_type="blocked_by"` is the loader's only honored type (Phase 1 D-04). Tests that need `relates_to`/`duplicate` etc. override per-call.

---

## Shared Patterns

### Authentication & permission baseline

**Source:** `apps/api/plane/app/views/base.py:149-154` (`BaseAPIView`)

```python
class BaseAPIView(TimezoneMixin, ReadReplicaControlMixin, APIView, BasePaginator):
    permission_classes = [IsAuthenticated]
    authentication_classes = [BaseSessionAuthentication]
```

**Apply to:** `TimelinePropagationView` — inherit unchanged. DRF returns 401 for anonymous requests automatically; no custom logic.

### `{code, message}` envelope helper

**Source:** This phase introduces the helper. Apply it consistently — every domain-failure path in the view returns `_error(code, message)`. Never construct ad-hoc `Response({"code": ..., "message": ...}, status=...)` payloads in scattered branches.

```python
def _error(code: PropagationErrorCode, message: str) -> Response:
    return Response({"code": code.value, "message": message}, status=STATUS_BY_CODE[code])
```

**Apply to:** every failure branch in `TimelinePropagationView.post`:
- inline membership check fail → `PERMISSION_DENIED`
- `Issue.DoesNotExist` on `select_for_update` → `PERMISSION_DENIED`
- `result.failure is not None` → `result.failure.code`

### JSON serialization for `requested_data` / `current_instance`

**Source:** `apps/api/plane/app/views/issue/base.py:1144` (existing pattern)

```python
import json
from django.core.serializers.json import DjangoJSONEncoder

json.dumps({"start_date": str(value)}, cls=DjangoJSONEncoder)
```

**Apply to:** every `issue_activity.delay(...)` and `model_activity.delay(...)` call's `requested_data` and `current_instance` kwargs. `DjangoJSONEncoder` handles `datetime`/`date`/`UUID`/`Decimal` correctly.

### `transaction.on_commit` lambda capture

**Source:** No codebase analog (first usage). Django 4.2 docs + RESEARCH Pitfall 4.

```python
for inst in instances:
    transaction.on_commit(
        lambda inst=inst, pre=pre_update_snapshot[inst.id]: task.delay(...)
    )
```

**Apply to:** every `.delay(...)` registration in the view. ALWAYS use default-arg capture (`lambda inst=inst, pre=pre: ...`) — never bare closure (`lambda: task.delay(inst.id)`) because Python lambdas late-bind loop variables.

### Status-by-code mapping (single source of truth)

**Source:** RESEARCH §"Common Operation 4" (this phase introduces).

**Apply to:** `_error(...)`. Never inline `status=403` / `status=409` / `status=422` literals at call sites — always look up via `STATUS_BY_CODE[code]` so the wire-mapping table is the only source of truth.

---

## No Analog Found

| Concern | Why no analog | Source to cite instead |
|---------|---------------|------------------------|
| `transaction.on_commit(lambda: task.delay(...))` | RESEARCH.md verifies zero `transaction.on_commit` usage anywhere in `apps/api/plane`. Phase 3 is the first occurrence. | Django 4.2 docs: https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit |
| `select_for_update()` on a single `Issue` row | No usage in `apps/api/plane/app/views/`. The `Issue.save()` pattern at `db/models/issue.py:204-234` uses `pg_advisory_xact_lock` — different lock mechanism, not the analog Phase 3 needs. | Django 4.2 docs: https://docs.djangoproject.com/en/4.2/ref/models/querysets/#select-for-update |
| `Issue.objects.bulk_update(..., ["start_date", "target_date", "updated_at"])` (with `updated_at` in the field list) | Existing `IssueBulkUpdateDateEndpoint` (`base.py:1168`) does NOT include `updated_at` — RESEARCH Pitfall 6 documents this as a latent bug. Phase 3 deliberately diverges. | Django 4.2 docs on `bulk_update` + `pre_save` not firing |
| `{code, message}` envelope shape | All existing 4xx responses across `apps/api/plane/app/views/` use `{"error": "..."}` shape. `{code, message}` is the new wire contract this phase introduces (US-22, US-37, API-05). | CONTEXT.md D-03 / `services/timeline_propagation/errors.py:22-31` (`PropagationErrorCode` enum is the canonical code source) |

The planner should call out each of these in the implementation plan as a "first-of-its-kind in this codebase" pattern with a citation in the module docstring (CONTEXT D-13 / D-15).

---

## Metadata

**Analog search scope:**
- `apps/api/plane/app/views/issue/` (full directory)
- `apps/api/plane/app/views/module/base.py` (for `model_activity.delay` shape)
- `apps/api/plane/app/views/base.py` (`BaseAPIView`)
- `apps/api/plane/app/permissions/base.py` (decorator for inline-check shape)
- `apps/api/plane/app/serializers/issue.py` + `__init__.py`
- `apps/api/plane/app/urls/issue.py`
- `apps/api/plane/app/services/timeline_propagation/__init__.py` + `errors.py`
- `apps/api/plane/app/views/__init__.py`
- `apps/api/plane/db/models/issue.py` (Issue, IssueRelation, IssueRelationChoices)
- `apps/api/plane/db/models/state.py` (State, StateGroup)
- `apps/api/plane/tests/conftest.py` (`session_client`, `api_client`, `workspace`)
- `apps/api/plane/tests/factories.py` (existing factories)
- `apps/api/plane/tests/contract/app/test_project_app.py` (contract test layout)
- `apps/api/pytest.ini` (markers + addopts)

**Files scanned:** ~15 source files + 4 test files + 1 services package.
**Pattern extraction date:** 2026-05-04
