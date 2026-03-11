# Phase 01: Backend Permission Layer

## Overview

Extend the `allow_permission` decorator to support assignee-based access control on issue update endpoints.

## Context

- Decorator: `apps/api/plane/app/permissions/base.py`
- Issue view: `apps/api/plane/app/views/issue/base.py`
- Current `partial_update` decorator: `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)`

## Key Insight

The `allow_permission` decorator already supports `creator=True` which checks `model.objects.filter(id=pk, created_by=request.user).exists()`. We add a parallel `assignee=True` parameter.

## Implementation Steps

### 1. Modify `allow_permission` in `base.py`

File: `apps/api/plane/app/permissions/base.py`

Add `assignee=False` parameter to function signature.

```python
def allow_permission(allowed_roles, level="PROJECT", creator=False, model=None, assignee=False):
```

Inside `_wrapped_view`, after creator check block (line 24-27), add:

```python
# Check for assignee if required
if assignee and model == Issue:
    from plane.db.models import IssueAssignee
    is_assignee = IssueAssignee.objects.filter(
        issue_id=kwargs.get("pk"),
        assignee=request.user,
        deleted_at__isnull=True,
    ).exists()
    if is_assignee:
        return view_func(instance, request, *args, **kwargs)
```

Note: Import `IssueAssignee` inside the function to avoid circular imports. The `deleted_at__isnull=True` filter respects soft-delete.

### 2. Update `partial_update` decorator

File: `apps/api/plane/app/views/issue/base.py`, line 627

Change from:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)
```

To:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, assignee=True, model=Issue)
```

This means:

- Project ADMIN (role=20) can edit any issue
- Workspace ADMIN who is project member can edit any issue (existing fallback in decorator)
- Issue creator can edit (existing `creator=True`)
- Issue assignee can edit (new `assignee=True`)
- Regular MEMBER who is neither creator nor assignee gets 403

### 3. Consider `retrieve` endpoint

Line 492: `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue)`

No change needed -- read access stays open to all project members.

## Todo

- [x] Add `assignee` param to `allow_permission` decorator
- [x] Add `IssueAssignee` lookup logic in decorator
- [x] Update `partial_update` to `allowed_roles=[ROLE.ADMIN]` + `assignee=True`
- [x] Write unit test for permission edge cases
- [x] Test: regular member (not creator/assignee) gets 403 on PATCH
- [x] Test: assignee can PATCH
- [x] Test: creator can PATCH
- [x] Test: workspace admin can PATCH

## Success Criteria

- Non-creator, non-assignee MEMBER gets HTTP 403 on issue PATCH
- Creator gets HTTP 204 on issue PATCH
- Assignee gets HTTP 204 on issue PATCH
- Project ADMIN gets HTTP 204 on issue PATCH
- Workspace ADMIN (project member) gets HTTP 204 on issue PATCH
- No regression on other endpoints using `allow_permission`

## Security Considerations

- Soft-delete filter on `IssueAssignee` prevents deleted assignee records from granting access
- No information leak -- 403 response body is generic "You don't have the required permissions"

## Related Files

| File                                     | Change                               |
| ---------------------------------------- | ------------------------------------ |
| `apps/api/plane/app/permissions/base.py` | Add `assignee` param + logic         |
| `apps/api/plane/app/views/issue/base.py` | Update decorator on `partial_update` |

## Next Steps

After backend enforces permissions, proceed to Phase 02 to build frontend hook.
