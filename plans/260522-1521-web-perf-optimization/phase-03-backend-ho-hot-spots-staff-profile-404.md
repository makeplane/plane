---
phase: 3
title: "Backend /ho/ Hot Spots + staff-profile 404"
status: pending
priority: P1
effort: "6h"
dependencies: []
---

# Phase 3: Backend /ho/ Hot Spots + staff-profile 404

## Overview

Three backend issues from the debug reports: (a) `/api/ho/filter-options/` TTFB 400 ms firing **multiple** times per page load; (b) `/api/ho/issues/` TTFB 407 ms; (c) silent 404 on `/api/workspaces/{slug}/me/staff-profile/` — frontend URL is **correct** (matches backend route at `apps/api/plane/app/urls/staff.py:17`); 404 is data-driven (user has no `StaffProfile` row), not a routing bug.

## Context Links

- Report: `plans/reports/debug-260522-1514-authenticated-pages-perf.md` § "Key observations" 5, "Recommendations" 4-5
- Backend view: `apps/api/plane/app/views/ho.py:228-299` (`HoIssueListView`) + `HoFilterOptionsView`
- Backend URL: `apps/api/plane/app/urls/ho.py:27`
- Frontend callers (multi-fire): `apps/web/ce/components/ho/ho-datasheet-view.tsx`, `apps/web/ce/components/ho/ho-category-view.tsx`, plus **5 internal `fetchFilterOptions()` calls inside** `apps/web/ce/store/ho/ho-issue.store.ts:297,331,341,369,378`
- Dead service (zero callers — remove): `apps/web/ce/services/my-staff-profile.service.ts`
- Real staff-profile caller: `apps/web/ce/services/staff.service.ts:104` (URL is **correct**, matches backend)
- Hook using real service: `apps/web/ce/hooks/use-my-staff-profile.ts` → uses `StaffService.getMyStaffProfile()`
- staff-profile backend view: `apps/api/plane/app/views/user/staff_profile.py:11-27`, route in `apps/api/plane/app/urls/staff.py:17`

## Key Insights

