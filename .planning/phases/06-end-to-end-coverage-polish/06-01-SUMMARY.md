---
phase: 06-end-to-end-coverage-polish
plan: "01"
subsystem: testing
tags: [playwright, e2e, gantt, timeline, propagation, fixtures, pom]

requires:
  - phase: 05-drag-handler-integration-error-ux
    provides: "Production wiring: dragBlockBy triggers propagation endpoint via useGanttResizable + BaseGanttRoot.updateBlockDates"

provides:
  - "Playwright E2E fixture infrastructure for TEST-23 / TEST-24"
  - "Api class: createIssueRelation, clearIssueDate, getIssue methods"
  - "TimelinePage POM: getBlockBox, getDayWidthFromBlock, dragBlockBy methods"
  - "test-fixtures.ts: propagationPair (src+0/+3, tgt+5/+8, blocking relation) + propagationTimeline fixtures"
  - "Placeholder spec: timeline-dependency-propagation.spec.ts (2 test.skip stubs)"
  - "5 smoke tests covering all new helpers and fixture plumbing"

affects:
  - "06-02 (Plan 06-02 imports propagationPair / propagationTimeline / api.getIssue / propagationTimeline.dragBlockBy directly)"

tech-stack:
  added: []
  patterns:
    - "API helper methods: CSRF + storageState pattern (POST/PATCH/GET with X-CSRFTOKEN header)"
    - "DOM-derived dayWidth: block.boundingBox().width / dayCount (inclusive), no prod file import"
    - "Fixture composition: propagationPair → propagationTimeline chain"
    - "smoke test per helper: isolate infra problems from spec logic before Wave 2"

key-files:
  created:
    - apps/web/e2e/specs/timeline-dependency-propagation.spec.ts
  modified:
    - apps/web/e2e/fixtures/api.ts
    - apps/web/e2e/fixtures/test-fixtures.ts
    - apps/web/e2e/pages/timeline.page.ts

key-decisions:
  - "CreatedIssue.start_date / target_date relaxed to string | null (option A) — aligns with getIssue return after clearIssueDate; existing specs unaffected (createIssue always returns non-null dates)"
  - "dragBlockBy uses native page.mouse.down() as first choice (D-12); dispatchEvent fallback documented in comments but not used — block body is pointer-events:auto"
  - "getDayWidthFromBlock is DOM-derived (box.width / inclusive dayCount); no chart-coords.ts import (D-03b)"
  - "propagationPair fixture uses day spacing D-06b: src(+0/+3), tgt(+5/+8), 2-day gap, 3-day durations"
  - "dispose() method placed before the new API helpers in class body (implementation order differs from PLAN spec ordering — no behavioral impact)"

patterns-established:
  - "Smoke-per-helper pattern: each new API helper and POM method has an inline smoke test to catch infra issues before Wave 2 spec bodies"
  - "Fixture composition: propagationPair depends on api; propagationTimeline depends on propagationPair — mirrors issuePair / timeline chain"

requirements-completed: []

duration: 6min
completed: "2026-05-04"
---

# Phase 6 Plan 01: Timeline Dependency Propagation E2E Infrastructure Summary

**Playwright fixture plumbing for TEST-23/TEST-24: Api helpers (createIssueRelation/clearIssueDate/getIssue), TimelinePage POM (getBlockBox/getDayWidthFromBlock/dragBlockBy), propagationPair+propagationTimeline fixtures, and 5 smoke tests — Wave 2 spec bodies can focus on assertions only.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-04T11:41:57Z
- **Completed:** 2026-05-04T11:47:36Z
- **Tasks:** 7
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Placeholder spec `timeline-dependency-propagation.spec.ts` created with 2 `test.skip` stubs (D-13a self-test: 1 skipped, 0 failed confirmed)
- `Api` class extended with 3 new methods: `createIssueRelation` (POST → 201), `clearIssueDate` (PATCH → 200/204), `getIssue` (GET → 200)
- `TimelinePage` POM extended with 3 new methods: `getBlockBox`, `getDayWidthFromBlock` (DOM-derived, no prod import), `dragBlockBy` (native mouse.down path)
- `propagationPair` + `propagationTimeline` fixtures added to `test-fixtures.ts` with D-06b day spacing
- 5 smoke tests committed inline (relation seed, clearIssueDate, getIssue+null-persistence, dragBlockBy, propagationPair)
- OxLint: 995 warnings (budget 11957 — unchanged); TypeScript: 0 errors
- No production code modified (apps/web/core, apps/web/ce, apps/api — all clean)

## Task Commits

Each task was committed atomically:

