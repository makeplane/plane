# Phase 2: Backend API Migration

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1: DB Model Migration](./phase-01-db-model-migration.md)
- Current views: `apps/api/plane/app/views/workspace/department.py`, `apps/api/plane/app/views/workspace/staff.py`
- Instance base: `apps/api/plane/license/api/views/base.py`
- Instance URLs: `apps/api/plane/license/urls.py`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 8h
- Move all Department and Staff API endpoints from workspace-scoped (`/api/workspaces/<slug>/`) to instance-level (`/api/instances/`). Inherit from license `BaseAPIView` with `InstanceAdminPermission`. Replace `linked_project` logic with `linked_workspace`. Rewrite auto-membership: ProjectMember -> WorkspaceMember. Move MyStaffProfileEndpoint to `/api/v1/me/staff-profile/`.

## Key Insights

- License `BaseAPIView` uses `InstanceAdminPermission` + `BaseSessionAuthentication` -- same auth as admin panel
- Current views use `WorkSpaceAdminPermission` / `WorkspaceEntityPermission` -- must switch to `InstanceAdminPermission`
- `_create_staff()` helper currently creates User + WorkspaceMember + StaffProfile + ProjectMember -- needs rewrite: no workspace param, auto-join linked_workspace instead of linked_project
- Transfer logic: remove from old dept's linked_workspace, add to new dept's linked_workspace
- Deactivation: remove ALL WorkspaceMember(s) for user + deactivate User
- `_sync_members_to_project()` becomes `_sync_members_to_workspace()` -- add WorkspaceMember instead of ProjectMember
- Link-workspace endpoint: always auto-join all staff (no confirm dialog needed)
<!-- Updated: Validation Session 1 - removed confirm flow, always auto-join -->
- MyStaffProfileEndpoint moves to `/api/v1/me/staff-profile/` (no workspace scope, lookup by user only)

## Requirements

### Functional

- CRUD endpoints for departments at `/api/instances/departments/`
- CRUD endpoints for staff at `/api/instances/staff/`
- Link/unlink workspace endpoint: `/api/instances/departments/<pk>/link-workspace/`
- Retroactive join: POST link-workspace returns `staff_count` needing membership, frontend shows confirm
- Transfer: updates WorkspaceMember(s) not ProjectMember(s)
- Deactivation: removes all WorkspaceMember(s), deactivates User account
- Bulk import/export at instance level
- MyStaffProfile at `/api/v1/me/staff-profile/` (authenticated user, no admin required)

### Non-functional

- All write endpoints require InstanceAdminPermission
- Consistent error handling via license BaseAPIView
- Atomic transactions for membership operations

## Architecture

```
NEW URL structure:
  /api/instances/departments/                    GET, POST
  /api/instances/departments/tree/               GET
  /api/instances/departments/<pk>/               GET, PATCH, DELETE
  /api/instances/departments/<pk>/staff/         GET
  /api/instances/departments/<pk>/link-workspace/  POST, DELETE
  /api/instances/staff/                          GET, POST
  /api/instances/staff/bulk-import/              POST
  /api/instances/staff/bulk-actions/             POST
  /api/instances/staff/export/                   GET
  /api/instances/staff/stats/                    GET
  /api/instances/staff/<pk>/                     GET, PATCH, DELETE
  /api/instances/staff/<pk>/transfer/            POST
  /api/instances/staff/<pk>/deactivate/          POST

  /api/v1/me/staff-profile/                     GET (authenticated, no admin)

OLD URLs to REMOVE:
  /api/workspaces/<slug>/departments/*
  /api/workspaces/<slug>/staff/*
  /api/workspaces/<slug>/me/staff-profile/
```

### Auto-membership flow change

```
BEFORE: staff assigned to dept with linked_project
  -> ProjectMember.get_or_create(project=dept.linked_project, member=user)
  -> Manager: join all children's linked_projects

AFTER: staff assigned to dept with linked_workspace
  -> WorkspaceMember.get_or_create(workspace=dept.linked_workspace, member=user, defaults={role: 15})
  -> Manager: join all descendants' linked_workspaces
```

