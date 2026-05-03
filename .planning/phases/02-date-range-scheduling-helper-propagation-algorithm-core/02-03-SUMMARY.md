---
phase: 02-date-range-scheduling-helper-propagation-algorithm-core
plan: "03"
subsystem: api
tags: [python, lint-grep, purity, coverage, timedelta-seam, unit-tests]

# Dependency graph
requires:
  - phase: 02-date-range-scheduling-helper-propagation-algorithm-core/02-01
    provides: "scheduling.py (timedelta seam), errors.py, types.py stubs"
  - phase: 02-date-range-scheduling-helper-propagation-algorithm-core/02-02
    provides: "Full propagate_move BFS algorithm in propagation.py"
provides:
  - "D-14 purity invariant locked: test_purity.py::TestModulePurity enforces 8 forbidden imports across all timeline_propagation/*.py"
  - "D-03 timedelta seam locked: test_purity.py::TestSchedulingSeam enforces no timedelta import in propagation.py"
  - "Coverage gate passed: Phase 2 files (errors.py, scheduling.py, propagation.py, types.py) at 97% line coverage"
  - "8 additional coverage-gap tests in test_propagation.py covering backward walk branches"
affects:
  - "phase-03 (structural defense-in-depth: D-14 prevents HTTP/ORM coupling drift)"
  - "ADR-0002 (D-03 seam enforcement means scheduling.py swap will not require algorithm changes)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lint-grep purity test via pathlib rglob + substring match with docstring-strip heuristic"
    - "Positive seam assertion (test_scheduling_is_the_only_module_that_imports_timedelta) guards regression"
    - "Coverage-gap fill: backward-walk branches (cross-project, missing-items, gap-stop, limit, merge re-enqueue)"

key-files:
  created:
    - "apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py"
  modified:
    - "apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py"

key-decisions:
  - "test_purity.py is a NEW sibling file (option b from RESEARCH.md Open Question 6) — keeps test_graph.py Phase 1 focused and gives Phase 3+ a single home to extend the purity invariant"
  - "Phase 1 test_no_drf_or_http_imports_in_module in test_graph.py is NOT deleted; it stays as an independent regression guard"
  - "_is_docstring_or_comment_line helper uses triple-quote counting heuristic (conservative bias: false positives are better than false negatives for this gate)"
  - "Coverage measured on Phase 2 files only (errors.py + scheduling.py + propagation.py + types.py); graph.py excluded — it requires PostgreSQL and is Phase 1's responsibility"
  - "8 coverage-gap tests added to test_propagation.py (not test_purity.py) per plan task 2 guidance"

patterns-established:
  - "Purity test walks pkg_root.rglob('*.py') with per-line comment stripping for docstring-safe checks"
  - "Positive seam assertion complements negative ban (the seam must EXIST in scheduling.py)"
  - "Coverage-gap tests are grouped in TestForwardWalkGaps / TestBackwardWalkGaps classes with docstring linking to propagation.py line numbers"

requirements-completed:
  - PROP-11
  - PROP-14

# Metrics
duration: 20min
completed: 2026-05-04
---

# Phase 02 Plan 03: Lint-grep purity invariant + timedelta swap-seam check + coverage gate

**D-14 purity tests + D-03 timedelta seam lock: 3 new purity tests in test_purity.py, 8 coverage-gap tests in test_propagation.py, Phase 2 files at 97% line coverage.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-04T00:00:00Z
- **Completed:** 2026-05-04
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `test_purity.py` with `TestModulePurity` (D-14: 8 forbidden imports across all package files) and `TestSchedulingSeam` (D-03: timedelta ban on propagation.py + positive seam assertion on scheduling.py)
- 3 new lint-grep purity tests GREEN; Phase 1 `test_no_drf_or_http_imports_in_module` in `test_graph.py` UNCHANGED and GREEN
- Added 8 coverage-gap tests to `test_propagation.py` covering `_walk_backward` branches missed by Plan 02-02's 28-test suite
- Phase 2 files (errors.py, scheduling.py, propagation.py, types.py) at **97% line coverage** (6 uncovered lines: defensive else-branch non-action paths in merge re-enqueue and the `continue` guards)
- Total Phase 2 unit tests: 53 GREEN (14 scheduling + 36 propagation + 3 purity)
- Zero modifications to production code (Phase 1 or Phase 2 production files)

## Task Commits

1. **Task 1: Create test_purity.py with TestModulePurity + TestSchedulingSeam** - `bf6ff454f3` (test)
2. **Task 2: Coverage-gap tests for propagation.py backward/forward walk branches** - `a919ef6195` (test)

## Files Created/Modified

- `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` — 176 lines; 2 test classes (TestModulePurity + TestSchedulingSeam); 3 tests total
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — +300 lines; 2 new test classes (TestForwardWalkGaps + TestBackwardWalkGaps); 8 new tests; 36 total

## Coverage Report

| File | Stmts | Miss | Cover | Missing Lines |
|------|-------|------|-------|---------------|
| errors.py | 17 | 0 | **100%** | — |
| scheduling.py | 13 | 0 | **100%** | — |
| types.py | 58 | 0 | **100%** | — |
| propagation.py | 120 | 6 | **95%** | 248, 276-277, 328, 354-355 |
| **TOTAL (Phase 2 files)** | **208** | **6** | **97%** | — |

**Coverage ≥ 95% gate: PASSED** (97% on Phase 2 files)

