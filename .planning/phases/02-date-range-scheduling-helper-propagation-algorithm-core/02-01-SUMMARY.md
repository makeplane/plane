---
phase: 02-date-range-scheduling-helper-propagation-algorithm-core
plan: 01
subsystem: api
tags: [python, django, dataclasses, strenum, scheduling, timeline-propagation, pure-python, date-arithmetic]

# Dependency graph
requires:
  - phase: 01-precedence-graph-loader-normalization
    provides: "WorkItemNode, Edge, Adjacency, LoadResult, load_precedence_graph — Phase 1 public surface consumed as frozen inputs"

provides:
  - "errors.py: PropagationErrorCode StrEnum (7 canonical wire codes, D-05) + PropagationFailure frozen dataclass"
  - "types.py: 4 new frozen+slots dataclasses — ScheduledWorkItem, MoveIntent, WorkItemUpdate, PropagationResult (D-04)"
  - "scheduling.py: 6 pure date helpers — range_duration, add_calendar_days, next_valid_start, previous_valid_target, is_valid_range, boundary_violation (D-03 ADR-0002 swap seam)"
  - "propagation.py: propagate_move STUB raising NotImplementedError — importable, testable; Plan 02-02 fills the body"
  - "__init__.py: 18-entry public barrel (5 Phase 1 + 13 Phase 2, D-12)"
  - "test_scheduling.py: 14 GREEN unit tests covering all 6 helpers (PROP-11 / PROP-08 / D-02)"
  - "test_propagation.py: 5 GREEN scaffold tests (TestErrorsModule x2 + TestPublicSurface x3 including STUB raise)"
  - "Phase 1 regression: 11 tests still GREEN (no regression)"
  - "Total: 30 GREEN tests across the package"

affects: [phase-2-plan-02, phase-3]

# Tech tracking
tech-stack:
  added:
    - "StrEnum (Python 3.12 stdlib) — first use in apps/api/plane/"
  patterns:
    - "Date-arithmetic seam pattern: scheduling.py as the ONLY module importing timedelta; propagation.py MUST NOT import timedelta directly (D-03)"
    - "Result-pattern frozen dataclass: PropagationResult mirrors LoadResult shape (failure is None iff success)"
    - "7-value StrEnum wire contract: enables JSON serialization without ceremony, iteration, membership, and match-by-member"
    - "Pure in-memory unit test fixtures: hand-built Adjacency/LoadResult/ScheduledWorkItem literals, no @pytest.mark.django_db (D-13)"
    - "Inter-plan RED handoff: test_propagate_move_stub_raises_not_implemented exists as Plan 02-02's immediate GREEN target"

key-files:
  created:
    - apps/api/plane/app/services/timeline_propagation/errors.py
    - apps/api/plane/app/services/timeline_propagation/scheduling.py
    - apps/api/plane/app/services/timeline_propagation/propagation.py
    - apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py
    - apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py
  modified:
    - apps/api/plane/app/services/timeline_propagation/types.py
    - apps/api/plane/app/services/timeline_propagation/__init__.py

key-decisions:
  - "D-05 honored: PropagationErrorCode is StrEnum (not plain Enum, not Literal) — enables iteration, membership, JSON serialization without .value ceremony"
  - "D-04 honored: Phase 1 types (WorkItemNode, Edge, Adjacency, LoadResult) byte-identical; 4 new types appended at end of types.py"
  - "D-03 honored: scheduling.py is the single date-arithmetic seam; propagation.py STUB has zero timedelta imports"
  - "D-12 honored: __init__.py __all__ = 18 entries (alphabetic); scheduling helpers re-exported per Claude's Discretion bullet 4"
  - "D-13 honored: test files use @pytest.mark.unit only, zero @pytest.mark.django_db"
  - "D-14 honored: lint-grep purity test (test_no_drf_or_http_imports_in_module) passes with the 3 new Phase 2 files"
  - "Tests run via Docker container (plane-api-1) which has Python 3.12 + dependencies; worktree has no local venv"

requirements-completed: [PROP-08, PROP-10, PROP-11, PROP-14, PROP-17]

# Metrics
duration: 6min
completed: 2026-05-03
---

# Phase 02 Plan 01: Scaffold + errors + types + scheduling helpers Summary

