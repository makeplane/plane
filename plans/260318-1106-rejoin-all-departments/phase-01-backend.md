# Phase 01 — Backend Endpoint

**Parent plan:** [plan.md](./plan.md)

## Overview

| Field    | Value      |
| -------- | ---------- |
| Date     | 2026-03-18 |
| Priority | P2         |
| Status   | ⬜ pending |
| Est.     | 30m        |

Add `RejoinAllEndpoint` class to views and register its URL path.

## Key Insights

- Existing `InstanceDepartmentAutoJoinEndpoint.post` handles the per-dept logic — `RejoinAllEndpoint` is its global equivalent
- `_collect_dept_and_ancestor_managers()` already handles both `Department.manager` FK and `StaffProfile.is_department_manager=True` — reuse verbatim
- Soft-delete-aware `ProjectMember` restore (using `all_objects`) must be copied from lines 362–374 to avoid `ProjectUserProperty` IntegrityError
- `WorkspaceMember.all_objects` pattern (lines 334–351) must come before project loop

## Requirements

<!-- Updated: Validation Session 1 - mode param required -->

- New `POST /api/instances/departments/rejoin-all/` endpoint
- Accepts `{ mode: "all_projects" | "bank_wide_projects" }` in request body (same validation as `InstanceDepartmentAutoJoinEndpoint`)
- Loops all depts with `linked_workspace` (no `pk` param — global op)
- Returns `{ departments_processed, newly_added, already_member, total }`
- URL registered BEFORE `<uuid:pk>/` dynamic route

## Architecture

<!-- Updated: Validation Session 1 - mode param added to flow -->

```
RejoinAllEndpoint.post(mode)
  ├── Validate mode ∈ {"all_projects", "bank_wide_projects"} → 400 if invalid
  ├── Query: Department.filter(deleted_at=None, linked_workspace≠None)
  ├── For each dept:
  │   ├── managers = _collect_dept_and_ancestor_managers(dept)
  │   ├── projects = Project.filter(workspace=dept.linked_workspace)
  │   │             [+ .filter(is_bank_wide=True) if mode=="bank_wide_projects"]
  │   └── For each manager:
  │       ├── Upsert WorkspaceMember (role=20, all_objects pattern)
  │       └── For each project: upsert ProjectMember (soft-delete restore pattern)
  └── Return { departments_processed, newly_added, already_member, total }
```

## Related Code Files

- `apps/api/plane/license/api/views/department.py` — add class after line ~383
- `apps/api/plane/license/api/urls/department.py` — add URL in static-paths section

## Implementation Steps

### 1. `views/department.py` — Add `RejoinAllEndpoint`

After the `InstanceDepartmentAutoJoinEndpoint` class (after line ~383), add:

```python
class RejoinAllEndpoint(BaseAPIView):
    """Bulk rejoin: join ALL department managers to ALL linked workspaces + projects."""

    def post(self, request):
        from plane.db.models import Project, ProjectMember

        departments = (
            Department.objects.filter(deleted_at__isnull=True, linked_workspace__isnull=False)
            .select_related("linked_workspace", "manager")
        )

        departments_processed = 0
        newly_added = 0
        already_member = 0

        for department in departments:
            managers = _collect_dept_and_ancestor_managers(department)
            if not managers:
                continue

            departments_processed += 1
            workspace = department.linked_workspace
            projects = list(Project.objects.filter(workspace=workspace, deleted_at__isnull=True))

            for manager in managers:
                # Ensure workspace membership (role=20 Admin)
                any_ws = WorkspaceMember.all_objects.filter(workspace=workspace, member=manager).first()
                if any_ws:
                    fields = []
                    if any_ws.deleted_at is not None:
                        any_ws.deleted_at = None
                        fields.append("deleted_at")
                    if any_ws.role < 20:
                        any_ws.role = 20
                        fields.append("role")
                    if not any_ws.is_active:
                        any_ws.is_active = True
                        fields.append("is_active")
                    if fields:
                        any_ws.save(update_fields=fields)
                else:
                    WorkspaceMember.objects.create(
                        workspace=workspace, member=manager, role=20, is_active=True
                    )

                # Add to all projects
                for project in projects:
                    existing = ProjectMember.objects.filter(
                        project=project, member=manager, deleted_at__isnull=True
                    ).first()
                    if existing:
                        already_member += 1
                    else:
                        soft_deleted = ProjectMember.all_objects.filter(
                            project=project, member=manager
                        ).exclude(deleted_at__isnull=True).first()
                        if soft_deleted:
                            soft_deleted.deleted_at = None
                            soft_deleted.is_active = True
                            soft_deleted.role = max(soft_deleted.role, 20)
                            soft_deleted.save(update_fields=["deleted_at", "is_active", "role"])
                        else:
                            ProjectMember.objects.create(
                                project=project, member=manager, role=20, is_active=True
                            )
                        newly_added += 1

        return Response(
            {
                "departments_processed": departments_processed,
                "newly_added": newly_added,
                "already_member": already_member,
                "total": newly_added + already_member,
            },
            status=status.HTTP_200_OK,
        )
```

### 2. `urls/department.py` — Register URL

Add import to existing import block:

```python
from plane.license.api.views.department import (
    ...
    RejoinAllEndpoint,  # add here
)
```

Add path in static-paths section (before `departments/<uuid:pk>/`):

```python
path(
    "departments/rejoin-all/",
    RejoinAllEndpoint.as_view(http_method_names=["post"]),
    name="instance-department-rejoin-all",
),
```

## Todo

- [ ] Add `RejoinAllEndpoint` class to `views/department.py`
- [ ] Import `RejoinAllEndpoint` in `urls/department.py`
- [ ] Add `departments/rejoin-all/` URL path (before `<uuid:pk>`)
- [ ] Verify URL order (static before dynamic)

## Success Criteria

- `POST /api/instances/departments/rejoin-all/` returns 200 with aggregate counts
- URL does not conflict with `departments/<uuid:pk>/`
- Managers get `role=20` in workspace and all projects
- Soft-deleted memberships restored correctly

## Risk Assessment

- **Performance**: Large instances with many depts/projects may be slow — acceptable for admin-only infrequent operation
- **N+1 queries**: Each dept triggers queries; acceptable given low frequency

## Security Considerations

- Endpoint uses `BaseAPIView` — same auth as all other department endpoints (instance admin only)
- No user input processed — no injection risk

## Next Steps

→ Phase 02: Frontend service + store + UI
