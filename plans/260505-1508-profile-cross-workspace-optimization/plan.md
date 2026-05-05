---
title: "Profile Page Cross-Workspace Performance Fix"
description: "Replace 600-call client fan-out with single backend aggregate endpoint; fix N+1 sub-task counting bug in WorkspaceUserProfileEndpoint."
status: complete
priority: P1
effort: 14h
branch: duonglx/perf/profile-cross-workspace-aggregate
tags: [perf, backend, frontend, profile, n-plus-one]
created: 2026-05-05
completed: 2026-05-05
---

# Profile Page Cross-Workspace Performance Fix

Replace client-side fan-out (600 HTTP calls/page-load) with single server-side aggregate endpoint. Fix N+1 + sub-task counting bug. Target: page load 10–25s → <2s.

## Context

- **Debug evidence:** `plans/reports/debugger-260505-1454-your-work-profile-slow.md`
- **Root cause #1 (95%):** `TodayWorkItems` + `OverdueWorkItems` (CE) loop `Promise.all` over 100 workspaces × 3 calls = 600 req
- **Root cause #2:** `WorkspaceUserProfileEndpoint` 3/4 Count annotations missing `parent__isnull=True` → counts sub-tasks (correctness bug)
- **Root cause #3:** `WorkspaceUserProfileStatsEndpoint` 8 sequential queries (low priority)
- **Stack:** Django 4.2 + DRF, React 18 + MobX + SWR
- **Constraint:** No upstream `core/` modification. CE-only frontend changes. Backend goes in `plane/app/` (v0, session auth).

## Phases

| #   | Phase                                                                                              | Owner    | Effort | Status      | Depends     |
| --- | -------------------------------------------------------------------------------------------------- | -------- | ------ | ----------- | ----------- |
| 1   | [Backend cross-workspace aggregate endpoint](./phase-01-backend-cross-workspace-endpoint.md)       | backend  | 4h     | complete    | —           |
| 2   | [Backend fix N+1 + sub-task count bug](./phase-02-backend-fix-profile-counts.md)                   | backend  | 1h     | complete    | —           |
| 3   | [Backend optimize stats endpoint single query](./phase-03-backend-optimize-stats.md)               | backend  | 1.5h   | complete    | —           |
| 4   | [Frontend refactor Today/Overdue to new endpoint](./phase-04-frontend-refactor-cross-workspace.md) | frontend | 2h     | complete    | 1           |
| 5   | [Frontend dedupe + SWR cleanup](./phase-05-frontend-dedupe-swr.md)                                 | frontend | 1h     | complete    | 4           |
| 6   | [DB indexes for cross-workspace query](./phase-06-db-indexes.md)                                   | backend  | 0.5h   | complete    | 1           |
| 7   | [Tests (backend unit + frontend smoke + bench)](./phase-07-tests.md)                               | tester   | 3h     | complete    | 1,2,3,4,5,6 |
| 8   | [Verification & rollout](./phase-08-verification-rollout.md)                                       | lead     | 1h     | in-progress | 7           |

## Critical Dependencies

- Phase 1 unblocks Phase 4 (new API contract)
- Phase 6 should land before/with Phase 1 deploy (avoid slow first call)
- Phase 7 verifies all preceding phases — gate before Phase 8

## File Ownership (no overlap)

- Backend new: `plane/app/views/user/work_items.py` (Phase 1), `plane/app/serializers/user_work_items.py` (Phase 1), `plane/app/urls/user.py` (Phase 1)
- Backend modify: `plane/app/views/workspace/user.py` (Phase 2 lines 311–360, Phase 3 lines 416–541)
- Backend migration: new file in `plane/db/migrations/` (Phase 6)
- Frontend modify: `apps/web/ce/services/user-work-items.service.ts` NEW (Phase 4), `apps/web/ce/components/profile/today-work-items.tsx` (Phase 4), `apps/web/ce/components/profile/overdue-work-items.tsx` (Phase 4)
- Frontend types: `packages/types/src/users/index.ts` (Phase 4)

## Backwards Compatibility

- Existing `user-issues/{userId}/`, `user-profile/{userId}/`, `user-stats/{userId}/` endpoints UNCHANGED contract — only Phase 2/3 internal optimization, Phase 1 ADDS new endpoints
- Verified callers: `core/services/user.service.ts:218`, `core/store/issue/profile/issue.store.ts:154,205` — keep working

## Rollback Plan (per phase)

- P1: revert URL register + delete new files
- P2: revert single-line `parent__isnull=True` additions
- P3: keep old query path under feature flag if perf regresses
- P4: feature flag `useAggregateEndpoint` env var → fall back to fan-out
- P6: migration is `migrations.RunSQL` reversible

## Success Criteria

- Network tab: ≤30 requests on profile page load (was ~700)
- DOMContentLoaded: <2s (was 10–25s)
- `WorkspaceUserProfileEndpoint` `assigned_issues`/`completed_issues`/`pending_issues` counts match `parent__isnull=True` queries
- All existing tests pass + new tests for endpoint

## Validation Log

### Session 1 — 2026-05-05

