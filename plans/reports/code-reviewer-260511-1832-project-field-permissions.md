# Code Review — Project Field Permissions

**Score: 7.5/10**
**Branch:** `ngoc-feat/categories` vs `preview`
**Date:** 2026-05-11

## Summary

Feature is mostly solid: helper-based dual-API enforcement, soft-delete-safe unique constraint, lazy `get_or_create`, dual-level admin check on PATCH, optimistic rollback in store, CE boundary respected, activity log emitted. Two critical issues, several high-priority items.

---

## CRITICAL (blockers)

### C1. Hard-coded admin role constant — drift hazard

`apps/api/plane/utils/work_item_permission_checker.py:26` defines `_ADMIN_ROLE = 20`. The canonical source is `plane.app.permissions.ROLE.ADMIN.value`. If `ROLE` enum ever shifts, this silently grants/blocks the wrong users.
**Fix:** `from plane.app.permissions import ROLE` and use `ROLE.ADMIN.value`.

### C2. External API delete bypass for delete-toggle

`apps/api/plane/api/views/issue.py:804` `IssueDetailAPIEndpoint.delete` — the pre-existing creator check at line ~815 (`Only admin or creator can delete`) returns 403 BEFORE the new field-permission check runs. So when `allow_member_delete_work_item=True` AND user is non-admin non-creator, delete is still blocked — fine. But the inverse: a **creator who is a MEMBER** can always delete even when toggle is OFF, because creator check passes first and `_is_admin` returns False so check fires... actually re-read: helper returns 403 when not admin and `allow_delete=False`. ✓ OK.
**Real issue:** the external API check uses `request_payload={}` for delete (line 850) — fine, but `current_instance` here is `issue` ORM instance, not a dict. The helper uses `getattr(current_instance, field_key, None)` — works for both. ✓ OK.

Removing C2; not a blocker.

---

## HIGH

### H1. N+1: per-request 3 queries for every issue update

`base.py:732-748` and `api/views/issue.py:725-740`: each `partial_update`/`destroy` runs 3 separate queries (ProjectFieldPermission, ProjectMember, WorkspaceMember). For bulk operations these compound.
**Fix:** Either (a) consolidate to single combined query, or (b) add `select_related("project__field_permission")` to issue fetch — but FK is reverse so use `prefetch_related`. At minimum, cache `user_project_role` + `user_workspace_role` on `request` once; they're already loaded by `@allow_permission`.

### H2. `destroy` decorator now allows MEMBER without creator gate at app layer

`apps/api/plane/app/views/issue/base.py:822` changed from `@allow_permission([ROLE.ADMIN], creator=True, model=Issue)` to `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], creator=True, model=Issue)`. This widens delete from admin-only to **all members** when toggle is ON. The plan says "no creator/assignee exception" — so toggle ON means any member can delete any work item. Confirm this is the intended semantics (matches plan Q9, but verify no implicit reliance on `creator=True` filter elsewhere).
Also: GUEST is excluded — confirm desired.

### H3. Workflow `state_id` change not gated

Plan v1 scope explicitly defers `state_id`, but completed_at often follows state. Members can still flip state to a "completed" group state which auto-sets `completed_at` server-side — bypassing the date lock. Confirm server does NOT auto-set `completed_at` outside this helper's check path.

### H4. Empty→Value rule edge: empty string vs None

Helper compares `new_value != old_value`. If frontend sends `""` to clear, and `old_value` is a `datetime` object, `"" != datetime` is True → blocked. Good. But if frontend sends ISO string and `old_value` is already-parsed `datetime`, `"2026-05-11" != datetime(...)` is True → false-positive block on no-op resubmit.
**Fix:** Parse/normalize both sides before compare, or compare against `serializer.validated_data` after DRF coercion.

---

## MEDIUM

### M1. Helper signature uses `Response` from DRF — couples utility to view layer

`utils/work_item_permission_checker.py` returning a `Response` makes it untestable as a pure function and leaks framework concerns into utils. Prefer raising a custom exception or returning a `(bool, str)` tuple; views translate to Response.

### M2. Activity log lazy import inside method

`field_permission.py:89` imports `model_activity` and `base_host` inside `_log_toggle_activity`. Move to module top unless circular.

### M3. `_get_or_create` race

`ProjectFieldPermission.objects.get_or_create(project=project, ...)` under concurrent first-load can hit unique constraint. Wrap in `try/except IntegrityError` + re-fetch, or use `select_for_update`. Low probability but real.

### M4. `cacheKey` uses `:` separator while plan says `_`

Cosmetic mismatch with plan; not a bug.

### M5. Optimistic update merges shallow

`{ ...original, ...payload }` — fine for flat boolean record. Confirmed safe.

---

## LOW

- `useSWR` fetcher in project layout returns void from store action; SWR `data` will be undefined — fine, used as trigger. ✓
- Migration uses dependency `0168_add_issue_workitems_index` — verify still the latest in `preview` before merge.
- `Issue.objects` vs `Issue.issue_objects` not used in new code (only existing fetch reused). ✓

---

## Verified Good

- Soft-delete-safe `UniqueConstraint(fields=["project"], condition=Q(deleted_at__isnull=True))` ✓
- Dual-level admin check on PATCH explicit, not relying on resolver ✓
- Helper called from BOTH `app/views/issue/base.py` AND `api/views/issue.py` ✓
- CE boundary: only `app/.../[projectId]/layout.tsx` and a `core/hooks/store/` hook touched in core/app ✓
- Optimistic rollback present in store ✓
- Activity log diffs old vs new and skips no-ops ✓
- Empty→Value rule correctly implemented for both `project_fp is None` and present cases ✓

---

## Blockers

**C1** must be fixed before merge.

## Unresolved Questions

1. H2 — Is widening `destroy` to all MEMBERs (no creator filter when toggle ON) intentional? Plan Q9 implies yes.
2. H3 — Does state transition to "completed" group auto-set `completed_at` server-side? If yes, this is a known bypass.
3. H4 — Confirm payload normalization for date comparisons; add a regression test for `value→same value` no-op.

**Status:** DONE_WITH_CONCERNS
**Summary:** Implementation matches plan; one blocker (hard-coded role), one query-efficiency concern, one widening of delete permissions to validate with product.
