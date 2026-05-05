# Phase 1: Backend Permissions

## Context Links

- [Plan Overview](plan.md)
- No dependencies

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 1h
- **Description**: Restrict module create/edit/delete API endpoints to project ADMIN (role=20) only. Keep read (list/retrieve) accessible to all project members.

## Key Insights

- App views (`apps/api/plane/app/views/module/base.py`) use `@allow_permission` decorator. Currently `create`, `partial_update` use `[ROLE.ADMIN, ROLE.MEMBER]`. `destroy` already uses `[ROLE.ADMIN]` with `creator=True`.
- API views (`apps/api/plane/api/views/module.py`) use `ProjectEntityPermission` class -- allows ADMIN+MEMBER for write. Need to add an in-view role check or swap permission class for write endpoints.
- `ProjectAdminPermission` exists in `apps/api/plane/app/permissions/project.py` -- blocks all non-ADMIN requests (including reads). Cannot use as class-level perm since we need read for all members.
- Archive/unarchive endpoints in `apps/api/plane/app/views/module/archive.py` do NOT use `@allow_permission` -- they rely on `ProjectEntityPermission` class. Need to add `@allow_permission([ROLE.ADMIN])` to archive/unarchive methods.
- Module issue endpoints (add/remove work items) should remain ADMIN+MEMBER since work item assignment is a member-level action.

## Requirements

- POST/PATCH/DELETE on module CRUD = ADMIN only
- GET on module = any project member (no change)
- Module issue add/remove = keep ADMIN+MEMBER (no change)
- Archive/unarchive = ADMIN only
- API views (`/api/v1/`) must enforce same restrictions
- `is_staff` users bypass via Django's existing staff check (no extra work needed)

## Architecture

Two view layers to update:

1. **App views** (`plane/app/views/module/base.py`, `archive.py`) -- `@allow_permission` decorator
2. **API views** (`plane/api/views/module.py`) -- `ProjectEntityPermission` class-level perm

For API views, the cleanest approach: create a new permission class `ProjectModulePermission` that allows reads for all members but writes for ADMIN only. Alternatively, swap to `ProjectAdminPermission` on write-specific view classes and keep `ProjectEntityPermission` on read views. Since the API views split list/create into `ModuleListCreateAPIEndpoint` and detail into `ModuleDetailAPIEndpoint`, we can use method-level checking inside `post`/`patch`/`delete`.

**Decision**: Add in-view admin check in API view `post`/`patch`/`delete` methods (simplest, no new permission class needed). Pattern: check `ProjectMember` role before proceeding.

## Related Code Files

- **Modify**: `apps/api/plane/app/views/module/base.py` (lines 294, 395, 651, 723)
- **Modify**: `apps/api/plane/app/views/module/archive.py` (archive/unarchive methods)
- **Modify**: `apps/api/plane/api/views/module.py` (post, patch, delete methods)

## Embedded Rules

```
- @allow_permission decorator controls method-level access in app views
- ProjectEntityPermission: read=any member, write=ADMIN+MEMBER (class-level)
- ProjectAdminPermission: all methods=ADMIN only
- Always scope queries with project__workspace__slug=slug
- Register new classes in __init__.py
- ROLE.ADMIN.value = 20, ROLE.MEMBER.value = 15, ROLE.GUEST.value = 5
```

## Implementation Steps

1. **Update app view `create` permission**
   - File: `apps/api/plane/app/views/module/base.py` line 294
   - Change: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` to `@allow_permission([ROLE.ADMIN])`
   - Applies to `create` method

2. **Update app view `partial_update` permission**
   - File: `apps/api/plane/app/views/module/base.py` line 651
   - Change: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` to `@allow_permission([ROLE.ADMIN])`