## Related Code Files

### Files to Create

- `apps/api/plane/license/api/views/department.py` -- InstanceDepartmentEndpoint, InstanceDepartmentDetailEndpoint, InstanceDepartmentTreeEndpoint, InstanceDepartmentStaffEndpoint, InstanceDepartmentLinkWorkspaceEndpoint
- `apps/api/plane/license/api/views/staff.py` -- InstanceStaffEndpoint, InstanceStaffDetailEndpoint, InstanceStaffTransferEndpoint, InstanceStaffDeactivateEndpoint, InstanceStaffBulkImportEndpoint, InstanceStaffBulkActionEndpoint, InstanceStaffExportEndpoint, InstanceStaffStatsEndpoint
- `apps/api/plane/license/api/urls/department.py` -- URL patterns for instance departments
- `apps/api/plane/license/api/urls/staff.py` -- URL patterns for instance staff

### Files to Modify

- `apps/api/plane/license/api/views/__init__.py` -- export new views
- `apps/api/plane/license/urls.py` -- include new URL patterns
- `apps/api/plane/app/serializers/department.py` -- remove `workspace` from fields, replace `linked_project` with `linked_workspace`, update `get_linked_project_detail` -> `get_linked_workspace_detail`
- `apps/api/plane/app/serializers/staff.py` -- remove `workspace` from fields
- `apps/api/plane/app/urls/__init__.py` -- remove old department/staff URL includes
- `apps/api/plane/app/urls/department.py` -- DELETE entire file
- `apps/api/plane/app/urls/staff.py` -- DELETE entire file

### Files to Modify (MyStaffProfile move)

- Create new endpoint in `apps/api/plane/app/views/user/` or add to existing user views
- Add URL in `apps/api/plane/app/urls/` at `/api/v1/me/staff-profile/`

### Files to Delete

- `apps/api/plane/app/views/workspace/department.py`
- `apps/api/plane/app/views/workspace/staff.py`

## Implementation Steps

1. **Update serializers** (`department.py`, `staff.py`):
   - Remove `workspace` from `fields` and `read_only_fields`
   - DepartmentSerializer: replace `linked_project` with `linked_workspace`
   - DepartmentTreeSerializer: rename `get_linked_project_detail` -> `get_linked_workspace_detail`, return workspace name/slug instead of project name/identifier
   - StaffProfileSerializer: remove `workspace` from fields

2. **Create instance department views** (`plane/license/api/views/department.py`):
   - Inherit from license `BaseAPIView` (auto InstanceAdminPermission)
   - InstanceDepartmentEndpoint: list all departments (no workspace filter), create dept
   - InstanceDepartmentDetailEndpoint: get/patch/delete by pk
   - InstanceDepartmentTreeEndpoint: full tree (parent\_\_isnull=True roots)
   - InstanceDepartmentStaffEndpoint: list staff by dept pk
   - InstanceDepartmentLinkWorkspaceEndpoint:
     - POST: accept `workspace_id`, validate Workspace exists, set `dept.linked_workspace`, always auto-join all active staff via `_sync_members_to_workspace(dept, workspace)`. If staff_count > 10, use Celery task.
     - DELETE: unlink (set null), do NOT remove members
     <!-- Updated: Validation Session 1 - simplified to always auto-join, no confirm -->

3. **Create instance staff views** (`plane/license/api/views/staff.py`):
   - Inherit from license BaseAPIView
   - Rewrite `_create_staff()`: no workspace param, auto-derive workspace from `dept.linked_workspace`
     - Create User (get_or_create by email)
     - If dept has linked_workspace: WorkspaceMember.get_or_create(workspace, member=user)
     - Create StaffProfile (no workspace field)
     - If manager: join all descendant linked_workspaces
   - InstanceStaffTransferEndpoint: remove from old dept's linked_workspace, add to new dept's linked_workspace
   - InstanceStaffDeactivateEndpoint: remove ALL WorkspaceMember(s) for user across all workspaces + deactivate User
   - Bulk import: same CSV format, use new `_create_staff()`
   - Bulk actions: transfer/status/delete with new workspace logic
   - Export: no workspace filter, export all staff
   - Stats: instance-wide stats

