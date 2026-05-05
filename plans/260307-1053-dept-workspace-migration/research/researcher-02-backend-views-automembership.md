# Backend Views & Auto-Membership Research

## Key Findings

### 1. Department Views (`department.py`)

- **Permission Model**: Reads use `WorkspaceEntityPermission`, mutations use `WorkSpaceAdminPermission`
- **Workspace Slug**: All endpoints use `workspace__slug=slug` for workspace isolation
- **Link-Project Logic**: `DepartmentLinkProjectEndpoint.post()` atomically:
  - Sets `department.linked_project`
  - Calls `_sync_members_to_project()` to auto-add all active staff as ProjectMembers
  - Adds parent department managers recursively (lines 323-332)
  - Role: 20 (Project Lead) for managers, 15 (Guest) for others
- **Unlink**: Removes link but does NOT remove members (design pattern for data safety)

### 2. Staff Views (`staff.py`)

- **Auto-Membership Chain** (in `_create_staff()` function, line 640):
  1. Create or get User
  2. Create WorkspaceMember (role 15)
  3. Create StaffProfile
  4. Auto-add to department's linked_project if exists (role determined by manager flag)
  5. If manager: recursively join all descendant linked projects (line 689-707)
- **Transfer Logic** (StaffTransferEndpoint, line 240):
  - Locks staff row with `select_for_update()` to prevent race conditions
  - Removes from old dept's linked project
  - Updates department
  - Adds to new dept's linked project if exists
- **Deactivation** (StaffDeactivateEndpoint, line 300):
  - Removes all ProjectMembers in workspace
  - Sets WorkspaceMember `is_active=False` (soft deactivation)
  - Updates employment_status to "resigned"
- **Bulk Import**: CSV-based creation using `_create_staff()` helper (supports skip_existing flag)
- **Bulk Actions**: Transfer, status change, or delete multiple staff atomically

### 3. URL Organization

- **Workspace-level**: All endpoints nested under `/workspaces/<slug>/departments/` and `/workspaces/<slug>/staff/`
- **Pattern**: `{resource}/{detail?}/{action?}/`
- **Included in main **init**.py**: department_urls and staff_urls imported and merged into root urlpatterns (lines 25-26, 50-51)
- No instance-level endpoints found — all are workspace-scoped

### 4. Instance Admin Pattern

- Searched `BaseAPIView` and views — no `InstanceBaseEndpoint` class found
- Plane.so likely doesn't have instance-level admin views yet
- All admin operations are workspace-scoped using `WorkSpaceAdminPermission`

### 5. Sidebar Navigation

- No workspace sidebar component found in search results
- Department/staff features not yet integrated into sidebar navigation
- Will need new sidebar menu item for "Organization Chart" or similar

## Critical Auto-Membership Rules

1. **Staff creation** → auto WorkspaceMember + ProjectMember (if dept linked)
2. **Manager flag** → auto-join all descendant project links
3. **Department link** → auto-add all active staff to project
4. **Transfer** → atomically update old/new project memberships
5. **Deactivation** → soft delete memberships, preserve audit trail

## URL Structure Summary

```
POST   /workspaces/{slug}/staff/               # Create staff
POST   /workspaces/{slug}/staff/bulk-import/   # Bulk import
POST   /workspaces/{slug}/staff/{id}/transfer/ # Transfer
POST   /workspaces/{slug}/staff/{id}/deactivate/ # Deactivate
POST   /workspaces/{slug}/departments/         # Create dept
POST   /workspaces/{slug}/departments/{id}/link-project/ # Link
GET    /workspaces/{slug}/departments/tree/    # Tree view
```

## Unresolved Questions

- How are sidebar navigation items added? (not found in search)
- Does instance-level staff/dept management exist elsewhere in codebase?
