# Phase 3 /ho/ Perf Diff — Code Review

**Date:** 2026-05-22
**Scope:** in-flight dedupe + single-mount fetch + dead-code delete
**Verdict:** DONE_WITH_CONCERNS — correctness OK; perf gain likely smaller than expected due to backend hot-spot not being addressed.

---

## ✅ Correct

- **Dedupe race in same tick:** `fetchFilterOptions` (ho-issue.store.ts:298) returns the cached `_filterOptionsInflight` promise synchronously before any `await`. Second caller in same tick gets the SAME promise reference — no second fetch fires. Safe.
- **Finally clears guard:** `_filterOptionsInflight = null` is in the `finally` block (line 323), inside `doFetch`. On error path, error is caught at line 318 (`console.error`), promise resolves normally (not rejects) — no leaked rejected promise. Subsequent callers retry cleanly.
- **Legitimate refetches preserved:** Filter-change-driven calls at lines 341, 351, 379, 388 (setDateRange / setShowArchived / setDepartmentFilter / setProjectFilter) all still fire. Dedupe only collapses concurrent-in-flight, NOT sequential. After fetch resolves, next call fires fresh — stale-data risk = none.
- **observer() wrap:** ho/page.tsx wraps with `observer(function HoPage…)` — store reads inside `useEffect` deps trigger reactively as expected.
- **Single consumer of `store.filterOptions`:** verified only `ho-datasheet-header.tsx:28`. The `if (!options) return undefined` at :162 guards correctly. No other consumer to break.
- **Service deletion safe:** `my-staff-profile.service.ts` deletion — grep confirms zero remaining references.

---

## ⚠️ Concerns

### C1. Same-tick window is narrow — most duplicates were likely already sequenced

ho-issue.store.ts:298 — Dedupe only collapses calls **before the first await resolves**. Original triple-mount (page → datasheet → category) fires three `useEffect`s on the same render frame, so all three hit the guard before `service.listFilterOptions` returns → dedupe works. BUT: if any of the three mounted in a later effect cycle (e.g. lazy view switching), dedupe misses and you get a sequential refetch. Browser timing shows whether this matters — if the user's "still slow" measurement shows 1 filter-options call now (down from 3), dedupe worked; if 2-3 still, view-switching is firing later effects.

### C2. Single mount effect runs `[store]` not `[store, workspaceSlug]`

ho/page.tsx:18 — dependency is `[store]`. Store is a singleton from `useHoIssues()` so this runs **once per app session, not per workspace switch**. Original child components remounted on workspace change (because routes change), so child `useEffect` re-fired implicitly via remount. With mount moved to `ho/page.tsx` and `[store]` deps, **switching workspace will NOT refetch filter options** unless `ho/page.tsx` itself remounts.

Verify: does the route `[workspaceSlug]/ho` remount `HoPage` on slug change? Router v7 with `useSearchParams` typically keeps the component mounted across param changes for same route — needs confirmation. Recommend changing deps to `[store, workspaceSlug]` (read via `useParams`) OR add a separate `useEffect` watching `selectedDepartmentIds`/`workspaceSlug`. **Low-risk fix.**

### C3. Deep-link to `/ho/?view=category` works, BUT only because page-level fetch fires

ho/page.tsx mounts BEFORE child view mounts, so `HoCategoryView` will observe `store.filterOptions` populated (or fetching) by the time it renders. No regression vs previous behavior. ✅ — but this hinges on `ho/page.tsx` mount completing the fetch; if user closes page mid-fetch and reopens, dedupe-via-singleton-store would short-circuit if cached. Acceptable.

### C4. No-op error swallow on console

ho-issue.store.ts:318 — `console.error` swallows the error silently. If filter-options endpoint is what's slow/failing, user sees blank dropdowns and no toast. **Not a regression** (original code did same), but worth flagging.

### C5. observer() on page is largely cosmetic

ho/page.tsx — page only reads `store` to call `fetchFilterOptions`; no observable read renders. `observer()` adds zero value here. Not harmful, just dead reactivity. Optional simplification.

---

## ❌ Blockers

None.

---

## Why "still too slow" — bottleneck hypotheses ranked

1. **HIGHEST: HoFilterOptionsView is N+1-ish in Python, not in SQL.** apps/api/plane/app/views/ho.py:477-660 runs **11+ separate `.distinct().order_by()` subqueries** against `Issue` filtered by an `id__in=issue_ids` subquery. Each is <1ms in EXPLAIN individually but: (a) every one is a separate DB roundtrip, (b) the `issue_ids` CTE-style subquery is re-evaluated on each. Total wall-clock = 11× (roundtrip latency + serialization). At 5-15ms per query, this is 100-200ms of DB time alone, plus Python loop overhead. EXPLAIN <0.14ms per query was likely measured one at a time, not as a 11-query sequence. **Fix:** consolidate into 1-2 queries using `aggregate`/`annotate` or materialize `issue_ids` to a temp set, OR cache the response (workspace+date+project keyed) for 30-60s.

2. **HIGH: HoIssueListView serializer cost.** view returns paginated issues with select_related across 6 tables + prefetch on assignees/modules/cycles. For 50 issues × 6 joined rows × DRF nested serialization, easily 80-150ms Python time. Did the perf audit measure SQL only, or end-to-end TTFB?

3. **MEDIUM: Vite dev-mode bundling.** 1418 modules still loaded (Phase 2 skipped). First-render TTFB will eat 200-500ms of JS parse/eval before any XHR even fires. **User "feels slow" ≠ API slow** — distinguish by checking devtools Network tab for the TTFB of `/api/ho/filter-options/` and `/api/ho/issues/` specifically, vs page total.

4. **MEDIUM: Other XHRs on /ho/.** 25 XHRs on load — beyond filter-options + issues, candidates: accessible-workspaces, category-summary, user/me, workspace-list, project-list, notification poll, instance config. Many are unrelated to /ho/ specifically but block paint. Worth auditing waterfall.

5. **LOW: Auth middleware / session lookup.** Each request hits session middleware + `get_accessible_workspace_ids`. If that does its own DB lookup per request and isn't cached on request, multiplies across 25 XHRs.

6. **LOW: Dedupe limited window.** As C1 — if browser fires 3 mount effects across multiple frames, dedupe misses. Lower probability since React batches effects per tree commit.

---

## Recommended Next Actions

1. **Measure** `/api/ho/filter-options/` TTFB in Network panel (cold + warm). If >200ms → fix #1 above.
2. **Profile** HoFilterOptionsView with Django Debug Toolbar or `django-silk` — confirm 11-query pattern, total time.
3. **Fix C2** dependency array — `[store]` → `[store, workspaceSlug]`. 1-line change.
4. **Consider** redis cache (60s TTL) on filter-options response keyed by `(user_id, workspace_ids, project_ids, date_range, include_archived)`. Cheap win.
5. **Don't ship Phase 4** yet — first verify Phase 3 actually moved the needle via real waterfall measurement, else compounding optimizations on the wrong axis.

---

## Unresolved Questions

1. Does Router v7's `[workspaceSlug]/ho` route component (`HoPage`) remount or stay mounted on workspace slug change? Behavior of `[store]` deps depends on this.
2. What was the actual measured TTFB improvement post-Phase 3 vs pre? Without that number we can't tell if the dedupe even helped or if the bottleneck is downstream.
3. Was HoFilterOptionsView's 11-query pattern part of the EXPLAIN measurement, or was a single query measured in isolation?
4. Is `get_accessible_workspace_ids(request.user)` cached per-request or hitting DB on every XHR?