4. **Create URL files**:
   - `plane/license/api/urls/department.py` with patterns
   - `plane/license/api/urls/staff.py` with patterns

5. **Wire URLs** in `plane/license/urls.py`:
   - `path("departments/", include("plane.license.api.urls.department"))`
   - `path("staff/", include("plane.license.api.urls.staff"))`

6. **Move MyStaffProfileEndpoint** to app-level (non-admin):
   - New endpoint at `/api/v1/me/staff-profile/`
   - Query: `StaffProfile.objects.get(user=request.user, deleted_at__isnull=True)`
   - No workspace filter needed (user has one StaffProfile globally now)
   - Permission: IsAuthenticated

7. **Remove old workspace-scoped files**:
   - Delete `apps/api/plane/app/views/workspace/department.py`
   - Delete `apps/api/plane/app/views/workspace/staff.py`
   - Delete `apps/api/plane/app/urls/department.py`
   - Delete `apps/api/plane/app/urls/staff.py`
   - Remove imports from `apps/api/plane/app/urls/__init__.py`
   - Remove imports from `apps/api/plane/app/views/workspace/__init__.py`

8. **Test all endpoints** with curl/httpie against dev server

## Todo List

- [ ] Update DepartmentSerializer (remove workspace, linked_project -> linked_workspace)
- [ ] Update DepartmentTreeSerializer (linked_workspace_detail)
- [ ] Update StaffProfileSerializer (remove workspace)
- [ ] Create InstanceDepartmentEndpoint + Detail + Tree + Staff + LinkWorkspace views
- [ ] Create InstanceStaffEndpoint + Detail + Transfer + Deactivate + BulkImport + BulkAction + Export + Stats views
- [ ] Rewrite \_create_staff() helper for instance-level
- [ ] Rewrite \_sync_members_to_workspace() (was \_sync_members_to_project)
- [ ] Rewrite \_join_children_workspaces() (was \_join_children_projects)
- [ ] Create department URL patterns (license/api/urls/)
- [ ] Create staff URL patterns (license/api/urls/)
- [ ] Wire URLs in license/urls.py
- [ ] Move MyStaffProfileEndpoint to /api/v1/me/staff-profile/
- [ ] Delete old workspace-scoped views and URL files
- [ ] Remove old imports from **init**.py files
- [ ] Test all endpoints

## Success Criteria

- All instance endpoints respond with correct data
- Creating staff auto-creates WorkspaceMember in linked_workspace
- Transfer moves WorkspaceMember between workspaces
- Deactivation removes all WorkspaceMember(s) and deactivates User
- Link-workspace returns staff_count for confirm dialog
- MyStaffProfile works at /api/v1/me/staff-profile/ without workspace slug
- Old workspace-scoped endpoints return 404

## Risk Assessment

| Risk                             | Impact                    | Mitigation                                                 |
| -------------------------------- | ------------------------- | ---------------------------------------------------------- |
| Breaking frontend (old API URLs) | 500 errors                | Phase 3+4 update frontend simultaneously                   |
| Admin session auth mismatch      | 403 on new endpoints      | Use same BaseSessionAuthentication as other instance views |
| Bulk deactivation performance    | Slow for large orgs       | Use bulk_update/bulk_delete instead of loop                |
| Race condition on link-workspace | Duplicate WorkspaceMember | Atomic transaction + get_or_create                         |

## Security Considerations

- All write endpoints protected by InstanceAdminPermission (god-mode only)
- MyStaffProfile uses IsAuthenticated (any logged-in user)
- Deactivation cascade: removing WorkspaceMember removes access to all workspace projects
- CSV import validates file size (10MB max) and row count (5000 max)

## Next Steps

- Phase 3: God-mode Frontend (create admin services, stores, pages)
- Phase 4: Cleanup Workspace Settings (remove old frontend components)
