# staff-profile-404-investigation.md

# Track C.2-C.3 — /api/workspaces/{slug}/me/staff-profile/ 404 investigation

## Summary

404 is the **intended API contract** for users with no StaffProfile row. No code change needed.

## URL Routing (verified)

Frontend caller:
apps/web/ce/services/staff.service.ts:104
GET /api/workspaces/${workspaceSlug}/me/staff-profile/

Backend route:
apps/api/plane/app/urls/staff.py:14-18
path("workspaces/<str:slug>/me/staff-profile/", MyStaffProfileEndpoint, name="my-staff-profile")

Match: EXACT. No URL mismatch. Routing is correct.

Dead service (already deleted — C.1):
apps/web/ce/services/my-staff-profile.service.ts — had zero callers, deleted in prior phase step.

## View behavior (staff_profile.py:11-27)

```python
class MyStaffProfileEndpoint(BaseAPIView):
    def get(self, request):
        try:
            staff = StaffProfile.objects.select_related("department").get(
                user=request.user,
                deleted_at__isnull=True,
            )
        except StaffProfile.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MyStaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)
```

Raises 404 when no StaffProfile row exists for the requesting user. This is explicit, intentional behavior.

## Database query result

```sql
SELECT COUNT(*) FROM staff_profiles;
-- Result: 0

SELECT COUNT(*) FROM staff_profiles WHERE deleted_at IS NULL;
-- Result: 0

SELECT user_id, department_id, deleted_at FROM staff_profiles LIMIT 5;
-- Result: (0 rows)
```

No StaffProfile rows exist in the local dev database. This confirms the 404 is data-driven.

## Frontend hook behavior

apps/web/ce/hooks/use-my-staff-profile.ts uses StaffService.getMyStaffProfile().
The hook already handles 404 gracefully — hides the staff profile section silently.
No UI crash. No error toast. Section simply absent from UI.

## Decision (per plan C.3)

Finding: "User has no StaffProfile row" — confirmed.
Action: Document and close. No DB seeding, no view change, no frontend change.

The 404 response is the correct contract:

- 200 + data → user has a StaffProfile row
- 404 → user has no StaffProfile row (section hidden by hook)

This is a staffing/admin concern (rows must be created by admin via
POST /api/workspaces/{slug}/staff/), not a code bug.

## No further action

- No view change (404 is correct)
- No DB seeding (out of scope, admin responsibility)
- No frontend change (hook already handles 404 silently)
- If a different root cause surfaces in production (e.g. wrong workspace slug,
  auth mismatch, deleted row not restored) → file as separate issue
