---
phase: 1
title: "Backend: Workspace/Project Filter Params + Accessible Workspaces Endpoint"
status: pending
priority: P1
effort: 1.5h
---

# Phase 1: Backend

## Context Links

- Current views: `apps/api/plane/app/views/ho.py`
- Current urls: `apps/api/plane/app/urls/ho.py`
- Serializer: `apps/api/plane/app/serializers/ho.py`

## Overview

Add `workspace_slug` and `project_id` query params to `HoIssueListView` and `HoCategorySummaryView`. Add new `HoAccessibleWorkspacesView` endpoint.

## Data Flow

```
GET /api/ho/workspaces/
  -> get_accessible_workspace_ids(user)
  -> Workspace.objects.filter(id__in=ws_ids)
  -> serialize: [{id, name, slug, logo_url, projects: [{id, name, identifier}]}]

GET /api/ho/issues/?workspace_slug=foo&project_id=uuid1,uuid2
  -> get_accessible_workspace_ids(user)
  -> filter workspace_ids by slug if provided
  -> filter project_id__in if provided
  -> existing pagination + serialization
```

## Related Code Files

**Modify:**

- `apps/api/plane/app/views/ho.py`
- `apps/api/plane/app/urls/ho.py`

**No new files needed** - all changes fit within existing files.

## Implementation Steps

### 1. Add workspace/project filtering to `HoIssueListView.get()`

After line 114 (`workspace_ids = get_accessible_workspace_ids(request.user)`), add:

```python
# Optional workspace filter
workspace_slug = request.query_params.get("workspace_slug")
if workspace_slug:
    ws = Workspace.objects.filter(slug=workspace_slug, id__in=workspace_ids).first()
    if ws:
        workspace_ids = [ws.id]
    else:
        return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

# Optional project filter — validate UUIDs and enforce workspace boundary
project_ids_param = request.query_params.get("project_id")
project_ids = []
if project_ids_param:
    raw_ids = [pid.strip() for pid in project_ids_param.split(",") if pid.strip()]
    # Validate UUID format before hitting ORM (prevents 500 on malformed input)
    try:
        from uuid import UUID
        [UUID(pid) for pid in raw_ids]
    except ValueError:
        return Response({"detail": "Invalid project_id format."}, status=status.HTTP_400_BAD_REQUEST)
    # Validate project IDs belong to accessible workspaces (prevents cross-workspace enumeration)
    project_ids = list(
        Project.objects.filter(id__in=raw_ids, workspace_id__in=workspace_ids)
        .values_list("id", flat=True)
    )
    if len(project_ids) < len(raw_ids):
        return Response({"detail": "One or more project IDs are invalid or inaccessible."}, status=status.HTTP_400_BAD_REQUEST)
```

Then in the queryset, add after `workspace_id__in=workspace_ids`:

```python
# Apply project filter if provided
if project_ids:
    qs = qs.filter(project_id__in=project_ids)
```

> **NOTE (Finding 4):** The existing queryset uses `Issue.objects` — project rules require `Issue.issue_objects`. Flag this for a follow-up if HO views are ever audited for architecture compliance. Do not change it in this PR scope unless explicitly tasked.

### 2. Same filtering in `HoCategorySummaryView.get()`

Same pattern: extract `workspace_slug` and `project_id` params, filter `workspace_ids` and queryset.

### 3. Add `HoAccessibleWorkspacesView`

```python
class HoAccessibleWorkspacesView(BaseAPIView):
    """GET /api/ho/workspaces/ - list workspaces accessible to user with their projects."""

    def get(self, request):
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response([], status=status.HTTP_200_OK)

        workspaces = Workspace.objects.filter(
            id__in=workspace_ids
        ).select_related("logo_asset").prefetch_related("workspace_project").order_by("name")

        # Cross-reference ProjectMember to return only projects the requesting user belongs to.
        # Prevents leaking private/secret project names (e.g. "Executive Compensation Q4") to
        # HO users who can see the workspace but are not project members.
        user_project_ids = set(
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
                project__workspace_id__in=workspace_ids,
            ).values_list("project_id", flat=True)
        )

        result = []
        for ws in workspaces:
            projects = ws.workspace_project.filter(
                deleted_at__isnull=True,
                archived_at__isnull=True,
                id__in=user_project_ids,
            ).values("id", "name", "identifier").order_by("name")

            result.append({
                "id": str(ws.id),
                "name": ws.name,
                "slug": ws.slug,
                "logo_url": ws.logo_url,  # Use @property, not raw ws.logo (resolves logo_asset for modern uploads)
                "projects": [
                    {"id": str(p["id"]), "name": p["name"], "identifier": p["identifier"]}
                    for p in projects
                ],
            })

        return Response(result, status=status.HTTP_200_OK)
```

### 4. Register URL

In `apps/api/plane/app/urls/ho.py`:

```python
from plane.app.views.ho import HoCategorySummaryView, HoIssueListView, HoAccessibleWorkspacesView

urlpatterns = [
    path("ho/issues/", HoIssueListView.as_view(), name="ho-issues"),
    path("ho/category-summary/", HoCategorySummaryView.as_view(), name="ho-category-summary"),
    path("ho/workspaces/", HoAccessibleWorkspacesView.as_view(), name="ho-workspaces"),
]
```

## Todo List

<!-- Updated: Validation Session 1 - verify workspace_project reverse name before coding -->

- [ ] **PRE-CHECK:** Grep `related_name` on `Project.workspace` FK to confirm `workspace_project` is correct: `grep -n "related_name" apps/api/plane/db/models/project.py`
- [ ] Add `workspace_slug` + `project_id` filtering to `HoIssueListView`
- [ ] Add UUID format validation + workspace boundary check for `project_id` param (return 400 on invalid)
- [ ] Add `workspace_slug` + `project_id` filtering to `HoCategorySummaryView` (same UUID + boundary validation)
- [ ] Add `HoAccessibleWorkspacesView` class
  - [ ] Use `ws.logo_url` property (not `ws.logo` field) + add `logo_asset` to `select_related`
  - [ ] Filter projects by `ProjectMember` (only return projects the requesting user belongs to)
- [ ] Register `/api/ho/workspaces/` URL
- [ ] Verify `workspace_project` is correct reverse relation name for Project -> Workspace

## Failure Modes

| Risk                                   | Likelihood | Impact | Mitigation                                                        |
| -------------------------------------- | ---------- | ------ | ----------------------------------------------------------------- |
| `workspace_project` reverse name wrong | Medium     | High   | Grep `related_name` on Project.workspace FK before implementation |
| N+1 on projects prefetch               | Low        | Medium | `prefetch_related("workspace_project")` handles it                |
| Invalid UUID in `project_id` param     | Medium     | Low    | Django ORM raises ValueError -> 500; add try/except to return 400 |

## Success Criteria

- `GET /api/ho/workspaces/` returns workspace list with nested projects
- `GET /api/ho/issues/?workspace_slug=foo` returns only issues from that workspace
- `GET /api/ho/issues/?workspace_slug=foo&project_id=uuid1` returns only issues from that project
- Existing calls without params work unchanged (backward compatible)

## Security

- All endpoints use existing `get_accessible_workspace_ids()` — no escalation possible
- `workspace_slug` validated against accessible IDs — user cannot filter to unauthorized workspace
- `project_id` scoped within already-filtered workspace_ids queryset
