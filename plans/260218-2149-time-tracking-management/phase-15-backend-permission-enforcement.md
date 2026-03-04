# Phase 6: Backend Permission Enforcement

## Context Links

- [Plan Overview](./plan.md)
- [Phase 5 — Validation rules](./phase-05-backend-validation-rules.md) (dependency)
- Issue worklog view: `apps/api/plane/app/views/issue/worklog.py`
- Permissions: `apps/api/plane/app/permissions/base.py`
- Activity root: `apps/web/ce/components/issues/worklog/activity/root.tsx`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 30m
- **Description**: Enforce new permission rules — MEMBER cannot edit/delete worklogs; ADMIN can only edit/delete within 7 working days of `logged_at`.

## Key Insights

- Current state: `partial_update` and `destroy` use `@allow_permission(allowed_roles=[ROLE.ADMIN])` — already blocks MEMBER. Good.
- Missing: 7-working-day window check for ADMIN. Currently ADMIN can edit/delete any worklog regardless of age.
- `get_min_allowed_date()` from Phase 5 can be reused for the window check.
- Need to return 403 (not 400) for permission-based rejections vs validation errors.

## Requirements

- **R1**: MEMBER role → 403 on PATCH/DELETE (already enforced by `@allow_permission`)
- **R2**: ADMIN role → can PATCH/DELETE only if `worklog.logged_at >= get_min_allowed_date(7)`
- **R3**: Worklogs older than 7 working days → locked for everyone (no edit/delete)
- **R4**: CREATE remains open to ADMIN + MEMBER (subject to validation from Phase 5)

## Architecture

```
PATCH/DELETE request
  → @allow_permission([ROLE.ADMIN])     # blocks MEMBER (existing)
  → View method: check worklog.logged_at >= min_allowed_date
    → If too old: return 403 "Worklog is locked"
    → If within window: proceed with update/delete
```

## Related Code Files

- **Modify**: `apps/api/plane/app/views/issue/worklog.py`
  - Add `_check_edit_window()` helper
  - Call in `partial_update()` and `destroy()` before mutation

## Embedded Rules

```
- @allow_permission([ROLE.ADMIN]) — already on partial_update/destroy
- Return 403 for permission issues, 400 for validation issues
- current_instance capture BEFORE update for activity diff
- issue_activity.delay() after mutations
```

## Implementation Steps

1. **Import `get_min_allowed_date` from serializer module**

   ```python
   from plane.app.serializers.worklog import get_min_allowed_date
   ```

   Or define it in a shared utils location if preferred. Since it's small, importing from serializer module is fine (KISS).

2. **Add `_check_edit_window()` helper in `IssueWorkLogViewSet`**

   ```python
   def _check_edit_window(self, worklog):
       """Return True if worklog is within editable window (7 working days)."""
       min_date = get_min_allowed_date(working_days=7)
       return worklog.logged_at >= min_date
   ```

3. **Update `partial_update()` — add window check after fetching worklog**

   ```python
   worklog = IssueWorkLog.objects.get(...)
   if not self._check_edit_window(worklog):
       return Response(
           {"error": "This worklog is locked and cannot be edited. Worklogs older than 7 working days are read-only."},
           status=status.HTTP_403_FORBIDDEN,
       )
   # ... existing serializer + save + activity logic
   ```

4. **Update `destroy()` — add window check after fetching worklog**

   ```python
   worklog = IssueWorkLog.objects.get(...)
   if not self._check_edit_window(worklog):
       return Response(
           {"error": "This worklog is locked and cannot be deleted. Worklogs older than 7 working days are read-only."},
           status=status.HTTP_403_FORBIDDEN,
       )
   # ... existing delete + activity logic
   ```

5. **Verify MEMBER is already blocked**
   - Confirm `@allow_permission(allowed_roles=[ROLE.ADMIN])` is on both `partial_update` and `destroy`
   - No changes needed for MEMBER blocking — already done in Phase 1

## Post-Phase Checklist

- [ ] `partial_update()` checks 7-working-day window before allowing edit
- [ ] `destroy()` checks 7-working-day window before allowing delete
- [ ] Returns 403 (not 400) for permission/window violations
- [ ] MEMBER still blocked by `@allow_permission([ROLE.ADMIN])`
- [ ] CREATE unchanged — ADMIN + MEMBER can still create
- [ ] Error messages clearly explain why action is locked
- [ ] `get_min_allowed_date` reused from Phase 5

## Todo List

- [ ] Import `get_min_allowed_date`
- [ ] Add `_check_edit_window()` helper
- [ ] Add window check to `partial_update()`
- [ ] Add window check to `destroy()`
- [ ] Verify MEMBER blocking still in place
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- ADMIN can edit worklog from 3 working days ago → 200 OK
- ADMIN tries to edit worklog from 10 working days ago → 403
- MEMBER tries to edit any worklog → 403 (existing behavior)
- ADMIN can delete worklog from today → 204
- ADMIN tries to delete worklog from 10 working days ago → 403

## Risk Assessment

- **Weekend edge case**: If worklog `logged_at` is a weekend day (data from before this rule), the comparison `logged_at >= min_date` still works correctly since we compare dates directly.
- **Timezone**: Same as Phase 5 — `date.today()` is server TZ. Acceptable trade-off.

## Security Considerations

- 403 responses don't leak worklog content — just error message
- Server-side enforcement; frontend just reflects backend rules

## Next Steps

- Phase 7 uses these permission rules to conditionally show/hide UI elements
- Frontend needs to know if a worklog is editable → derive from `logged_at` date comparison client-side
