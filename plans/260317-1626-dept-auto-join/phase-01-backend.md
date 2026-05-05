# Phase 01 — Backend: Auto-Join Endpoint

**Plan**: [plan.md](./plan.md)
**Date**: 2026-03-17
**Status**: complete
**Priority**: P2

---

## Overview

Add `POST /api/instances/departments/<id>/auto-join/` endpoint that joins the department manager to projects in the linked workspace.

---

## Key Insights

- `ProjectMember` uses soft-delete (`deleted_at`). Must filter `deleted_at__isnull=True` before creating to avoid duplicate-key violations.
- `InstanceDepartmentLinkWorkspaceEndpoint` is the direct pattern to follow — same view class structure, same file.
- No Celery needed: single user (manager) joining N projects is fast/synchronous.
- `Project` has `is_bank_wide` BooleanField and `workspace` FK.
- `ProjectMember` unique constraint: `(project, member, deleted_at)` — use `get_or_create` with proper filter.

---

## Requirements

1. `POST /api/instances/departments/<pk>/auto-join/`
2. Body: `{ "mode": "all_projects" | "bank_wide_projects" }`
3. 400 if no `linked_workspace` or no `manager`
4. 400 if invalid `mode`
5. Returns `{ "newly_added": int, "already_member": int, "total": int }`
6. Manager joins with `role=20` (Admin)

---

## Architecture

```
POST .../departments/<pk>/auto-join/
        │
        ├─ Validate: dept exists (404)
        ├─ Validate: linked_workspace (400)
        ├─ Validate: manager (400)
        ├─ Validate: mode in {all_projects, bank_wide_projects} (400)
        │
        ├─ Query: Project.objects.filter(workspace=linked_workspace, deleted_at__isnull=True)
        │         [+ .filter(is_bank_wide=True) if bank_wide_projects]
        │
        ├─ For each project:
        │     existing = ProjectMember.objects.filter(project=p, member=manager, deleted_at__isnull=True).first()
        │     if existing → already_member++
        │     else → ProjectMember.objects.create(..., role=20) → newly_added++
        │
        └─ Return { newly_added, already_member, total }
```

---

## Related Files

- `apps/api/plane/license/api/views/department.py` — add new view class `InstanceDepartmentAutoJoinEndpoint`
- `apps/api/plane/license/api/urls/department.py` — register new URL
- `apps/api/plane/db/models/project.py` — `Project.is_bank_wide`, `ProjectMember`

---

## Implementation Steps

### 1. Add view class to `department.py`

Add after `InstanceDepartmentLinkWorkspaceEndpoint` (line ~280):

```python
class InstanceDepartmentAutoJoinEndpoint(BaseAPIView):
    """Join the department manager to projects in the linked workspace."""

    def post(self, request, pk):
        from plane.db.models import Project, ProjectMember

        department = (
            Department.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("linked_workspace", "manager")
            .first()
        )
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

        if not department.linked_workspace:
            return Response({"error": "Department has no linked workspace"}, status=status.HTTP_400_BAD_REQUEST)

        if not department.manager:
            return Response({"error": "Department has no manager"}, status=status.HTTP_400_BAD_REQUEST)

        mode = request.data.get("mode")
        if mode not in ("all_projects", "bank_wide_projects"):
            return Response({"error": "mode must be 'all_projects' or 'bank_wide_projects'"}, status=status.HTTP_400_BAD_REQUEST)

        projects = Project.objects.filter(
            workspace=department.linked_workspace,
            deleted_at__isnull=True,
        )
        if mode == "bank_wide_projects":
            projects = projects.filter(is_bank_wide=True)

        newly_added = 0
        already_member = 0
        manager = department.manager

        for project in projects:
            existing = ProjectMember.objects.filter(
                project=project,
                member=manager,
                deleted_at__isnull=True,
            ).first()
            if existing:
                already_member += 1
            else:
                ProjectMember.objects.create(
                    project=project,
                    member=manager,
                    role=20,
                    is_active=True,
                )
                newly_added += 1

        return Response(
            {
                "newly_added": newly_added,
                "already_member": already_member,
                "total": newly_added + already_member,
            },
            status=status.HTTP_200_OK,
        )
```

### 2. Update `urls/department.py`

Add import and URL entry:

```python
# Add to imports
from plane.license.api.views.department import (
    ...
    InstanceDepartmentAutoJoinEndpoint,
)

# Add URL (after link-workspace entry)
path(
    "departments/<uuid:pk>/auto-join/",
    InstanceDepartmentAutoJoinEndpoint.as_view(http_method_names=["post"]),
    name="instance-department-auto-join",
),
```

---

## Todo

- [x] Add `InstanceDepartmentAutoJoinEndpoint` class to `department.py`
- [x] Export new class in `urls/department.py` imports
- [x] Register URL pattern in `urlpatterns`
- [x] Python import test: `cd apps/api && python -c "from plane.license.api.views.department import InstanceDepartmentAutoJoinEndpoint"`

---

## Success Criteria

- `POST .../auto-join/` with `mode=all_projects` → 200 with counts
- `POST .../auto-join/` with `mode=bank_wide_projects` → 200, only `is_bank_wide=True` projects
- No linked workspace → 400
- No manager → 400
- Invalid mode → 400
- Idempotent: calling twice → second call returns `already_member = N, newly_added = 0`

---

## Risk Assessment

| Risk                                     | Mitigation                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Soft-delete collision on `ProjectMember` | Use `filter(...deleted_at__isnull=True).first()` before create                      |
| Manager not a workspace member           | Not blocking for project membership — ProjectMember doesn't require WorkspaceMember |
| Large workspace with many projects       | Acceptable — single user, N projects, all in one request; no async needed           |
