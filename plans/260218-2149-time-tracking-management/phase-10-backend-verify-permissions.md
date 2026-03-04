# Phase 01: Backend — Verify & Fix Permissions

## Context Links

- Issue-level worklog view: `apps/api/plane/app/views/issue/worklog.py`
- Project-level worklog view: `apps/api/plane/app/views/project/worklog.py`
- Serializer: `apps/api/plane/app/serializers/worklog.py`

## Overview

- **Priority**: P1 (security prerequisite)
- **Status**: Pending
- **Description**: Verify backend PATCH/DELETE endpoints enforce admin-only permission. Fix if missing.

## Key Insights

- Frontend permission check is UX-only, not a security boundary
- `ProjectWorkLogViewSet` (list) allows ADMIN + MEMBER — correct for read
- Issue-level `IssueWorkLogViewSet` handles CRUD — need to check its update/destroy permissions
- Avatar field in serializer uses `obj.logged_by.avatar` — verify User model field name

## Requirements

- PATCH worklog: admin-only
- DELETE worklog: admin-only
- POST worklog (create): member + admin
- GET worklog (list): member + admin

## Related Code Files

- **Check**: `apps/api/plane/app/views/issue/worklog.py` (CRUD endpoint)
- **Check**: `apps/api/plane/app/serializers/worklog.py` (avatar field)
- **Check**: `apps/api/plane/db/models/worklog.py` (User model field reference)

## Embedded Rules

- Django ViewSet: use `@allow_permission` decorator per action
- BaseViewSet pattern: inherit from `BaseViewSet`
- Permission levels: `ROLE.ADMIN`, `ROLE.MEMBER`, `ROLE.GUEST`

## Implementation Steps

### 1. Check IssueWorkLogViewSet permissions

Read `apps/api/plane/app/views/issue/worklog.py` and verify:

- `create` action: allows ADMIN + MEMBER
- `partial_update` action: allows ADMIN only
- `destroy` action: allows ADMIN only

### 2. Fix permissions if needed

If update/destroy allow MEMBER, change to ADMIN-only:

```python
@allow_permission([ROLE.ADMIN])
def partial_update(self, request, ...):
```

### 3. Verify avatar field

Check User model for correct avatar field name (`avatar` vs `avatar_url`). Fix serializer if needed.

## Post-Phase Checklist

- [ ] PATCH worklog restricted to ADMIN
- [ ] DELETE worklog restricted to ADMIN
- [ ] POST worklog allows MEMBER + ADMIN
- [ ] Avatar field name matches User model
- [ ] No migration needed (permission-only change)

## Todo List

- [ ] Read IssueWorkLogViewSet permissions
- [ ] Fix PATCH/DELETE to admin-only if needed
- [ ] Verify avatar field in serializer
- [ ] Test endpoint permissions manually

## Success Criteria

- Backend rejects non-admin PATCH/DELETE with 403
- No regression on create/list for members
