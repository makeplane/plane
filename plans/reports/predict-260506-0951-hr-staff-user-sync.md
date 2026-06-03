# Prediction Report: HR Staff + User Sync API (Phase 1)

**Date:** 2026-05-06
**Spec:** `docs/hr-system-integration-spec.md` v1.2
**Scope:** Staff upsert + deactivation only (no department sync)

---

## Verdict: CAUTION

Phase 1 scope is narrowed to staff + user sync. One critical gap and several medium issues remain before implementation.

---

## Agreements (all personas align)

1. **PAT auth will work** — `APIToken` + `APIKeyAuthentication` middleware already exist in External API v1
2. **Sync endpoints must be built** — they don't exist in `plane/api/` yet
3. **User fields must sync on update** — spec now explicitly calls out `first_name`, `last_name`, `display_name` update on existing staff sync
4. **Header is `X-Api-Key`** — spec updated to match actual middleware code
5. **Workspace scope must be enforced** — PAT workspace FK exists but isn't validated during auth

---

## Conflicts & Resolutions

| Topic                                  | Architect                                                                  | Security                                                | Performance | UX                             | Devil's Advocate                                                | Resolution                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | ----------- | ------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **User update on existing staff sync** | Spec now says update User fields, not just StaffProfile                    | Good — HR becomes source of truth for names             | N/A         | Consistent names across Plane  | Simpler: only update StaffProfile, let admin manually edit User | **Keep spec as-is** — User fields must sync. HR is source of truth.              |
| **Email immutability**                 | Email derived from staff_id, never changes after creation                  | Good security property — prevents takeover              | N/A         | User can't change own email    | What if HR staff_id format changes?                             | **Document as contract** — staff_id must never change for a given person         |
| **Deactivation cascades**              | Must set both `User.is_active=false` AND `WorkspaceMember.is_active=false` | Revokes access completely                               | N/A         | Clear signal in UI member list | What about project memberships?                                 | **Spec correct** — also remove from all project memberships per spec section 5.2 |
| **Workspace scope on PAT**             | APIToken has workspace FK but not checked in auth                          | HR token with instance scope could access any workspace | N/A         | N/A                            | Simplest: just validate in new endpoints                        | **Add 403 if PAT.workspace != URL slug** in each new endpoint                    |

---

## Risk Summary

| Risk                                                               | Severity     | Mitigation                                                                                                                                 |
| ------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| User.first_name/last_name NOT updated on staff sync (previous gap) | **Critical** | Explicitly update `User` record in sync endpoint for existing staff                                                                        |
| PAT workspace scope not validated                                  | **High**     | Add workspace check: if `api_token.workspace.slug != slug`, return `403 Forbidden`                                                         |
| Deactivation only sets StaffProfile, not User.is_active            | **High**     | Sync endpoint must call `user.is_active = False` and `user.save()`                                                                         |
| Bulk-sync partial failure handling                                 | **Medium**   | Decide: best-effort (continue on failure) or atomic (rollback all). Recommend best-effort for HR — individual error responses per staff_id |
| Rate limiting not yet implemented                                  | **Medium**   | Add `throttle_classes = [HRIntegrationRateThrottle]` to new viewset                                                                        |

---

## Recommendations

1. **User update on existing staff** — In `POST /staff/sync/`, add this logic:

   ```
   if staff_profile.user exists:
       user.first_name = data['first_name']
       user.last_name = data['last_name']
       user.display_name = f"{data['last_name']} {data['first_name']}"
       user.save()
   ```

2. **Workspace scope guard** — Add at top of each new endpoint:

   ```python
   if api_token.workspace and api_token.workspace.slug != slug:
       return Response({"error": {"code": "FORBIDDEN", "message": "Token not scoped to this workspace"}}, status=403)
   ```

3. **Deactivation must cascade** — `POST /staff/{staff_id}/deactivate/`:

   ```python
   staff.employment_status = 'resigned'
   staff.date_of_leaving = date_of_leaving
   staff.save()
   staff.user.is_active = False
   staff.user.save()
   WorkspaceMember.objects.filter(user=staff.user, workspace=workspace).update(is_active=False)
   # Also remove from project memberships
   ```

4. **Bulk-sync should be best-effort** — Return per-item status, continue processing on failure

5. **HR service actor** — Create or use a system service `User` record for activity logging, identified as "HR System Integration"

---

## Unresolved Questions

1. Should bulk-sync be atomic (all-or-nothing) or best-effort (continue on failure)?
2. What role should the HR PAT have — Workspace Admin or Instance Admin?
3. Should `is_manager=true` also update `Department.manager` FK (Phase 2 concern)?
4. What happens if HR sends a staff sync for a `department_code` that doesn't exist yet?
