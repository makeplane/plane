# My Timesheet — Expandable Sub-Items

**Date:** 2026-05-29 · **Branch:** `ngoc-feat/categories` · **Mode:** interactive + `--tdd`

## Goal

In the **My Timesheet** tab (both **project** and **workspace/cross-workspace** scope), every work-item
row whose issue has **sub-items the current user logged time on this week** shows an expand chevron.
Expanding fetches those logged sub-items and renders them as nested rows with their own week worklog.
Recursively expandable. Scope is strictly **the current user's own logged work** — identical to how the
flat My Timesheet grid already selects rows (`logged_by=request.user`, `timesheet_grid.py:53-60`).

## Confirmed requirements (from user)

1. **Child scope (user-confirmed, validation 2026-05-29):** expanding shows **only the sub-items the
   current user logged time on that week** (`logged_by=user`, same predicate as the flat grid). NOT all
   sub-items; there are no "0-minute" placeholder children. Chevron appears only when the parent has ≥1
   such logged child.
2. **Collapsed parent total:** parent row shows **its own** logged time only. Children's time is NOT rolled
   up. ⇒ existing flat top-level rows + footer `daily_totals` / `grand_total` stay **unchanged**.
3. **No restructure / duplication accepted (user-confirmed, validation 2026-05-29):** the existing flat
   top-level list is NOT restructured. A logged child still appears as its own top-level row (existing
   behavior) AND also appears nested under its logged parent when expanded. We only ADD lazy nested rows;
   we remove nothing. Footer totals remain top-level-only, so each logged issue is counted exactly once.

## Scope boundary (OUT)

- Excel export stays flat (top-level rows only) — unchanged.
- No new rollup/aggregation columns. No analytics/capacity tab changes.
- No frontend test scaffolding (apps/web has no vitest/jest runner — verified).

## Architecture summary

Backend aggregates worklogs per issue into a flat `rows[]` (project: `timesheet_grid.py`,
cross-workspace: `cross_workspace.py`). Frontend `TimesheetTable` renders that flat list via TanStack.
`ITimesheetRow` lacks hierarchy info. Plan: (a) add `sub_issues_count` = count of the **current user's
logged children** for each row, (b) add a lazy sub-issues timesheet endpoint that returns only the
current user's logged children for the week, (c) render rows with a recursive expandable row component
(spreadsheet pattern: ChevronRight + `rotate-90` + 12px indent).

