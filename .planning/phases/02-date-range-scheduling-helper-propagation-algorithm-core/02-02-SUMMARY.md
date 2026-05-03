---
phase: 02-date-range-scheduling-helper-propagation-algorithm-core
plan: "02"
subsystem: api
tags: [python, bfs, propagation, scheduling, pure-python, datetime, algorithm]

# Dependency graph
requires:
  - phase: 02-date-range-scheduling-helper-propagation-algorithm-core/02-01
    provides: "errors.py PropagationErrorCode/PropagationFailure, types.py ScheduledWorkItem/MoveIntent/WorkItemUpdate/PropagationResult, scheduling.py six pure helpers, propagation.py STUB, test scaffolding"
provides:
  - "Full propagate_move BFS frontier-walk algorithm replacing the NotImplementedError STUB"
  - "D-01 through D-11 algorithmic decisions implemented in propagation.py"
  - "28 unit tests covering all 11 PRD-pinned cases (TEST-01..TEST-09, TEST-12, TEST-14) plus 17 auxiliary edge-case tests"
  - "Phase 3 hand-off: clean PropagationResult interface for bulk_update integration"
affects:
  - "02-03-purity-coverage-gate (will lint-grep propagation.py for timedelta import ban)"
  - "phase-03 (consumes propagate_move inside transaction.atomic)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-direction BFS frontier walk parameterized by delta sign (D-01)"
    - "All date arithmetic isolated in scheduling.py seam (D-03)"
    - "Fixed validation order INVALID_DATE_RANGE→CYCLE→INCOMPLETE→SCHEDULE_CHANGED→walk (D-06)"
    - "Lazy INCOMPLETE_SCHEDULE and PROPAGATION_LIMIT_EXCEEDED detection during walk"
    - "Cross-project reachability reverse indices built once at top of propagate_move (D-10)"
    - "Dragged item FIRST in updates, others sorted by UUID for deterministic output (Pitfall 11)"
    - "Re-enqueue on larger/smaller shift for merge/split cases (Pitfall 4)"

key-files:
  created: []
  modified:
    - "apps/api/plane/app/services/timeline_propagation/propagation.py"
    - "apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py"

key-decisions:
  - "D-01: BFS direction from delta sign; delta==0 short-circuits to single-item return (no traversal)"
  - "D-03: propagation.py never imports timedelta — all date math routes through scheduling.py helpers"
  - "D-06 validation order is a contract: INVALID_DATE_RANGE beats DEPENDENCY_CYCLE beats INCOMPLETE beats SCHEDULE_CHANGED"
  - "D-08: SCHEDULE_CHANGED uses expected_versions.get(dragged_id) only; untouched neighbors never compared"
  - "D-11: affected set counts distinct shifted items; check len>100 immediately after each add"
  - "Test fixture: _build_chain uses timedelta for date arithmetic to avoid January day overflow (> 31 days)"
  - "Phase 3 hand-off note: bulk_update + auto_now interaction must be decided (see Pitfall 10 in RESEARCH.md)"

patterns-established:
  - "BFS walk helper functions underscore-prefixed (_walk_forward, _walk_backward, _ok, _fail) per graph.py convention"
  - "Test classes map 1:1 to TEST-NN PRD cases; auxiliary tests pin D-NN decisions"
  - "Module-level _make_* fixture helpers instead of pytest fixtures for pure-dataclass tests (D-13)"

requirements-completed:
  - PROP-03
  - PROP-04
  - PROP-05
  - PROP-06
  - PROP-07
  - PROP-09
  - PROP-12
  - PROP-13
  - TEST-01
  - TEST-02
  - TEST-03
  - TEST-04
  - TEST-05
  - TEST-06
  - TEST-07
  - TEST-08
  - TEST-09
  - TEST-12
  - TEST-14

# Metrics
duration: 35min
completed: 2026-05-04
---

# Phase 02 Plan 02: propagate_move BFS algorithm core + 28-test suite

**Full BFS frontier-walk implementation of propagate_move replacing NotImplementedError STUB: D-01 direction-from-delta, D-02 adjacency math, D-06 validation order, D-07 cycle fail-fast, D-08 dragged-only stale check, D-09/D-11 lazy detection — all 11 PRD-pinned tests GREEN plus 17 auxiliary edge-case tests.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-04T00:00:00Z
- **Completed:** 2026-05-04
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced Plan 02-01 `NotImplementedError` STUB with complete 419-line BFS algorithm
- All 11 PRD-pinned test cases (TEST-01..TEST-09, TEST-12, TEST-14) GREEN covering PROP-03 through PROP-17
- 17 auxiliary edge-case tests covering D-06 validation order, D-07 cycle fail-fast, D-08 dragged-only stale check, D-09 lazy INCOMPLETE, D-10 cross-project reachability, D-11 limit boundary at 100/101
- No timedelta import in propagation.py (D-03 purity seam preserved for Plan 02-03 lint-grep gate)
- Merge case handled correctly (Pitfall 5): only visited predecessors constrain required_start
- 28 tests total; all @pytest.mark.unit; no @pytest.mark.django_db

