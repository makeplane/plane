---
phase: 4
title: "Profile-Page XHR Batching"
status: pending
priority: P2
effort: "1-2d"
dependencies: [1]
---

# Phase 4: Profile-Page XHR Batching

## Overview

Profile page (`/yesyes/profile/{userId}/`) fires **27 XHRs** on mount. Most are bootstrap calls with no inter-dependency. Goal: collapse profile-specific calls into a single composite endpoint + ≤3 parallel data-fetches, **while leaving workspace-wide SWR-cached items alone**.

**HARD GATE — DO NOT START WITHOUT PHASE 1 DATA.**

This phase is fully gated on `phase-01-production-build-benchmark` results. If prod build numbers show:

- profile page wall-time <2 s AND aggregated network time <3 s → **cancel this phase** (move to "Won't do" in plan.md with a one-line rationale).
- otherwise → proceed.

Do not write a single line of composite-endpoint code before Phase 1 artifacts (`prod-summary.md`) exist and have been compared. The whole premise (27 RTTs is the bottleneck) may evaporate under prod's HTTP/2 multiplexing.

## Context Links

- Report: `plans/reports/debug-260522-1514-authenticated-pages-perf.md` § "Per-page table — profile", "Recommendations" 7
- Profile page: `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx`
- Service call sites:
  - `apps/web/core/services/user.service.ts:179` (`user-stats`)
  - `apps/web/core/services/favorite/favorite.service.ts:44` (`user-favorites`)
  - `apps/web/core/services/workspace.service.ts:387` (`sidebar-preferences`)
- Child components: `today-work-items.tsx` (4 XHRs), `activity.tsx`, `profile-workload.tsx`, `profile-priority-distribution.tsx`, `profile-state-distribution.tsx`

## Key Insights

- All 27 calls succeed (<130 ms each) — no backend hot spot. Pain is RTT serialization + connection setup overhead, not query cost.
- **Workspace-wide SWR caches already exist and MUST be excluded from the composite payload:**
  - `members` → cached at `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx:95`
  - `task-categories` → cached at `apps/web/ce/components/workspace/content-wrapper.tsx:31`
  - Pulling these into the composite endpoint creates dual sources of truth (composite + SWR) → cache divergence + stale UI elsewhere.
- A composite endpoint trades N RTTs for 1 RTT + heavier payload — net win when RTT > ~50 ms AND scope is profile-specific data only.

## Requirements

- Functional:
  - Profile page initial XHRs ≤5 (target: 1 composite + ≤4 page-specific)
  - First contentful render time on profile page ≤1500 ms (cold cache)
  - No regression in data freshness for shared-cache items (members, task-categories) across other pages
- Non-functional: backend composite endpoint must be ≤300 ms TTFB; gracefully degrade if any sub-fetch fails

## Architecture

Two-track design:

### Track A: Backend composite bootstrap endpoint

New endpoint: `GET /api/workspaces/{slug}/profile-bootstrap/?user_id={userId}` returns a **profile-scoped** payload only. Each section uses partial-failure schema `{ data: T | null, error: string | null }` so a single sub-query failure does not blank the page:

```json
{
  "profile":             { "data": {...}, "error": null },
  "stats":               { "data": {...}, "error": null },
  "favorites":           { "data": [...], "error": null },
  "sidebar_preferences": { "data": {...}, "error": null },
  "work_items_today":    { "data": [...], "error": null },
  "work_items_overdue":  { "data": [...], "error": null }
}
```

**Explicitly excluded (consumed via existing SWR caches — DO NOT duplicate):**

- `members` (workspace-wide, already in `workspace-wrapper.tsx:95`)
- `task_categories` (workspace-wide, already in `content-wrapper.tsx:31`)

Implementation: single Django view that runs sub-queries in series (Postgres handles concurrent reads fine, no async needed for ≤6 queries). Each sub-fetch wrapped in try/except → returns `{data: null, error: "<short reason>"}` on failure.

### Track B: Frontend bootstrap hook

New hook: `useProfileBootstrap(workspaceSlug, userId)` calls the composite endpoint once, hydrates relevant stores via `runInAction`. Each section is hydrated **only if** `section.data !== null && section.error === null` — partial failures leave the existing store value untouched, child components fall back to their existing skeleton/empty state.

**Single code path — no SWR fallback.** Backend and frontend ship together from the same monorepo. Maintaining two parallel code paths (composite + per-call SWR) doubles surface area for race conditions and double-fetch bugs. Ship one, delete the other. If composite endpoint is missing in dev, fail loud (console.error) rather than silently falling back.

## Related Code Files

