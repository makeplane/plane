---
phase: 1
title: "Backend endpoint"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Backend Endpoint

## Overview

New god-mode endpoint `POST /api/instances/workspaces/bulk-remove-members/` that accepts a list of
`{ workspace_slug, user_id }` rows and soft-deletes matching `WorkspaceMember` records, cascading to
`ProjectMember`. Mirrors the existing `InstanceWorkspaceBulkAssignMembersEndpoint` in structure.

## Requirements

- Functional:
  - Accept `{ "members": [{ "workspace_slug": str, "user_id": str (UUID) }] }` — max 500 rows
  - Per-row validation: workspace exists, user exists, membership is active
  - Per-row guard: if user is sole admin (role=20) in any project inside that workspace → hard-skip with reason
  - On pass: set `WorkspaceMember.is_active = False`, cascade `ProjectMember.is_active = False`
  - Return `{ removed: [...], skipped: [...], total_removed: N, total_skipped: N }`
  - No email in any response field
- Non-functional:
  - `InstanceAdminPermission` (god-mode only)
  - Per-row `transaction.atomic()` — partial success allowed
  - Log unexpected exceptions, skip row

## Architecture

```
POST /api/instances/workspaces/bulk-remove-members/
  │
  ├─ validate list, length ≤ 500
  ├─ for each row:
  │    validate workspace_slug not empty
  │    validate user_id is valid UUID
  │    lookup Workspace(slug=workspace_slug) → skip "Workspace not found"
  │    lookup User(id=user_id) → skip "User not found"
  │    lookup WorkspaceMember(workspace, member, is_active=True) → skip "User not a member"
  │    check sole-admin guard (see below) → skip "User is sole admin of one or more projects"
  │    atomic: WorkspaceMember.is_active = False + ProjectMember bulk update
  │    append to removed[]
  └─ return response
```

**Sole-admin guard query** (adapted from `WorkSpaceMemberViewSet.destroy`):
```python
from django.db.models import Count, Q
from plane.db.models import Project

Project.objects.filter(workspace=workspace).annotate(
    admin_count=Count(
        "project_projectmember",
        filter=Q(project_projectmember__role=20, project_projectmember__is_active=True)
    ),
    user_is_admin=Count(
        "project_projectmember",
        filter=Q(project_projectmember__member=user, project_projectmember__role=20,
                 project_projectmember__is_active=True)
    ),
).filter(admin_count=1, user_is_admin=1).exists()
```
If `.exists()` → skip row with reason `"User is the sole admin of one or more projects in this workspace"`.

## Related Code Files

- Create: `apps/api/plane/license/api/views/workspace_member_bulk_remove.py`
- Modify: `apps/api/plane/license/api/views/__init__.py` — add import
- Modify: `apps/api/plane/license/urls.py` — register route

## Implementation Steps

1. Create `workspace_member_bulk_remove.py`:
   - Import: `logging`, `re`, `uuid`, `transaction`, `IntegrityError`, `Count`, `Q`, `timezone`
   - Import models: `User`, `Workspace`, `WorkspaceMember`, `ProjectMember`, `Project`
   - Import: `InstanceAdminPermission`, `BaseAPIView`
   - Class `InstanceWorkspaceBulkRemoveMembersEndpoint(BaseAPIView)`
   - `permission_classes = [InstanceAdminPermission]`
   - `def post(self, request)`: validate list → loop rows → guard → soft-delete → return

2. In `__init__.py` add:
   ```python
   from .workspace_member_bulk_remove import InstanceWorkspaceBulkRemoveMembersEndpoint
   ```

3. In `urls.py` after the bulk-assign-members path add:
   ```python
   path(
       "workspaces/bulk-remove-members/",
       InstanceWorkspaceBulkRemoveMembersEndpoint.as_view(),
       name="instance-workspace-bulk-remove-members",
   ),
   ```

## Success Criteria

- [ ] `POST /api/instances/workspaces/bulk-remove-members/` returns 200 with correct shape
- [ ] Valid row: `WorkspaceMember.is_active=False`, all `ProjectMember` rows soft-deleted
- [ ] Sole-admin row: skipped with descriptive reason, other rows unaffected
- [ ] Non-existent workspace/user/membership: skipped with reason
- [ ] 501+ rows: 400 response
- [ ] Empty list: 400 response

## Risk Assessment

- **ProjectMember cascade**: use `filter(workspace=workspace, member=user, is_active=True).update(is_active=False)` — already the pattern in `WorkSpaceMemberViewSet.destroy`
- **UUID validation**: validate with `uuid.UUID(user_id)` in try/except before DB lookup to avoid bad queries
