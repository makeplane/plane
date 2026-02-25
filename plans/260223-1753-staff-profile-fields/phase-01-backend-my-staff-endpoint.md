# Phase 1: Backend — My Staff Profile Endpoint

## Context Links

- StaffProfile model: `apps/api/plane/db/models/staff.py`
- Existing staff serializer: `apps/api/plane/app/serializers/staff.py`
- Staff URLs: `apps/api/plane/app/urls/staff.py`
- Staff views: `apps/api/plane/app/views/workspace/staff.py`
- "me" pattern reference: `workspaces/<str:slug>/workspace-members/me/` in `urls/workspace.py`

## Overview

- **Priority**: P2
- **Status**: complete
- **Description**: Create GET-only endpoint returning current user's StaffProfile with department info. No admin permission required — authenticated workspace members only.

## Key Insights

- Existing staff endpoints require `WorkSpaceAdminPermission` — unsuitable for regular users viewing own profile
- `StaffProfileSerializer` already includes `department_detail` (id, name, code) and `position` — can reuse
- Pattern `workspaces/<slug>/me/...` already used for workspace member self-lookup
- StaffProfile has unique constraint on (workspace, user) — guaranteed 0 or 1 result

## Requirements

### Functional
- GET `/api/workspaces/{slug}/me/staff-profile/` returns current user's staff profile
- Response includes: staff_id, position, department (id + name)
<!-- Updated: Validation Session 1 - removed employment_status per scope decision -->
- Returns 404 if no StaffProfile exists for user in workspace

### Non-functional
- No N+1 queries — use `select_related("department")`
- No write operations (GET only)

## Architecture

```
MyStaffProfileEndpoint(BaseAPIView)
  permission_classes = [WorkspaceEntityPermission]  # any workspace member

  GET → StaffProfile.objects.select_related("department")
                     .get(workspace__slug=slug, user=request.user, deleted_at__isnull=True)
      → Serialize with lightweight serializer (subset of StaffProfileSerializer)
      → 404 if DoesNotExist
```

## Related Code Files

### Files to create
- None (add view + URL to existing files)

### Files to modify
1. `apps/api/plane/app/views/workspace/staff.py` — add `MyStaffProfileEndpoint` class
2. `apps/api/plane/app/urls/staff.py` — add URL pattern for `me/staff-profile/`
3. `apps/api/plane/app/serializers/staff.py` — add lightweight `MyStaffProfileSerializer` (optional, could reuse existing)

## Implementation Steps

1. **Add `MyStaffProfileSerializer`** in `apps/api/plane/app/serializers/staff.py`:
   ```python
   class MyStaffProfileSerializer(BaseSerializer):
       department_detail = serializers.SerializerMethodField()

       class Meta:
           model = StaffProfile
           fields = ["id", "staff_id", "position", "department", "department_detail"]
       # employment_status excluded per validation Session 1
           read_only_fields = fields

       def get_department_detail(self, obj):
           if not obj.department:
               return None
           return {"id": str(obj.department.id), "name": obj.department.name, "code": obj.department.code}
   ```

2. **Add `MyStaffProfileEndpoint`** in `apps/api/plane/app/views/workspace/staff.py`:
   ```python
   from plane.app.permissions import WorkspaceEntityPermission
   from plane.app.serializers.staff import MyStaffProfileSerializer

   class MyStaffProfileEndpoint(BaseAPIView):
       """Current user's own staff profile — read-only, no admin required."""
       permission_classes = [WorkspaceEntityPermission]

       def get(self, request, slug):
           try:
               staff = StaffProfile.objects.select_related("department").get(
                   workspace__slug=slug,
                   user=request.user,
                   deleted_at__isnull=True,
               )
           except StaffProfile.DoesNotExist:
               return Response({"detail": "Staff profile not found."}, status=status.HTTP_404_NOT_FOUND)

           serializer = MyStaffProfileSerializer(staff)
           return Response(serializer.data, status=status.HTTP_200_OK)
   ```

3. **Register URL** in `apps/api/plane/app/urls/staff.py`:
   - Import `MyStaffProfileEndpoint`
   - Add path: `"workspaces/<str:slug>/me/staff-profile/"` — **BEFORE** the `<uuid:pk>` pattern
   - name: `"my-staff-profile"`

4. **Register view export** — ensure `MyStaffProfileEndpoint` is importable from `views/workspace/staff.py`

## Todo List

- [ ] Add `MyStaffProfileSerializer` to serializers/staff.py
- [ ] Add `MyStaffProfileEndpoint` to views/workspace/staff.py
- [ ] Register URL in urls/staff.py (import + path)
- [ ] Verify endpoint works: returns staff data for user with profile
- [ ] Verify endpoint returns 404 for user without profile
- [ ] Verify non-workspace-member gets 403

## Success Criteria

- `GET /api/workspaces/{slug}/me/staff-profile/` returns staff data with department_detail
- 404 when no StaffProfile
- 403 when not workspace member
- No admin permission required
- Single query with select_related (no N+1)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| URL ordering conflict with `<uuid:pk>` | Low | Place `me/staff-profile/` BEFORE uuid patterns |
| Soft-deleted profiles returned | Low | Filter `deleted_at__isnull=True` explicitly |

## Security Considerations

- Users can ONLY see their OWN staff profile — filtered by `user=request.user`
- No write operations exposed
- WorkspaceEntityPermission ensures user is active workspace member
- No sensitive fields exposed (notes, phone excluded from serializer)

## Next Steps

- Phase 2: Frontend service + hook to call this endpoint
