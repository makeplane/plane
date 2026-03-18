# Research Report: Plane Permission/Role System

## Summary
Plane implements a tiered role-based access control (RBAC) with workspace and project roles. Module management uses `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator for write ops and `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` for read ops. Frontend permissions stored in MobX stores; UI controls conditionally hidden based on role checks.

---

## Backend Permission System

### Permission Architecture
- **File**: `apps/api/plane/app/permissions/`
- **Core exports**: `allow_permission`, `ROLE`, `ProjectEntityPermission`, `WorkspaceEntityPermission`
- **Workspace roles** (defined in base.py): ADMIN=20, MEMBER=10, VIEWER=5, GUEST=0
- **Permission classes**:
  - `WorkSpaceBasePermission` - workspace-level checks
  - `ProjectEntityPermission` - project resource protection
  - `ProjectLitePermission` - lightweight project checks
  - `ProjectAdminPermission` - admin-only ops
  - `ProjectPagePermission` - page-specific rules

### Module Views Permission Pattern
**File**: `apps/api/plane/app/views/module/base.py`

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
def create(self, request, slug, project_id):  # Line 295
    # Creates new module - requires ADMIN or MEMBER role

@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
def list(self, request, slug, project_id):    # Line 354
    # List modules - readable by all roles

@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
def partial_update(self, request, slug, project_id, pk):  # Line 651
    # Edit module - requires ADMIN or MEMBER

@allow_permission([ROLE.ADMIN], creator=True, model=Module)
def destroy(self, request, slug, project_id, pk):  # Line 723
    # Delete - requires ADMIN role AND creator flag (module creator or workspace admin)
```

### Key Pattern
- `@allow_permission` decorator in `base.py` checks user's workspace role
- `creator=True` parameter: enforces user created the resource OR is workspace admin
- No permission_classes on ModuleViewSet (uses decorator-based checks)
- `ModuleLinkViewSet` uses `ProjectEntityPermission` class (stricter)
- `ModuleFavoriteViewSet` uses `ProjectLitePermission`

### is_staff/system_admin
Not explicitly used in module views. Admin checks via workspace role (ROLE.ADMIN = 20).

---

## Frontend Permission System

### Role Check Patterns
**File**: `apps/web/ce/store/user/permission.store.ts`

- Extends `BaseUserPermissionStore` (core)
- `getProjectRoleByWorkspaceSlugAndProjectId()` - computes project role for workspace/project
- Stores project/workspace roles in `@observable` maps (MobX)
- Used in components via `const { permission } = useUserPermissionStore()`

### Module Frontend Components
**Path**: `apps/web/ce/components/modules/` - No CE-specific overrides found. Uses core components.

### Typical UI Control Pattern
```tsx
// Pseudo-code pattern from codebase
const { membership: { role } } = useWorkspaceStore();
const canEdit = [ROLE.ADMIN, ROLE.MEMBER].includes(role);

return (
  <>
    {canEdit && <EditButton />}
    {canEdit && <DeleteButton />}
    <ViewModule />  // Always visible
  </>
);
```

---

## Module Operations Matrix

| Operation | Current Perms | Who Can Do It |
|-----------|--------------|--------------|
| Create    | ADMIN, MEMBER | Workspace ADMIN/MEMBER |
| Read list | ADMIN, MEMBER, GUEST | All workspace members |
| Read detail | ADMIN, MEMBER | ADMIN/MEMBER only |
| Edit      | ADMIN, MEMBER | ADMIN/MEMBER only |
| Delete    | ADMIN (creator flag) | Module creator + workspace ADMIN |
| Toggle Favorite | ProjectLitePermission | Active project member |
| Edit user properties | ADMIN, MEMBER, GUEST | All members (UI filters) |

---

## Key Files Referenced
- Backend permissions: `apps/api/plane/app/permissions/base.py`, `project.py`, `workspace.py`
- Module views: `apps/api/plane/app/views/module/base.py` (730+ lines)
- Frontend permission store: `apps/web/ce/store/user/permission.store.ts`
- Base permission store: `apps/web/core/store/user/base-permissions.store.ts` (core, read-only)

---

## Implications for Module Activities/Worklog
- **Logging operations**: Use `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` for create/edit/delete
- **Filtering UI**: Check role before showing worklog create/edit buttons
- **Audit trail**: No special role escalation needed (follows module op permissions)
- **Read access**: Consider broadening to GUEST if worklog is purely informational

---

## Unresolved Questions
1. Does `ModuleLinkViewSet.permission_classes = [ProjectEntityPermission]` override `ModuleViewSet`'s decorator-based checks? Need to verify permission chain.
2. Should worklog inherit GUEST read access or remain ADMIN/MEMBER only?