Note: `graph.py` (Phase 1, 76 statements, 21% coverage without PostgreSQL) is excluded from the Phase 2 coverage measurement because its tests (`test_graph.py::TestLoadPrecedenceGraph*`) require a running PostgreSQL instance. This is a known pre-existing environment constraint documented in Plan 02-02's SUMMARY.md.

### Uncovered Lines (6 of 120 in propagation.py)

All 6 uncovered lines are defensive non-action branches in the already-visited-node merge logic:
- **Line 248**: `continue` in `_walk_forward` — guard: `not visited_pred_targets` (BFS invariant means this path cannot be reached in a well-formed walk; the comment explains this)
- **Lines 276-277**: `else` branch of forward re-enqueue — when `new_start <= existing_start` (no re-enqueue needed; visited node's shift is already >= the new demand)
- **Line 328**: `continue` in `_walk_backward` — symmetric guard for `not visited_succ_starts`
- **Lines 354-355**: `else` branch of backward re-enqueue — when `new_target >= existing_target` (no re-enqueue needed)

These branches represent the negative path of the "merge re-enqueue" optimization — they guard correctness but are hit only when a node is revisited with a same-or-smaller demand than its current shift. Adding tests for them would require highly contrived multi-predecessor graphs with precise timing, and the algorithmic value is low (they're no-ops). Documented here for Phase 3/4 reference.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coverage target required additional tests in test_propagation.py**
- **Found during:** Task 2
- **Issue:** Running `--cov=plane.app.services.timeline_propagation.propagation` showed propagation.py at 87% (16 uncovered lines). The plan's Task 2 explicitly calls for adding targeted tests if coverage falls short.
- **Fix:** Added 8 coverage-gap tests in `TestForwardWalkGaps` and `TestBackwardWalkGaps` classes to test_propagation.py, covering 10 of the 16 uncovered lines. 6 lines remain uncovered (defensive non-action `else` branches documented above).
- **Files modified:** `test_propagation.py`
- **Commit:** `a919ef6195` (Task 2 commit)

**2. [Rule 3 - Blocking] pytest-cov not installed in test environment**
- **Found during:** Task 2 coverage run
- **Issue:** `python -m pytest --cov=...` returned "unrecognized arguments" — pytest-cov package was not installed.
- **Fix:** `pip install pytest-cov coverage` (7.13.5 and 7.1.0 respectively). These are test-time dev dependencies already used in the project's broader test infrastructure.
- **Impact:** No code changes; environment setup only.

## Phase 2 Closure

All Phase 2 deliverables are complete:
- **02-01**: errors.py + types.py additions + scheduling.py + propagation.py STUB + test scaffolding (18 tests GREEN)
- **02-02**: Full BFS algorithm replacing STUB; all 11 PRD-pinned test cases GREEN (28 tests)
- **02-03**: Purity lock (D-14 + D-03) + coverage gate ≥ 95% (3 + 8 = 11 new tests; 53 total GREEN)

Requirements completed across Phase 2: PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-08, PROP-09, PROP-10, PROP-11, PROP-12, PROP-13, PROP-14, PROP-17, TEST-01..TEST-09, TEST-12, TEST-14.

## Phase 3 Hand-off Notes

Phase 3's plan-phase MUST address:
1. **bulk_update + auto_now interaction (RESEARCH.md Pitfall 10):** Decide between (a) explicit `updated_at = timezone.now()` + extended `bulk_update` field list, (b) follow-up `Issue.objects.filter(...).update(updated_at=...)`, or (c) accept Django's `auto_now` behavior. `WorkItemUpdate.updated_at` carries the INPUT value (clock-free Phase 2 contract); Phase 3 sets the post-write value when assembling the response.
2. **HTTP status code mapping per PropagationErrorCode:** e.g., 409 for `SCHEDULE_CHANGED`, 422 for `INVALID_DATE_RANGE`/`INCOMPLETE_SCHEDULE`/`PROPAGATION_LIMIT_EXCEEDED`, 403 for `PERMISSION_DENIED`, 409 for `DEPENDENCY_CYCLE`/`PROJECT_BOUNDARY_EXCEEDED`.
3. **`expected_updated_at` ISO precision in the request serializer:** The client sends a datetime string; the serializer must parse it at microsecond precision to match Django's `DateTimeField(auto_now=True)` output.
4. **Contract test TEST-13 (stale check via full HTTP roundtrip):** The in-memory algorithm version lives in test_propagation.py (Phase 2); the contract-level test belongs in Phase 3 with a real endpoint and transactional rollback.

## Known Stubs

None. All test_purity.py and test_propagation.py additions are complete and GREEN.

## Threat Flags

None. This plan adds tests only — no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- FOUND: `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py`
- FOUND: `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` (modified)
- FOUND commit: `bf6ff454f3` (Task 1 - test test_purity.py)
- FOUND commit: `a919ef6195` (Task 2 - test test_propagation.py coverage gaps)
- 53 tests GREEN (3 purity + 36 propagation + 14 scheduling)
- Phase 2 file coverage: errors.py=100%, scheduling.py=100%, types.py=100%, propagation.py=95% → TOTAL=97%
- Phase 1 `test_no_drf_or_http_imports_in_module` UNCHANGED and GREEN in test_graph.py
- Production files unchanged: propagation.py, scheduling.py, errors.py, types.py have 0 modifications