**PropagationErrorCode StrEnum (7 wire codes), 4 frozen-dataclass value types, 6 pure date helpers, propagate_move STUB, and 19 new GREEN tests establishing the typed contract for Plan 02-02's BFS algorithm**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-03T16:56:17Z
- **Completed:** 2026-05-03T17:01:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created `errors.py` with `PropagationErrorCode` (StrEnum, 7 canonical codes) + `PropagationFailure` (frozen+slots dataclass) — stable wire contract for Phase 3 DRF view
- Extended `types.py` with 4 new frozen+slots dataclasses (`ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`) without modifying Phase 1's 4 types
- Created `scheduling.py` with 6 pure date helpers establishing the ADR 0002 swap seam (D-03)
- Created `propagation.py` STUB so `__init__.py` re-exports compile and test scaffolding can assert importability
- Extended `__init__.py` to 18-entry `__all__` barrel covering all Phase 1 + Phase 2 public surface
- 14 GREEN `test_scheduling.py` tests covering all 6 helpers + 3 boundary edge cases
- 5 GREEN `test_propagation.py` scaffold tests including inter-plan RED handoff (STUB raises NotImplementedError)
- 11 Phase 1 tests still GREEN (zero regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create errors.py + extend types.py** - `bc63251851` (feat)
2. **Task 2: Create scheduling.py + propagation.py + __init__.py + tests** - `633fd0440f` (feat)

**Plan metadata:** [to be committed]

## Files Created/Modified

- `apps/api/plane/app/services/timeline_propagation/errors.py` — PropagationErrorCode StrEnum + PropagationFailure dataclass (NEW, 50 lines)
- `apps/api/plane/app/services/timeline_propagation/types.py` — Appended 4 new dataclasses; extended imports (MODIFIED, +77 lines)
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — 6 pure date-arithmetic helpers (NEW, 65 lines)
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — propagate_move STUB (NEW, 40 lines)
- `apps/api/plane/app/services/timeline_propagation/__init__.py` — 18-entry barrel re-export (MODIFIED, replaces 23-line Phase 1 version)
- `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — 14 GREEN tests (NEW)
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — 5 GREEN scaffold tests (NEW)

## Public Surface (18 entries)

Phase 1 (5): `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph`

Phase 2 (13):
- Types (D-04): `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`
- Errors (D-05): `PropagationErrorCode`, `PropagationFailure`
- Algorithm (D-12): `propagate_move`
- Scheduling helpers (D-03): `add_calendar_days`, `boundary_violation`, `is_valid_range`, `next_valid_start`, `previous_valid_target`, `range_duration`

## Test Counts

| Suite | Tests | Status |
|-------|-------|--------|
| test_graph.py (Phase 1 regression) | 11 | GREEN |
| test_scheduling.py | 14 | GREEN |
| test_propagation.py | 5 | GREEN |
| **Total** | **30** | **GREEN** |

## Decisions Made

- Used Docker container (plane-api-1 with Python 3.12.5) to run tests since the worktree has no local venv with Django/pytest dependencies. Files were `docker cp`'d into the container for verification.
- Used `from datetime import date` in test_propagation.py (cleaner than `__import__` pattern) as the plan explicitly allowed this as an acceptable alternative.
- No `__post_init__` validators on any dataclass — PROP-08 duration enforcement deferred to `propagate_move(...)` body per D-04 / plan decision.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria verified.

## Issues Encountered

- No local Python virtualenv with Django/Celery/pytest in the worktree. Resolution: used the running `plane-api-1` Docker container (Python 3.12.5) via `docker cp` + `docker exec` for all test verification. This is consistent with the development environment described in CLAUDE.md.

## Open Hand-off to Plan 02-02

Plan 02-02 must:
1. Replace `propagation.py` STUB body with the full BFS frontier walk (D-01 algorithm)
2. Remove `test_propagate_move_stub_raises_not_implemented` test class from `test_propagation.py`
3. Add all 11 PRD-pinned algorithm tests (TEST-01..TEST-09, TEST-12, TEST-14) plus edge cases
4. All imports, types, and scheduling helpers from Plan 02-01 are in place — no `__init__.py` changes needed

## Next Phase Readiness

- Full Phase 2 typed contract available for Plan 02-02 (BFS algorithm)
- propagate_move entry point importable and raising NotImplementedError (clean RED handoff)
- All Phase 1 infrastructure unmodified and passing
- D-03 swap seam established in scheduling.py for ADR 0002 future

## Known Stubs

- `propagation.py::propagate_move` — raises `NotImplementedError("propagate_move lands in Plan 02-02")`. This is intentional per plan design; Plan 02-02 replaces the body.

## Threat Flags

None — pure-Python algorithm scaffolding; no auth boundary, no SQL, no network, no PII, no untrusted input. `PROPAGATION_LIMIT_EXCEEDED` enum value introduced for D-11 (declared here, enforced in Plan 02-02).

---

## Self-Check

Checking created files exist:
- `apps/api/plane/app/services/timeline_propagation/errors.py` — FOUND
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — FOUND
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — FOUND
- `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — FOUND
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — FOUND

Checking commits exist:
- `bc63251851` (Task 1: errors.py + types.py) — FOUND
- `633fd0440f` (Task 2: scheduling.py + propagation.py + __init__.py + tests) — FOUND

## Self-Check: PASSED

---
*Phase: 02-date-range-scheduling-helper-propagation-algorithm-core*
*Completed: 2026-05-03*