3. **Update app view `retrieve` permission**
   - File: `apps/api/plane/app/views/module/base.py` line 395
   - Change: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` to `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`
   - Retrieve is a read operation -- should allow all project members including guests

4. **Verify app view `destroy` permission**
   - Already `@allow_permission([ROLE.ADMIN], creator=True)` -- keep as is
   - Consider removing `creator=True` if only ADMIN should delete (not creators who are members). **Decision**: remove `creator=True` so only ADMIN can delete, not member-creators.
   - Change: `@allow_permission([ROLE.ADMIN], creator=True, model=Module)` to `@allow_permission([ROLE.ADMIN])`

5. **Add `@allow_permission` to archive methods**
   - File: `apps/api/plane/app/views/module/archive.py`
   - Import `allow_permission, ROLE` from `plane.app.permissions`
   - Add `@allow_permission([ROLE.ADMIN])` to `archive` (post) method
   - Add `@allow_permission([ROLE.ADMIN])` to `unarchive` (delete) method
   - Add `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` to `list` (get) method

6. **Update API view `post` (create module)**
   - File: `apps/api/plane/api/views/module.py`, `ModuleListCreateAPIEndpoint.post`
   - Add admin check at start of method:

   ```python
   if not ProjectMember.objects.filter(
       workspace__slug=slug, member=request.user,
       role=20, project_id=project_id, is_active=True
   ).exists() and not request.user.is_staff:
       return Response(
           {"error": "Only admins can create modules"},
           status=status.HTTP_403_FORBIDDEN,
       )
   ```

7. **Update API view `patch` (update module)**
   - File: `apps/api/plane/api/views/module.py`, `ModuleDetailAPIEndpoint.patch`
   - Add same admin check as step 6

8. **Update API view `delete` (delete module)**
   - File: `apps/api/plane/api/views/module.py`, `ModuleDetailAPIEndpoint.delete`
   - Remove the existing creator-or-admin check (lines 497-509), replace with admin-only check:

   ```python
   if not ProjectMember.objects.filter(
       workspace__slug=slug, member=request.user,
       role=20, project_id=project_id, is_active=True
   ).exists() and not request.user.is_staff:
       return Response(
           {"error": "Only admins can delete modules"},
           status=status.HTTP_403_FORBIDDEN,
       )
   ```

9. **Update API view archive/unarchive**
   - File: `apps/api/plane/api/views/module.py`, `ModuleArchiveUnarchiveAPIEndpoint`
   - Add admin check to `post` (archive) and `delete` (unarchive) methods

## Post-Phase Checklist

- [ ] All module mutation endpoints (create/update/delete/archive/unarchive) restricted to ADMIN
- [ ] All module read endpoints (list/retrieve) still accessible to all project members
- [ ] Module issue endpoints unchanged (ADMIN+MEMBER)
- [ ] ModuleUserProperties endpoints unchanged (ADMIN+MEMBER+GUEST)
- [ ] `pnpm check:lint` passes (no backend lint changes expected)
- [ ] Manual test: member cannot create/edit/delete module; admin can

## Todo List

- [ ] Update `@allow_permission` in `base.py` for create, partial_update, retrieve, destroy
- [ ] Add `@allow_permission` to archive.py methods
- [ ] Add admin checks in API views (module.py) for post, patch, delete, archive, unarchive
- [ ] Run `cd apps/api && python run_tests.py -u` to verify no regressions
- [ ] Mark phase complete in plan.md

## Success Criteria

- Non-admin members receive 403 on POST/PATCH/DELETE module endpoints
- Admin members can still perform all CRUD operations
- Read operations unaffected for all roles
- No breaking changes to module issue operations

## Risk Assessment

- **Low**: Changing decorator values is straightforward; existing pattern well-established
- **Medium**: API views lack `@allow_permission` decorator -- in-view checks are slightly less clean but functional
- **Mitigation**: Keep permission checks consistent between app and API views

## Security Considerations

- Enforces principle of least privilege for module management
- Admin role (20) is the highest project-level role
- `is_staff` bypass preserves system admin access
- No data exposure risk -- only restricting write access

## Next Steps

- Phase 3 (frontend permissions) depends on this completing first