- Create: `apps/api/plane/app/views/workspace/profile_bootstrap.py` (or extend `workspace/home.py`)
- Create: `apps/api/plane/app/serializers/profile_bootstrap.py`
- Modify: `apps/api/plane/app/urls/workspace.py` (register route)
- Create: `apps/web/core/hooks/use-profile-bootstrap.ts`
- Create: `apps/web/core/services/profile-bootstrap.service.ts`
- Modify: `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx` (replace child mount fetches)
- Modify (light): `apps/web/core/components/profile/today-work-items.tsx`, `activity.tsx`, etc. (consume hydrated store instead of own SWR)
- Read for context: existing service files cited above

## Implementation Steps

1. **HARD GATE — read Phase 1 artifacts first.**
   <!-- Updated: Validation Session 1 - threshold confirmed (wall <2s AND aggregated <3s) -->
   - Read `phase-01.../artifacts/prod-summary.md`. If profile page wall-time <2 s AND aggregated network <3 s under prod: **cancel this phase**, move row to "Won't do" in `plan.md`, stop. No code changes. (Threshold confirmed in Validation Log Session 1.)
   - Otherwise proceed with steps 2–5.

2. **Backend: composite endpoint**
   - Create view + serializer
   - Workspace-scoped (`project__workspace__slug=slug` for any project-touching subquery)
   - User auth check (request.user must be workspace member; user_id param can be any workspace member for profile-view permission)
   - **Do NOT include `members` or `task_categories`** — these have existing SWR caches; duplicating them creates dual truth.
   - Per-section try/except → emit `{data, error}` shape; never blank the whole payload because one sub-query failed.
   - Backend unit test covering: 200 happy path, 403 non-member, 404 unknown user, partial-failure (one sub-query raises → other sections still populated, failed section has `error` set)

3. **Frontend: bootstrap hook + service**
   - Single SWR call to composite endpoint
   - For each section: only `runInAction` hydrate if `data !== null && error === null`; on partial failure, log a warning and skip hydration for that section.
   - Expose `{ isLoading, sectionErrors }` for page-level skeleton + per-widget error UI.

4. **Migrate consumers (single code path)**
   - Replace child-component SWR calls with `useStore()` reads in one PR per widget.
   - **Delete** the old per-widget SWR call sites — do NOT keep them as fallback. Single source of truth.
   - For widgets whose section returned `error`, render existing empty/error state (already in components).

5. **Re-measure**
   - Cold load `/yesyes/profile/{userId}/` — expect ≤5 XHRs
   - Capture to `artifacts/profile-after-phase4.json`

## Success Criteria

- [ ] `GET /api/workspaces/{slug}/profile-bootstrap/` returns full payload, TTFB ≤300 ms
- [ ] Profile page cold-load XHR count ≤5 (down from 27)
- [ ] Cold wall-time ≤1500 ms on dev (prod measured separately)
- [ ] All profile widgets render with composite-hook data (no skeleton-stuck states)
- [ ] Backend tests green; no regression in members/task-categories shared cache on other pages
- [ ] Composite endpoint gracefully degrades if a sub-query fails (returns partial payload + error key per section)

## Risk Assessment

- **Risk:** composite endpoint bloats payload. **Mitigation:** measure transferred bytes — must be ≤ sum of individual payloads + overhead.
- **Risk:** dual cache truth (members/task_categories duplicated in composite + SWR). **Mitigation:** explicit exclusion list; reviewer checklist; no backend code references those payloads.
- **Risk:** YAGNI — if prod already fast, this is wasted work. **Mitigation:** Step 1 hard-gate cancels the phase entirely on Phase 1 evidence.
- **Risk:** partial-failure semantics confuse consumers. **Mitigation:** explicit `{data, error}` schema, hook-level discipline (no hydration on error), per-widget existing fallback UI exercised in tests.

## Rollback

- **Backend:** revert composite view + URL registration. No DB schema impact; sub-queries reuse existing serializers.
- **Frontend:** revert hook + consumer migrations in single PR. Re-introduce deleted per-widget SWR calls from git history.
- Since composite endpoint and consumers ship together in one PR pair, single revert restores prior behavior.

## Security Considerations

- Composite endpoint must enforce workspace membership (existing decorator on workspace views).
- `user_id` param: validate that requesting user has permission to view target user's profile (typically same-workspace).
- No PII added beyond what individual endpoints already expose.

## Next Steps

- If composite pattern wins, document as standard for future heavy-bootstrap pages in `docs/system-architecture.md`.
- Consider applying same pattern to `/ho/` page mount (filter-options + issues + ho-bootstrap data).