## Task Commits

1. **Task 1: Replace propagation.py STUB with full BFS algorithm** - `7068e5a4fb` (feat)
2. **Task 2: Replace test_propagation.py STUB test with 11 PRD-pinned cases + auxiliary suite** - `0281e99a81` (test)

## Files Created/Modified

- `apps/api/plane/app/services/timeline_propagation/propagation.py` — 419 lines; full BFS algorithm; 5 functions (propagate_move + _walk_forward + _walk_backward + _ok + _fail)
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — 28 tests across 18 test classes (TestErrorsModule, TestPublicSurface + 16 new algorithmic classes)

## Decisions Made

- `_build_chain` fixture uses `timedelta` for date arithmetic (test-only local import) to avoid January day overflow when building 100/101-node chains — without timedelta the chain would overflow `date(2026, 1, N)` at N>31. This is explicitly allowed in test files per Plan task note.
- `test_cycle_fires_before_incomplete_schedule_on_dragged` added as extra auxiliary test to pin D-06 step 2 vs step 3 ordering — this pins a subtle but important validation-order contract.
- The merge case (TEST-06) uses "only visited predecessors constrain required_start" (Pitfall 5). When A→C and B→C, dragging A rightward walks A then its successor C. At C, only A's new target is in `new_dates_by_id`; B's original target is ignored. This is correct per D-02 semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed _build_chain date overflow for 100/101-node chains**
- **Found during:** Task 2 (test_propagation.py implementation)
- **Issue:** `date(2026, 1, 1 + 2 * i)` overflows when `i >= 15` (day > 31 for January); `_build_chain(100)` crashed with `ValueError: day is out of range for month`
- **Fix:** Changed to `base + timedelta(days=2 * i)` arithmetic using a local `timedelta` import (test-only; production code is still forbidden). This correctly spans multiple months.
- **Files modified:** `test_propagation.py`
- **Verification:** `test_TEST_12_at_101_distinct_affected_fails` and `test_at_100_distinct_affected_succeeds` both pass
- **Committed in:** `0281e99a81` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary for correctness; no scope creep.

## Issues Encountered

- Python environment in the worktree did not have Django dependencies installed (celery, redis, dj-database-url, psycopg[binary], pytz, django-crum, etc.). Installed piecemeal as each missing module surfaced. This is a local dev environment setup issue, not a code issue.
- `test_graph.py` (Phase 1 tests) fails with database connection errors because PostgreSQL is not running in this environment — these are pre-existing failures documented in `deferred-items.md` and not caused by this plan.

## Known Stubs

None. `propagation.py` fully implements all algorithmic cases. No placeholder data flows to UI rendering.

## Threat Flags

None. Pure-Python algorithm with no auth boundary, SQL, network, PII, or untrusted input.

## Phase 3 Hand-off Notes

- **bulk_update + auto_now interaction (RESEARCH.md Pitfall 10):** Phase 3's plan-phase MUST decide between: (a) explicit `updated_at = timezone.now()` + extended `bulk_update` field list, (b) follow-up `Issue.objects.filter(...).update(updated_at=...)`, or (c) accept existing convention. `WorkItemUpdate.updated_at` carries the INPUT value (clock-free Phase 2); Phase 3 sets the post-write value when assembling the response.
- **`PERMISSION_DENIED`** is declared in `errors.py` for symmetry but is RAISED only by Phase 3's viewset; Phase 2 never emits it.
- **`expected_versions` shape is `Mapping[UUID, datetime]`:** Phase 3 will pass `{move_intent.work_item_id: request.expected_updated_at}` as a single-entry dict. The `Mapping` shape lets Phase 3 extend to stricter multi-item checks later without changing the Phase 2 signature.

## Next Phase Readiness

- Plan 02-03 (lint-grep purity gate + coverage confirmation) can proceed immediately
- Phase 3 (DRF view, bulk_update, transactional persistence) can proceed after Plan 02-03 completes
- Phase 1 tests (`test_graph.py` DB-dependent cases) require a running PostgreSQL instance — not a blocker for Phase 2 or 3

---
*Phase: 02-date-range-scheduling-helper-propagation-algorithm-core*
*Completed: 2026-05-04*

## Self-Check: PASSED

- FOUND: `apps/api/plane/app/services/timeline_propagation/propagation.py`
- FOUND: `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py`
- FOUND commit: `7068e5a4fb` (Task 1 - feat propagation.py)
- FOUND commit: `0281e99a81` (Task 2 - test test_propagation.py)
- 28 tests collected and passed in test_propagation.py