- `HoIssueListView` queryset uses `.distinct()` + `select_related` but no visible `prefetch_related` for many-to-many. Possible N+1 — but verify against actual serializer fields before adding (don't prefetch unused relations).
- `fetchFilterOptions()` has 2 mount-time call sites in view components **plus** 5 internal calls inside store methods (`updateFilters`, `clearFilters`, `applyDateRange`, etc. at `ho-issue.store.ts:297,331,341,369,378`). Mount-time double-fire is the visible symptom; internal re-fires compound it on every filter tick.
- staff-profile 404 is **not** a routing issue (verified — frontend URL `apps/web/ce/services/staff.service.ts:104` matches backend route `apps/api/plane/app/urls/staff.py:17`). Most likely cause: requesting user has no `StaffProfile` row in DB. Investigation needed before any "fix".

## Requirements

- Functional:
  - `/api/ho/filter-options/` fires exactly once on `/ho/` mount; no compound re-fires per filter tick
  - `/api/ho/filter-options/` TTFB ≤150 ms (P50, 100 issues)
  - `/api/ho/issues/?page=1` TTFB ≤200 ms (P50)
  - `/api/workspaces/{slug}/me/staff-profile/` returns 200 for users with a `StaffProfile` row; remaining 404s are real (no row) and handled silently by the hook (current behavior — keep)
- Non-functional: no schema changes that require destructive migration; psql `EXPLAIN ANALYZE` evidence captured

## Architecture

Three parallel fix tracks:

### Track A: Dedupe `filter-options` calls (frontend)

Two-stage:

**A.1 Instrument first.** Before changing call sites, add `console.trace()` inside `fetchFilterOptions()` in `apps/web/ce/store/ho/ho-issue.store.ts` and reload `/ho/`. Capture exact firing pattern (count + originating stack) to `artifacts/ho-filter-options-traces.txt`. Plan from evidence, not assumption.

**A.2 Dedupe based on traces.**

- Single mount effect in parent (`ho/page.tsx` or shared layout) — remove redundant `useEffect` mounts from `ho-datasheet-view.tsx` and `ho-category-view.tsx`.
- Audit the 5 internal callers at `ho-issue.store.ts:297,331,341,369,378` — most are filter-change-driven and legitimate, but verify each. Collapse repeated callers into one canonical helper if traces show duplicate work.
- **In-flight promise dedupe at store level:** if traces show same-tick duplicate calls survive, gate with a `_filterOptionsInflight: Promise | null` field so concurrent callers reuse the same fetch.

**A.3 Null-race audit (BLOCKER for A.2).** `store.filterOptions: THoFilterOptions | null = null` at `ho-issue.store.ts:81`. Removing child mount fetches risks rendering before the parent fetch resolves. Grep all `filterOptions.*` consumers, confirm null-safe access (`filterOptions?.foo`), and verify the parent effect awaits/blocks the children with a Suspense or loading sentinel. Document audit results in the implementation step.

### Track B: Backend query optimization (`HoFilterOptionsView` + `HoIssueListView`)

1. **Serializer audit first.** Read the serializer used by `HoIssueListView` and list which related fields are actually emitted. Only prefetch fields that hit serialization. Do NOT blindly add `prefetch_related("assignees", "labels", "work_logs")` — if `work_logs` is not serialized, prefetching it wastes work and memory.
2. Run `psql EXPLAIN ANALYZE` against the actual SQL emitted by each view (use Django `connection.queries` or `django-debug-toolbar` snapshot). Save to `artifacts/ho-explain-analyze.txt`.
3. Identify: missing indexes, redundant aggregations, missing `prefetch_related`, full-table scans in facet counts.
4. Fix in this order, **each gated by evidence from steps 1–2**:
   - Add `prefetch_related(...)` ONLY for relations the serializer audit confirmed are serialized.
   - Replace per-row aggregates with single GROUP BY query if facets are computed per-issue.
   - **Composite index — gated strictly on EXPLAIN.** Only add if EXPLAIN shows a sequential scan on the relevant column combination. Reference migration template: `apps/api/plane/db/migrations/0168_add_issue_workitems_index.py` (uses `atomic = False` + `RunSQL("CREATE INDEX CONCURRENTLY ...")` + `reverse_sql`). Do not add speculative indexes.
   - **Caching — DEFERRED.** Do not add `cache_response` until after Track A dedupe + Track B prefetch fixes are measured. If still needed: use `apps/api/plane/utils/cache.py` `cache_response(timeout=60, ...)`; specify cache key explicitly (`(workspace_id, user_id, from_date, to_date)`); design Django signal-based invalidation on relevant model `post_save`/`post_delete` for the issue/worklog models — short TTL alone is not enough if writes must reflect immediately.

### Track C: staff-profile 404 — REWRITE (route is correct, fix is elsewhere)

The original report's premise (frontend hits a nonexistent v1 URL) is **wrong**. Verification:

- Real caller is `apps/web/ce/services/staff.service.ts:104` → `GET /api/workspaces/${slug}/me/staff-profile/`
- Backend route: `apps/api/plane/app/urls/staff.py:17` (matches exactly)
- The file `apps/web/ce/services/my-staff-profile.service.ts` is dead code (zero callers — verified by grep).

Real work:

**C.1 Delete dead service.** Remove `apps/web/ce/services/my-staff-profile.service.ts` entirely. Confirm zero imports first (`grep -rn 'MyStaffProfileService\|my-staff-profile.service'` across `apps/web`).

**C.2 Investigate the real 404.** Reproduce 404 with the test user, then check backend:

- Query DB: `SELECT * FROM staff_profile WHERE user_id = '<test-user-id>';` — most likely returns 0 rows.
- Read `apps/api/plane/app/views/user/staff_profile.py:11-27` to confirm view raises 404 on missing row (vs returning empty payload).

**C.3 Decision point (gated on C.2 findings).** Pick after evidence:

- If 404 means "user has no StaffProfile row" → current hook behavior is correct (`apps/web/ce/hooks/use-my-staff-profile.ts` catches and hides section). Document as intended; no code change needed.
- If 404 has another cause (real bug in view, missing workspace member check, etc.) → file as separate issue; out of scope for this phase.

## Related Code Files

- Modify: `apps/web/ce/components/ho/ho-datasheet-view.tsx` (remove mount fetchFilterOptions)
- Modify: `apps/web/ce/components/ho/ho-category-view.tsx` (remove mount fetchFilterOptions)
- Modify: `apps/web/ce/store/ho/ho-issue.store.ts` (instrument first; add `_filterOptionsInflight` if needed; audit lines 297,331,341,369,378)
- Modify: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` (add single mount effect — or move to ho layout)
- Modify: `apps/api/plane/app/views/ho.py` (querysets in HoFilterOptionsView, HoIssueListView — evidence-gated)
- Possibly create: new migration in `apps/api/plane/db/migrations/` (composite index ONLY if EXPLAIN shows seq scan; template: `0168_add_issue_workitems_index.py`)
- **Delete:** `apps/web/ce/services/my-staff-profile.service.ts` (dead code — verified zero callers)
- Read for context: `apps/api/plane/app/views/user/staff_profile.py`, `apps/api/plane/app/urls/staff.py`, serializer file imported by `HoIssueListView`, `apps/web/ce/hooks/use-my-staff-profile.ts`

## Implementation Steps

1. **Track A (frontend dedupe):**
   - **A.1** Instrument `fetchFilterOptions()` with `console.trace()`; reload `/ho/`; save trace dump to `artifacts/ho-filter-options-traces.txt`
   - **A.2** Audit `store.filterOptions.*` consumers — grep all read sites, confirm null-safe access, document at `artifacts/ho-filter-options-null-audit.md`
   - **A.3** Move single mount call to `ho/page.tsx` or parent layout; remove from child views
   - **A.4** Evidence-gated (Validation Log Session 1): add `_filterOptionsInflight: Promise<...> | null` store field ONLY if `artifacts/ho-filter-options-traces.txt` shows same-tick duplicates remaining after A.3. Do not apply preemptively.
   <!-- Updated: Validation Session 1 - inflight dedupe gated on trace evidence -->
   - **A.5** Confirm no race: filter-options must complete before children render dependent UI (parent gates with loading sentinel)

2. **Track B step 1 — Reproduce + measure:**
   - Enable `LOGGING` for `django.db.backends` locally
   - Hit `/api/ho/filter-options/` and `/api/ho/issues/` with realistic data
   - Capture SQL + `EXPLAIN ANALYZE` output to `plans/260522-1521-web-perf-optimization/artifacts/ho-explain-analyze.txt`

3. **Track B step 2 — Fix queries:**
   - Add missing `prefetch_related` based on serializer fields used
   - Add composite index migration if EXPLAIN shows sequential scan on workspace_id+project_id
   - If facets recompute heavy aggregates, add `@cache_response(timeout=60, ...)` decorator (check if Plane already has cache_response utility)
   - Re-measure: capture before/after EXPLAIN to `ho-explain-analyze.txt`

4. **Track C — staff-profile (rewritten):**
   - **C.1** Grep confirm zero callers of `MyStaffProfileService`, then delete `apps/web/ce/services/my-staff-profile.service.ts`
   - **C.2** Reproduce 404 with test user; `psql` query `staff_profile` table for that user_id; capture findings to `artifacts/staff-profile-404-investigation.md`
   - **C.3** Validation Log Session 1 decision: do NOT seed `StaffProfile` rows, do NOT change view to return 200 + empty. The 404 is the correct API contract for "no row"; `apps/web/ce/hooks/use-my-staff-profile.ts` already hides the section silently. If C.2 confirms "missing row" → document in artifact and close. If C.2 finds a different root cause → file as separate issue, out of scope.
   <!-- Updated: Validation Session 1 - 404 is intended; no DB seeding, no view change -->

5. **Re-run authenticated-pages-perf-test against `/ho/`:**
   - `filter-options` count = 1 on mount
   - `filter-options` TTFB ≤150 ms
   - `issues` TTFB ≤200 ms
   - `staff-profile` returns 200 for users with a row (404 is acceptable for users without — verify hook hides section silently)
   - Save to `artifacts/ho-after-phase3.json`

## Success Criteria

- [ ] `/api/ho/filter-options/` fires exactly once on `/ho/` mount (network tab)
- [ ] `/api/ho/filter-options/` P50 TTFB ≤150 ms with 100+ issues in workspace
- [ ] `/api/ho/issues/?page=1` P50 TTFB ≤200 ms
- [ ] `EXPLAIN ANALYZE` shows index usage, no sequential scans on workspace-scoped queries
- [ ] `/api/v1/users/me/staff-profile/` (or workspace-scoped variant) returns 200
- [ ] No regressions in `/ho/` datasheet/category views (filter chips still populate)
- [ ] Backend tests pass: `cd apps/api && python run_tests.py`

## Risk Assessment

- **Risk:** removing `useEffect(fetchFilterOptions)` from child views breaks SSR/hydration edge case. **Mitigation:** test direct-load of `/ho/?view=category` (deep link, no datasheet visited first).
- **Risk:** index migration locks table in prod. **Mitigation:** use `CREATE INDEX CONCURRENTLY` in migration (Postgres-specific, requires raw SQL).
- **Risk:** changing v1 → workspace-scoped URL for staff-profile breaks other callers. **Mitigation:** grep all of `apps/web` for the v1 path before changing; update all callers atomically.
- **Risk:** cache_response on filter-options stales user-modified data. **Mitigation:** keep TTL ≤60s; invalidate on relevant write actions if heat is on facet-fresh-after-write.

## Security Considerations

- All queries must remain workspace-scoped via `project__workspace__slug=slug` filter (per project rule).
- `MyStaffProfile` endpoint already scopes to `request.user` — confirm no IDOR if v1 path is added.
- Index migration is additive — no data access changes.

## Rollback

- **Track A:** revert mount-effect move + restore child `useEffect` calls; remove `_filterOptionsInflight` field. No data migration involved.
- **Track B (queries):** revert serializer/queryset edits. If index migration was applied: `DROP INDEX CONCURRENTLY <name>;` via reverse migration.
- **Track B (cache_response):** if added, remove decorator; flush relevant Redis keys (`cache.delete_pattern('<key-prefix>*')`).
- **Track C:** restore deleted `my-staff-profile.service.ts` from git history if needed (zero risk since unused).
- All edits land via single PR per track → revert PR to roll back atomically.

## Next Steps

- Phase 4 can leverage Track A's dedupe pattern for profile bootstrap XHRs.
- If `cache_response` is added, document in `docs/system-architecture.md`.
