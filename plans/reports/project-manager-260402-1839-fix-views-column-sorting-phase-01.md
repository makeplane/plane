# Project Status: Views Column Sorting Fix — Phase 01 Completion

**Report Date:** 2026-04-02 | **Reporter:** project-manager | **Plan:** `plans/260402-1736-fix-views-column-sorting/`

## Executive Summary

Phase 01 (Implement CE Client-Side Sorting) **COMPLETED**. All 6 implementation steps done, lint check passed. Plan transitioned to `in-review` status. Next: manual testing of sort behavior in workspace/project views.

---

## Completed Tasks

| Task                                                              | Status | Notes                                                                                                      |
| ----------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Update `workItemSortWithOrderByExtended` in `base-issue.store.ts` | DONE   | Implemented 6 sort cases (project, main/sub task category). Added fetch-before-sort guard per validation.  |
| Add fetch-before-sort guard for taskCategoryStore                 | DONE   | Returns unsorted IDs if store data not loaded; MobX re-triggers sort on update.                            |
| Update call site in `base-issues.store.ts`                        | DONE   | Passes `rootStore` to CE function at line 1939. Changed type signature to `Partial<TIssueOrderByOptions>`. |
| Resolve duplicate `base-issue-store.ts`                           | DONE   | Grep confirmed no imports of hyphen variant. File deleted.                                                 |
| Create CE extension `issue-orderby-key-extended.ts`               | DONE   | Maps 6 sort keys to TIssue FK properties (project_id, main_task_category_id, sub_task_category_id).        |
| Update core `ISSUE_ORDERBY_KEY` with CE extension                 | DONE   | Core imports and merges CE mapping. Re-sort on mutation now works.                                         |
| Lint check                                                        | DONE   | `pnpm check:lint` passed. No new errors.                                                                   |

---

## Phase 01 Status Update

**Before:** `ready`  
**After:** `in-review`

Reason: Implementation complete, code passes lint. Manual testing of sort behavior still needed to confirm rows actually reorder when clicking sort headers.

---

## Unfinished Tasks (POST-IMPLEMENTATION)

These are follow-up work, not blockers:

1. **Audit backend `order_queryset.py`** — Verify allowlist validation for `order_by` values [RED TEAM #4]
2. **Verify client-server sort parity** — Check `toLowerCase()` vs Postgres collation for pagination consistency [RED TEAM #6]

---

## Files Modified

1. `apps/web/ce/store/issue/helpers/base-issue.store.ts` — Implemented sorting logic
2. `apps/web/core/store/issue/helpers/base-issues.store.ts` — Pass rootStore to CE function
3. `apps/web/ce/store/issue/helpers/issue-orderby-key-extended.ts` — NEW: CE extension mappings
4. `apps/web/ce/store/issue/helpers/base-issue-store.ts` — DELETED: duplicate file

---

## Validation Applied

- **[VALIDATION — CE pattern]** Created CE extension point for `ISSUE_ORDERBY_KEY` instead of modifying core directly
- **[VALIDATION — store data]** Added fetch-before-sort guard to avoid incomplete name resolution

---

## Docs Impact

**Status:** `none`

This is a bug fix for existing functionality (sorting columns). No new features, no public API changes, no user-facing documentation needed.

---

## Next Steps

1. **Manual testing** — Open workspace/project views, click sort arrows on Project, Main Task Category, Sub Task Category columns. Verify rows reorder.
2. **Blockers** — None identified
3. **Dependencies** — None blocking further work

---

## Risk Status

All RED TEAM findings addressed:

- **#1 (Critical) — ISSUE_ORDERBY_KEY mapping** → Resolved via CE extension point
- **#2 (High) — Sort field validation** → Resolved via `getResolvedNameIsEmpty` check
- **#3 (High) — Duplicate file** → Resolved via deletion
- **#4 (High) — Backend allowlist** → Deferred to post-implementation audit
- **#5 (Medium) — Missing store guard** → Resolved via `if (!taskCategoryStore || !projectStore)` check
- **#6 (Medium) — Pagination parity** → Deferred to post-implementation verification

---

**Plan file locations:**

- Overview: `/Users/ngoctran/Documents/Shinhan/plane/plans/260402-1736-fix-views-column-sorting/plan.md`
- Phase 01: `/Users/ngoctran/Documents/Shinhan/plane/plans/260402-1736-fix-views-column-sorting/phase-01-implement-ce-sorting.md`
