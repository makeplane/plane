# Phase 6: Auto-join Logic & Polish

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2: Backend API Migration](./phase-02-backend-api-migration.md)
- Current auto-join: `apps/api/plane/app/views/workspace/staff.py` (`_create_staff`, `_join_children_projects`)
- Current sync: `apps/api/plane/app/views/workspace/department.py` (`_sync_members_to_project`)
- Celery tasks: `apps/api/plane/bgtasks/`

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 4h
- Finalize and harden auto-membership logic after migration. Manager auto-join all descendant linked_workspaces. Staff auto-join workspace when assigned to dept. Transfer moves workspace memberships. Deactivation removes all memberships + deactivates User. Add Celery task for bulk retroactive join. Handle edge cases: circular parents, orphaned memberships, concurrent transfers. Integration testing.

## Key Insights

- Phase 2 creates the new views with basic auto-join logic; Phase 6 hardens it
- Manager auto-join is recursive: when user becomes manager of dept A, they must join linked_workspaces of all descendants of A
- Retroactive join (link-workspace to dept with existing staff) can be slow for large depts -- use Celery task
- Transfer must handle case where old dept and new dept link to same workspace (no membership change needed)
- Deactivation now removes ALL WorkspaceMember(s) across all workspaces (instance-level scope)
- Circular parent detection already exists in `Department.clean()` but must also guard in API
- Orphaned memberships: staff deleted but WorkspaceMember remains -- acceptable (don't auto-remove, admin handles)
- `select_for_update()` needed on StaffProfile during transfer to prevent race conditions

## Requirements

### Functional

**Manager auto-join:**

- When staff.is_department_manager set to True: join all descendant linked_workspaces
- When manager reassigned (dept.manager changes): old manager loses nothing (stays in workspace), new manager joins descendants
- Recursive traversal: dept -> children -> grandchildren -> etc. (max 6 levels)

**Staff auto-join:**

- When staff created with department that has linked_workspace: auto WorkspaceMember
- When staff transferred to dept with linked_workspace: auto WorkspaceMember in new workspace
- When dept gets linked_workspace (retroactive): bulk add all active staff as WorkspaceMember

**Transfer:**

- Remove WorkspaceMember from old dept's linked_workspace (only if no other reason to stay)
- Add WorkspaceMember to new dept's linked_workspace
- Skip if old and new dept share same linked_workspace

**Deactivation:**

- Remove ALL WorkspaceMember(s) for user
- Set User.is_active = False
- Set StaffProfile.employment_status = "resigned"

**Retroactive bulk join (Celery):**

- When linking workspace to department: if dept has >10 staff, offload to Celery
- Task: iterate staff, create WorkspaceMember for each
- Return task ID to frontend for polling (or just fire-and-forget with toast)

### Non-functional

- All membership operations atomic (transaction.atomic)
- No N+1 queries in recursive traversal
- Idempotent: get_or_create prevents duplicates
- Celery task retries on failure (max 3)

## Architecture

### Auto-join Decision Matrix

```
Event                              | Action
-----------------------------------|------------------------------------------
Staff created + dept.linked_ws     | WorkspaceMember.get_or_create(ws, user)
Staff transferred                  | Remove old ws member, add new ws member
Staff.is_department_manager = True | Join all descendant linked_ws
Dept linked to workspace           | Bulk add all active staff as ws members
Dept unlinked from workspace       | No action (members stay)
Staff deactivated                  | Remove ALL WorkspaceMember(s), deactivate User
Staff deleted                      | No ws member cleanup (soft delete only)
Manager changed on dept            | New manager joins descendant linked_ws
```

### Celery Task

```python
# plane/bgtasks/department_membership_task.py

@shared_task(bind=True, max_retries=3)
def sync_department_workspace_members(self, department_id, workspace_id):
    """Add all active staff in department as WorkspaceMember."""
    dept = Department.objects.get(id=department_id)
    workspace = Workspace.objects.get(id=workspace_id)

    staff_list = StaffProfile.objects.filter(
        department=dept,
        employment_status="active",
        deleted_at__isnull=True,
    ).select_related("user")

    for staff in staff_list:
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=staff.user,
            defaults={"role": 15},
        )

    # Also add parent managers recursively
    _add_ancestor_managers(dept, workspace)
```

## Related Code Files

### Files to Create

- `apps/api/plane/bgtasks/department-membership-task.py` -- Celery task for bulk retroactive join

### Files to Modify

- `apps/api/plane/license/api/views/department.py` -- harden link-workspace with Celery offload
- `apps/api/plane/license/api/views/staff.py` -- harden \_create_staff, transfer, deactivation
- `apps/api/plane/bgtasks/__init__.py` -- register new task (if needed)

## Implementation Steps

1. **Create Celery task** (`apps/api/plane/bgtasks/department-membership-task.py`):
   - `sync_department_workspace_members(department_id, workspace_id)`:
     - Fetch all active staff in department
     - `WorkspaceMember.get_or_create` for each
     - Add ancestor managers (walk parent chain, each manager joins this workspace)
   - `@shared_task(bind=True, max_retries=3, default_retry_delay=30)`
   - Log progress for debugging

2. **Harden link-workspace endpoint** (in Phase 2 department views):
   - POST link-workspace: set linked_workspace, then always auto-join all staff:
     - If staff_count <= 10: sync inline (atomic)
     - If staff_count > 10: dispatch Celery task
   - DELETE unlink-workspace: set linked_workspace=None, no member removal
   <!-- Updated: Validation Session 1 - removed confirm flow, always auto-join -->

3. **Harden \_create_staff helper**:
   - After creating StaffProfile:
     a. If dept has linked_workspace: `WorkspaceMember.get_or_create(workspace=dept.linked_workspace, member=user)`
     b. If is_department_manager: call `_join_descendant_workspaces(dept, user)`
   - `_join_descendant_workspaces(dept, user)`:
     - Iterate children recursively
     - For each child with linked_workspace: `WorkspaceMember.get_or_create(workspace=child.linked_workspace, member=user)`
     - Max depth 6 (matches Department level constraint)

4. **Harden transfer logic**:
   - `select_for_update()` on StaffProfile to prevent concurrent transfers
   - Determine old_ws = old_dept.linked_workspace, new_ws = new_dept.linked_workspace
   - If old_ws == new_ws: skip membership changes
   - If old_ws and old_ws != new_ws:
     - Check if user has other reasons to stay in old_ws (other staff profiles in same ws? -- No, staff is instance-level now. Check if user is admin of old_ws -- don't remove admins)
     - Safe approach: just remove if `WorkspaceMember.role == 15` (member role, not admin)
   - If new_ws: `WorkspaceMember.get_or_create(workspace=new_ws, member=user)`
   - If was_manager in old dept: no descendant cleanup (stays in workspaces)
   - If is_manager in new dept: join new dept's descendant linked_workspaces

5. **Harden deactivation logic**:
   - `WorkspaceMember.objects.filter(member=user).delete()` -- remove from ALL workspaces
   - `User.objects.filter(id=user.id).update(is_active=False)` -- deactivate user account
   - `staff.employment_status = "resigned"` + save
   - Atomic transaction

6. **Handle manager change on department**:
   - When dept.manager updated via PATCH:
     - Old manager: no action (stays in workspaces)
     - New manager: join this dept's linked_workspace + all descendant linked_workspaces
   - Add this logic to InstanceDepartmentDetailEndpoint.patch()

7. **Edge case: circular parent prevention**:
   - Department.clean() already checks -- ensure API also validates before save
   - In create/update: validate parent_id != self.id and no circular chain

8. **Edge case: orphaned memberships**:
   - Don't auto-cleanup; admin can manually manage via workspace members page
   - Document this behavior

9. **Integration tests**:
   - Test: create staff with linked dept -> verify WorkspaceMember created
   - Test: transfer staff -> verify old ws member removed, new ws member added
   - Test: transfer within same workspace -> verify no membership change
   - Test: deactivate staff -> verify all WorkspaceMembers removed, User.is_active=False
   - Test: link workspace to dept with existing staff -> verify bulk WorkspaceMember creation
   - Test: manager flag set -> verify descendant workspace memberships
   - Test: concurrent transfer (race condition) -> verify no duplicates

10. **Run full test suite**: `cd apps/api && python run_tests.py`

## Todo List

- [x]Create Celery task for bulk retroactive join
- [x]Harden link-workspace with confirm flow + Celery offload
- [x]Harden \_create_staff: auto-join linked_workspace + manager descendants
- [x]Harden transfer: old ws removal (safe), new ws addition, same-ws skip
- [x]Harden deactivation: remove ALL WorkspaceMember(s), deactivate User
- [x]Handle manager change: new manager joins descendant workspaces
- [x]Validate circular parent in API (not just model.clean)
- [x]Write integration tests for all auto-join scenarios
- [x]Test concurrent transfer handling
- [x]Run full test suite
- [x]Manual QA: end-to-end flow in browser

## Success Criteria

- Staff created with linked dept -> automatically appears in workspace members
- Manager assigned -> appears in all descendant workspace members
- Transfer moves workspace membership correctly (or skips if same workspace)
- Deactivation removes user from all workspaces and deactivates account
- Linking workspace to dept with 50+ staff completes via Celery without timeout
- No duplicate WorkspaceMember records (idempotent get_or_create)
- Race condition on concurrent transfer doesn't create inconsistent state
- All integration tests pass

## Risk Assessment

| Risk                                      | Impact                          | Mitigation                                        |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------- |
| Celery not running in dev                 | Retroactive join never happens  | Fallback to sync if Celery unavailable            |
| Removing WS member breaks active sessions | User loses access mid-work      | Only remove role=15 members, never admins         |
| Large department (1000+ staff)            | Slow retroactive join           | Celery task with batching                         |
| Circular parent bypasses clean()          | Infinite loop in tree traversal | Max depth guard (6 levels) in recursive functions |
| Concurrent transfers                      | Race condition                  | select_for_update() lock on StaffProfile          |

## Security Considerations

- Deactivation is destructive: removes all workspace access. Requires InstanceAdmin permission
- Transfer modifies workspace membership: requires InstanceAdmin permission
- Auto-join only adds as role=15 (member), never admin
- Celery tasks run with system permissions, no user context needed
- All operations logged via model_activity for audit trail

## Next Steps

- Post-migration: monitor for orphaned memberships
- Future: consider adding "dry-run" mode for bulk operations
- Future: webhook/notification when staff is auto-added to workspace