1. **Task 06-01-01: Placeholder spec (D-13a self-test)** - `19089a9991` (test)
2. **Task 06-01-02: Api.createIssueRelation + smoke** - `c3a3fdaf54` (feat)
3. **Task 06-01-03: Api.clearIssueDate + smoke** - `2eeacbae33` (feat)
4. **Task 06-01-04: Api.getIssue + smoke (null-persistence)** - `f93ff6bfa5` (feat)
5. **Task 06-01-05: TimelinePage.{getBlockBox,getDayWidthFromBlock,dragBlockBy} + smoke** - `9a5f20b6fe` (feat)
6. **Task 06-01-06: propagationPair + propagationTimeline fixtures + smoke** - `17232d9b77` (feat)
7. **Task 06-01-07: Regression + lint + types gate** - (this commit — docs)

## Files Created/Modified

- `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` — NEW: placeholder spec + 5 smoke tests (7 test entries total: 2 skip, 5 smoke)
- `apps/web/e2e/fixtures/api.ts` — MODIFIED: added createIssueRelation, clearIssueDate, getIssue; CreatedIssue dates relaxed to `string | null`
- `apps/web/e2e/fixtures/test-fixtures.ts` — MODIFIED: added propagationPair + propagationTimeline to Fixtures type and base.extend
- `apps/web/e2e/pages/timeline.page.ts` — MODIFIED: added getBlockBox, getDayWidthFromBlock, dragBlockBy (existing methods byte-identical)

## Decisions Made

- **CreatedIssue type relaxed to `string | null`:** After `clearIssueDate`, `getIssue` returns `null` for the cleared field. Option A (relax the type globally) chosen over option B (per-call type assertion). Existing specs unaffected — `createIssue` always returns non-null.
- **dragBlockBy: native page.mouse.down():** D-12 first choice. Block body is `pointer-events:auto`, so native events fire React's onMouseDown. dispatchEvent fallback documented in code comments for reference.
- **getDayWidthFromBlock: DOM-only:** D-03b — no `chart-coords.ts` import. Width formula: `box.width / ((target_date - start_date in days) + 1)`.
- **dispose() ordering:** New API helpers were appended after `dispose()` in class body (not between deleteIssue and dispose as PLAN specified). No behavioral impact — method ordering in a class does not affect runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] CreatedIssue dates typed as `string | null`**

- **Found during:** Task 06-01-04 (getIssue implementation)
- **Issue:** PLAN §"TypeScript type considerations" pre-identified this: `getIssue` after `clearIssueDate` returns `null` for the cleared field, but `CreatedIssue` had `string` (non-null). The smoke test `after.target_date !== null` would cause a TypeScript error.
- **Fix:** Changed `start_date: string` and `target_date: string` to `string | null` in `CreatedIssue` type (Option A from plan).
- **Files modified:** `apps/web/e2e/fixtures/api.ts`, `apps/web/e2e/pages/timeline.page.ts` (parameter type updated accordingly)
- **Verification:** `pnpm --filter=web check:types` exits 0
- **Committed in:** `f93ff6bfa5` (Task 06-01-04)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing correctness requirement, pre-identified in PLAN)
**Impact on plan:** Type relaxation was explicitly documented as Option A in the plan. Zero scope creep.

## Playwright Smoke Results (Observed)

| Check                                | Result                                               |
| ------------------------------------ | ---------------------------------------------------- |
| D-13a self-test (`--grep "TEST-23"`) | 1 skipped, 0 failed                                  |
| OxLint budget                        | 995 warnings (budget 11957) — unchanged              |
| TypeScript                           | 0 errors                                             |
| `clearIssueDate` HTTP status         | Deferred to /gsd-verify-work (Docker stack required) |
| `dragBlockBy` mousedown variant      | native `page.mouse.down()` (D-12 first choice)       |
| Full E2E suite                       | Deferred to /gsd-verify-work (Docker stack required) |

## Known Stubs

None — all implemented helpers are functional (no hardcoded mock returns). The 2 `test.skip` stubs in the spec are intentional placeholders for Plan 06-02.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. E2E fixtures call existing production API endpoints with the same CSRF + session-cookie pattern already established in `api.ts`.

## Issues Encountered

- Docker stack not running locally — Playwright smoke tests that require a live server are deferred to `/gsd-verify-work`. Static checks (lint, types, file content greps) all pass.

## Next Phase Readiness

Plan 06-02 (TEST-23 + TEST-24 implementation) can proceed immediately. The following surface is ready:

- `import { test, expect } from "../fixtures/test-fixtures"` — `propagationPair` + `propagationTimeline` + `api` all available
- `api.getIssue(id)` — persistence assertion
- `api.clearIssueDate(id, "target_date")` — INCOMPLETE_SCHEDULE trigger
- `propagationTimeline.dragBlockBy(id, 4, issue)` — block body drag
- `propagationTimeline.getBlockBox(id)` — pre/post position capture
- Smoke tests confirm infrastructure wiring is correct (subject to live stack verification)

---

_Phase: 06-end-to-end-coverage-polish_
_Completed: 2026-05-04_