Because children are scoped to the current user's own worklogs, both `sub_issues_count` and the fetch
derive from the same set the grid already computes (`logged_issue_ids` for the week). Count predicate ==
fetch predicate by construction (resolves red-team #11). One project-scoped child endpoint serves both
modes: each row already carries `project_id` (+ `workspace_slug` in cross-workspace mode), so the
frontend expands using the row's own ws/project.

## Phases

| Phase | File                                                                                                                                                            | Status                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 01    | [phase-01-backend-sub-issues-endpoint.md](phase-01-backend-sub-issues-endpoint.md) — `sub_issues_count` field + lazy sub-issues endpoint + contract tests (TDD) | ✅ Done (7/7 tests green)  |
| 02    | [phase-02-frontend-types-service-store.md](phase-02-frontend-types-service-store.md) — types, service method, store action                                      | ✅ Done (tsc clean)        |
| 03    | [phase-03-frontend-expandable-rows.md](phase-03-frontend-expandable-rows.md) — recursive expandable row UI + i18n                                               | ✅ Done (tsc + lint clean) |

## Implementation Status — 2026-05-29

**All 3 phases complete.** Verified:

- Backend: 7 new self-contained contract tests pass (`TestTimesheetSubIssues`); `manage.py check` clean; no leftover importers of removed week helpers.
- Frontend: `check:types` exit 0; eslint 0 errors (1 known MobX arrow-property unbound-method false-positive, within budget); prettier clean.
- Code review (code-reviewer subagent): no critical/blocking. All cited red-team findings (#2,#3,#5,#6,#7,#8,#9,#11,#12,#15) verified handled; 4/4 acceptance criteria met.
- Red-team H1 (cross-workspace count vs project-scoped fetch) **adjudicated theoretical**: `serializers/issue.py:206-213` enforces parent in same project as child, so logged children always share the parent's project → count == fetch by construction. UI `>0` semantics keep even malformed legacy data benign.
- Applied: `aria-expanded` on chevron (a11y). ko/vi use EN placeholder per confirmed scope.

**Files changed:** backend `_week.py` (new), `timesheet_sub_issues.py` (new), `timesheet_grid.py`, `cross_workspace.py`, `__init__.py`×2, `urls/issue.py`, contract test; frontend `worklog.ts`, `worklog.service.ts`, `worklog.store.ts`, `timesheet-table.tsx`, `timesheet-row.tsx` (new), 3 locale files.

**Note (dev env):** local has no Python with backend deps; tests run inside the `api` Docker container (pytest + test scaffolding copied in, ephemeral). Pre-existing `TestWorkspaceTimeTracking` errors on clean test DB (seeded-data dependency, red-team #10) — out of scope.

## Key dependencies

- Phase 02 depends on Phase 01 (endpoint contract). Phase 03 depends on Phase 02 (service/store + types).
- Backend tests (TDD): `cd apps/api && python run_tests.py -c -v`.
- Frontend verification: `pnpm check:lint` + `pnpm --filter web exec tsc --noEmit` + code-reviewer.
- **Cross-workspace is the DEFAULT view** (`timesheet-grid.tsx:38` defaults `isCrossWorkspace=true`), so the
  `.values()` annotation path in Phase 01 is the hot path — a silent column drop breaks the default UX.

## Red Team Review

### Session — 2026-05-29

**Findings:** 15 (15 accepted, 0 rejected — 2 dropped pre-adjudication: cosmetic child-sort, user-confirmed empty-zero noise)
**Severity breakdown:** 4 Critical, 6 High, 5 Medium
**User decisions:** #1 → admins trusted, keep bypass (downgraded to Low, documented risk); #14 → remove nesting cap, true recursion (cycle guard #4 now load-bearing).

| #   | Finding                                                                   | Severity     | Disposition                  | Applied To                   |
| --- | ------------------------------------------------------------------------- | ------------ | ---------------------------- | ---------------------------- |
| 1   | XWS workspace-admin reads sub-issue titles of non-member projects         | Critical→Low | Accept (documented risk)     | Phase 01 Security            |
| 2   | `_parse_week_start` not a shared helper (2 incompatible signatures)       | Critical     | Accept                       | Phase 01 Design              |
| 3   | Date-key mismatch (local `isoformat` vs UTC `toISOString`) → silent zeros | Critical     | Accept                       | Phase 01 Design + Phase 03   |
| 4   | Parent/child cycle → infinite recursion + duplicate React keys            | Critical     | Accept (`ancestorIds` guard) | Phase 03 Design + Risk       |
| 5   | `parent_id` not validated vs project/workspace + no UUID guard            | High         | Accept                       | Phase 01 endpoint + Security |
| 6   | "Drop TanStack, output identical" false (cells in `columnDef.cell`)       | High         | Accept                       | Phase 03 files + Risk        |
| 7   | `fetchSubIssues` failure leaves `isLoading` stuck true                    | High         | Accept                       | Phase 02 + Phase 03 Design   |
| 8   | Stale-week data on expanded children (no invalidation)                    | High         | Accept                       | Phase 03 Design              |
| 9   | `cross_workspace.py .values()` annotation under-specified (default view)  | High         | Accept                       | Phase 01 Design + tests      |
| 10  | Hardcoded seeded test fixtures; no negative-auth test                     | High         | Accept                       | Phase 01 steps/todo          |
| 11  | Count predicate ≠ fetch predicate (chevron for out-of-scope children)     | Medium       | Accept                       | Phase 01 Design              |
| 12  | N+1 correlated subquery for `sub_issues_count`                            | Medium       | Accept                       | Phase 01 Design              |
| 13  | No server-side breadth/depth cap (amplification DoS)                      | Medium       | Accept (`[:200]`)            | Phase 01 endpoint            |
| 14  | `MAX_NESTING=5` silently hides deeper items (vs requirement)              | Medium       | Accept (cap removed)         | Phase 03 Design              |
| 15  | Double-click expand race → duplicate requests                             | Medium       | Accept                       | Phase 03 Design              |

### Whole-Plan Consistency Sweep

- Files reread: plan.md, phase-01-backend-sub-issues-endpoint.md, phase-02-frontend-types-service-store.md, phase-03-frontend-expandable-rows.md
- Decision deltas checked: 5 (nesting cap removed; shared `parse_week_start`; grouped count vs correlated subquery; date-key contract; cross-workspace `.values()` path)
- Reconciled stale references: 2 (Phase 03 success criteria "nesting capped at 5" → "no depth cap, cycle-safe"; Phase 01 endpoint "reuse `_parse_week_start`" → shared helper)
- Unresolved contradictions: 0

## Validation Log

### Session — 2026-05-29 (child-scope clarification)

**User decisions:**

- **Child scope reversed (Q1):** children = ONLY sub-items the current user logged time on that week
  (`logged_by=user`), NOT all sub-items. Removes the "0-minute placeholder children" behavior entirely.
  Reverses original Requirement #1.
- **No restructure (Q2):** keep the flat top-level list as-is; logged children appear both top-level and
  nested (duplication accepted). Confirms original Requirement #3; footer stays top-level-only/unchanged.

**Effect on existing Red Team findings (re-adjudicated under new scope):**

- **#1 (XWS admin reads non-member sub-issue titles) → NEUTRALIZED.** Children are now scoped to the
  _requesting user's own_ worklogs, so a workspace-admin only ever sees issues they themselves logged time
  on. They cannot enumerate arbitrary sub-issue titles of non-member projects via this endpoint. The
  `@allow_permission` admin bypass no longer leaks data here.
- **#11 (count predicate ≠ fetch predicate) → RESOLVED by construction.** Both `sub_issues_count` and the
  fetch derive from the same `logged_issue_ids` set → chevron presence ⇔ in-scope logged children exist.
- **#13 (breadth/amplification DoS) → LARGELY MOOT.** Child breadth is bounded by the user's own logged
  issues (cannot be a wide bulk-imported epic). Keep `[:200]` as a cheap belt-and-suspenders guard only.
- **#12 (grouped count, no N+1) → SIMPLER.** Count groups `logged_issue_ids` by `parent_id` (no query over
  all project children). `parent_id` index still relevant for the children fetch filter.
- Unchanged/still load-bearing: #2 (shared week helper), #3 (date-key contract), #4 (cycle guard),
  #5 (parent_id validation), #6 (TanStack body), #7 (error contract), #8 (week-change reset), #9
  (cross-workspace `.values()` path), #15 (double-click race).

**Propagated to:** Phase 01 (count scoping, endpoint children filter, tests, security), Phase 03 (chevron
semantics, success criteria). Phase 02 unchanged (contract shape identical).

### Whole-Plan Consistency Sweep — child-scope clarification

- Files reread: plan.md, phase-01, phase-02, phase-03.
- Reconciled stale references: "all sub-items / 0 if none" removed from Goal, Req #1, Phase 01 endpoint +
  tests, Phase 03 success criteria. `sub_issues_count` redefined as "current-user logged children" in
  Architecture + Phase 01. Red-team #1/#11/#13 re-adjudicated above (not silently flipped — documented).
- Unresolved contradictions: 0