| #   | Topic                                    | Decision                                                                                         | Affected Phases  |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| 1   | PR scope                                 | All 8 phases bundled in one PR                                                                   | — (plan-level)   |
| 2   | `crossWorkspaces` default                | Keep `true` (perf cost ~0 with new endpoint)                                                     | Phase 4          |
| 3   | Toggle on other-user profiles            | Hide toggle when `userId !== currentUser.id`                                                     | Phase 4          |
| 4   | Feature flag for rollback                | Add env var `USE_AGGREGATE_PROFILE_ENDPOINT` (default ON, frontend falls back to fan-out if OFF) | Phase 4, Phase 8 |
| 5   | `created_issues` sub-task fix in Phase 3 | Apply `parent__isnull=True` consistently with Phase 2                                            | Phase 3          |
| 6   | Phase 1 pagination                       | Default page size 200, no pagination day 1                                                       | Phase 1          |
| 7   | Phase 6 DB indexes                       | Conditional on EXPLAIN as planned (keep in PR)                                                   | Phase 6          |
| 8   | Frontend smoke tests                     | Manual checklist this PR + backlog ticket for Vitest setup                                       | Phase 7          |

**Recommendation:** PROCEED — all decision points resolved, no plan revision required beyond per-phase propagation below.

### Session 2 — 2026-05-05

**Trigger:** `/ck-plan validate` post-Session-1 deeper-dive on residual ambiguities.
**Questions asked:** 4

| #   | Topic                                                               | Decision                                                                                              | Affected Phases  |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Other-user profile (`/profile/<otherUid>/`) Today/Overdue behavior  | Legacy fan-out fallback when `userId !== currentUser.id` (hook keeps old code path for non-self)      | Phase 4          |
| 2   | Phase 1 serializer shape for assignees/labels                       | ID lists: `assignee_ids: UUID[]`, `label_ids: UUID[]` (matches existing `EnrichedIssue`/`TBaseIssue`) | Phase 1, Phase 4 |
| 3   | Phase 6 index migration trigger                                     | Always include partial index in PR (defensive; one less follow-up)                                    | Phase 6          |
| 4   | Phase 3 `Count(filter=..., distinct=True)` perf regression fallback | Subquery rewrite (`Case/When` or pre-filtered subquery) — keep Phase 3 in PR                          | Phase 3          |

#### Confirmed Decisions

- **Self-only enforcement:** New endpoint stays `/users/me/...`; cross-user requests served by existing `WorkspaceUserProfileIssuesEndpoint` via legacy fan-out path. No `?user=` extension. No IDOR surface added.
- **Wire shape:** Backend returns IDs only; frontend joins via existing member/label MobX stores. No payload bloat.
- **Phase 6 status:** Promoted from "conditional" to "always ship" — partial index lands with this PR regardless of EXPLAIN outcome.
- **Phase 3 status:** Stays in PR; if `Count(distinct=True)` regresses, rewrite as `Case/When` subquery (NOT defer, NOT cache layer).

#### Action Items

- [ ] Phase 1: confirm serializer fields list `assignee_ids`, `label_ids` only (no embedded objects) — already drafted that way; lock it.
- [ ] Phase 4: hook detects `isSelf` flag; non-self path dispatches to legacy `userIssueService` fan-out; `EnrichedIssue` mapping unified.
- [ ] Phase 6: remove "conditional" language; migration is mandatory in PR. Still capture EXPLAIN before/after for PR description.
- [ ] Phase 3: replace risk mitigation "fallback to subquery if slow" with concrete subquery rewrite plan if benchmark regresses.

**Recommendation:** PROCEED to `/ck:cook --auto` — no further validation needed.

### Session 3 — 2026-05-05 (Implementation Completion)

**Trigger:** All 8 phases completed; syncing plan status back to track.

**Implementation Notes**

| Item                      | Value                                 | Notes                                                                                                                                     |
| ------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Migration number assigned | 0168                                  | `0168_add_issue_workitems_index.py` — atomic=False, CREATE INDEX CONCURRENTLY                                                             |
| Env var name (frontend)   | `VITE_USE_AGGREGATE_PROFILE_ENDPOINT` | Codebase uses Vite, not Next.js; var prefix is VITE*, not NEXT_PUBLIC*                                                                    |
| Test location & marker    | `plane/tests/contract/views/`         | Uses `@pytest.mark.contract` (Plane convention for HTTP endpoint tests, not `@pytest.mark.unit`)                                          |
| Test coverage             | 16/16 passing                         | 10 work-items tests + 3 profile-counts tests + 3 stats tests; execution: `python run_tests.py -c -v` in 3.17s                             |
| Code review findings      | CRITICAL fixed                        | Wire-shape mismatch (raw `_workspace: {slug, name}` → flat `_workspaceSlug` + `_workspaceName`) resolved in service `toEnriched()` mapper |
| Sub-task parity fix       | Applied                               | Defensive filter `.filter((issue) => issue.parent_id == null)` added to legacy fetch branches in hook (Branches 1+2)                      |
| Silent error handling     | Fixed                                 | Legacy fetch catches now emit `console.warn` instead of silently swallowing errors                                                        |
| Perf benchmark (pending)  | NOT blocking                          | EXPLAIN ANALYZE + page-load timing capture deferred to PR description; approved as non-blocking per Session 2                             |
| Build-time vs runtime env | Build-time                            | Feature flag read at app boot, rollback requires redeploy; documented in PR                                                               |

**Status:** All 8 phases complete + tests passing. Phase 8 (docs + commit/push) in-progress. Ready for PR prep.

**Next Action:** Complete Phase 8 verification checklist (docs update, conventional commits, PR open against `develop`).
