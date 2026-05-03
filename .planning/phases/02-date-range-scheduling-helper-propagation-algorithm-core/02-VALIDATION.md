---
phase: 2
slug: date-range-scheduling-helper-propagation-algorithm-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| **Framework**          | pytest 8.x + pytest-django (existing in `apps/api`)                                                       |
| **Config file**        | `apps/api/pytest.ini` (`--reuse-db --nomigrations` defaults; markers `unit`, `contract`, `smoke`, `slow`) |
| **Quick run command**  | `cd apps/api && python run_tests.py -u`                                                                   |
| **Full suite command** | `cd apps/api && python run_tests.py -u --coverage` (enforces `--fail-under=90`)                           |
| **Estimated runtime**  | ~5 seconds for the timeline_propagation unit module; ~20 seconds for `-u` suite                           |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && python -m pytest plane/tests/unit/services/timeline_propagation/ -q`
- **After every plan wave:** Run `cd apps/api && python run_tests.py -u`
- **Before `/gsd-verify-work`:** Full suite (`-u --coverage`) must be green; `timeline_propagation/` package coverage MUST be ≥ 95% (per CONTEXT.md "near-100% covered" target).
- **Max feedback latency:** ~5 seconds (pure-Python unit tests; no DB roundtrip per D-13)

---

## Per-Task Verification Map

> Plan IDs and task IDs will be assigned by `gsd-planner`. The mapping below is the **target test → requirement** matrix the planner MUST honor when assigning `<automated>` blocks. Each PRD-pinned test name (`test_TEST_NN_*`) is the green target for one task.

| Test name                                                                                                                                                        | Plan (TBD) | Wave | Requirement(s)            | Decision Ref | Test Type        | Automated Command                                                                                                                     | Status     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | ------------------------- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `test_propagation.py::TestErrorsModule::test_seven_str_enum_codes_present_in_canonical_order`                                                                    | TBD        | 0    | PROP-14                   | D-05         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestErrorsModule -q`                                      | ⬜ pending |
| `test_propagation.py::TestPublicSurface::test_init_exports_propagate_move_and_value_types`                                                                       | TBD        | 0    | PROP-14                   | D-04, D-12   | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestPublicSurface -q`                                     | ⬜ pending |
| `test_scheduling.py::TestRangeDuration::test_zero_duration_when_start_equals_target`                                                                             | TBD        | 1    | PROP-08                   | D-03         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_scheduling.py -q`                                                         | ⬜ pending |
| `test_scheduling.py::TestBoundaryViolation::test_adjacent_succ_start_equals_pred_target_plus_one_is_valid`                                                       | TBD        | 1    | PROP-10                   | D-02         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_scheduling.py -q`                                                         | ⬜ pending |
| `test_propagation.py::TestNoViolationMove::test_TEST_01_only_dragged_item_updated`                                                                               | TBD        | 2    | PROP-03, TEST-01          | D-01, D-04   | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestNoViolationMove -q`                                   | ⬜ pending |
| `test_propagation.py::TestRightwardPropagation::test_TEST_02_single_successor_shift`                                                                             | TBD        | 3    | PROP-04, PROP-09, TEST-02 | D-01, D-02   | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestRightwardPropagation -q`                              | ⬜ pending |
| `test_propagation.py::TestLeftwardPropagation::test_TEST_03_single_predecessor_shift`                                                                            | TBD        | 3    | PROP-05, PROP-09, TEST-03 | D-01, D-02   | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestLeftwardPropagation -q`                               | ⬜ pending |
| `test_propagation.py::TestTransitiveChain::test_TEST_04_three_node_chain_full_shift`                                                                             | TBD        | 4    | PROP-06, TEST-04          | D-01         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestTransitiveChain -q`                                   | ⬜ pending |
| `test_propagation.py::TestSplitBranches::test_TEST_05_split_successor_branches_each_shifted`                                                                     | TBD        | 4    | PROP-06, TEST-05          | D-01         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestSplitBranches -q`                                     | ⬜ pending |
| `test_propagation.py::TestMergeBranches::test_TEST_06_merge_predecessor_branches_max_shift_wins`                                                                 | TBD        | 4    | PROP-06, TEST-06          | D-01, D-02   | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestMergeBranches -q`                                     | ⬜ pending |
| `test_propagation.py::TestGapPreservation::test_TEST_07_existing_gap_not_compressed`                                                                             | TBD        | 5    | PROP-07, TEST-07          | D-01         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestGapPreservation -q`                                   | ⬜ pending |
| `test_propagation.py::TestExactBoundaryAdjacency::test_TEST_08_adjacent_is_valid_not_a_violation`                                                                | TBD        | 5    | PROP-10, TEST-08          | D-02         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestExactBoundaryAdjacency -q`                            | ⬜ pending |
| `test_propagation.py::TestIncompleteSchedule::test_TEST_09_missing_dates_on_reachable_node_fails`                                                                | TBD        | 6    | PROP-17, TEST-09          | D-09         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestIncompleteSchedule -q`                                | ⬜ pending |
| `test_propagation.py::TestPropagationLimit::test_TEST_12_at_101_distinct_affected_fails`                                                                         | TBD        | 7    | PROP-13, TEST-12          | D-11         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestPropagationLimit -q`                                  | ⬜ pending |
| `test_propagation.py::TestPropagationLimit::test_at_100_distinct_affected_succeeds`                                                                              | TBD        | 7    | PROP-13                   | D-11         | unit             | (covered by command above)                                                                                                            | ⬜ pending |
| `test_propagation.py::TestInvalidDateRange::test_TEST_14_target_before_start_fails`                                                                              | TBD        | 7    | TEST-14                   | D-06         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestInvalidDateRange -q`                                  | ⬜ pending |
| `test_propagation.py::TestInvalidDateRange::test_duration_mismatch_fails_with_invalid_date_range`                                                                | TBD        | 7    | PROP-08                   | D-06         | unit             | (covered by command above)                                                                                                            | ⬜ pending |
| `test_propagation.py::TestCycleFailFast::test_load_result_cycle_short_circuits_regardless_of_reachability`                                                       | TBD        | 8    | PROP-15 (translated)      | D-07         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestCycleFailFast -q`                                     | ⬜ pending |
| `test_propagation.py::TestCrossProjectReachable::test_reachable_cross_project_edge_fails`                                                                        | TBD        | 8    | PROP-16 (translated)      | D-10         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestCrossProjectReachable -q`                             | ⬜ pending |
| `test_propagation.py::TestCrossProjectReachable::test_unreachable_cross_project_edge_succeeds`                                                                   | TBD        | 8    | PROP-16 (translated)      | D-10         | unit             | (covered by command above)                                                                                                            | ⬜ pending |
| `test_propagation.py::TestStaleSchedule::test_dragged_item_updated_at_mismatch_fails`                                                                            | TBD        | 8    | API-07 (algorithm-side)   | D-08         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestStaleSchedule -q`                                     | ⬜ pending |
| `test_propagation.py::TestStaleSchedule::test_untouched_neighbor_updated_at_difference_does_not_fail`                                                            | TBD        | 8    | API-07 (algorithm-side)   | D-08         | unit             | (covered by command above)                                                                                                            | ⬜ pending |
| `test_propagation.py::TestNoOpMove::test_delta_zero_returns_single_update_no_traversal`                                                                          | TBD        | 9    | PROP-03                   | D-01         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestNoOpMove -q`                                          | ⬜ pending |
| `test_propagation.py::TestValidationOrder::test_invalid_range_short_circuits_before_cycle`                                                                       | TBD        | 9    | PROP-12                   | D-06         | unit             | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestValidationOrder -q`                                   | ⬜ pending |
| `test_purity.py::TestModulePurity::test_no_drf_or_http_imports_in_module` (extends Phase 1's lint-grep test to `errors.py` / `scheduling.py` / `propagation.py`) | TBD        | 10   | PROP-14                   | D-14         | unit (lint-grep) | `pytest plane/tests/unit/services/timeline_propagation/test_purity.py -q` (or `test_graph.py::TestLoaderPurity` if extended in place) | ⬜ pending |
| `test_purity.py::TestSchedulingSeam::test_no_timedelta_imports_outside_scheduling` (Pitfall 9 from RESEARCH.md)                                                  | TBD        | 10   | PROP-11                   | D-03         | unit (lint-grep) | (covered by command above)                                                                                                            | ⬜ pending |
| Coverage gate: `cd apps/api && python run_tests.py -u --coverage`                                                                                                | TBD        | 10   | (phase-wide)              | D-13         | suite            | `python run_tests.py -u --coverage`                                                                                                   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

**Total automated tests:** 27 (the 11 PRD-pinned cases + 4 helper-level + 4 validation-order/edge + 4 cross-project/stale + 2 pitfall lint-grep + 1 limit success counterpart + coverage gate).

**Coverage budget:** `apps/api/plane/app/services/timeline_propagation/` package: ≥ 95% line + branch coverage. Phase 1 already at ~100%; Phase 2 maintains.

---

## Wave 0 Requirements

- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — empty file with `import pytest` plus the four `Test*` classes as `pass`-bodies, so pytest discovers them and the planner's later RED tests can land into pre-existing scaffolds.
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — same shape; one `Test*` class per algorithm category (`TestNoViolationMove`, `TestRightwardPropagation`, `TestLeftwardPropagation`, `TestTransitiveChain`, `TestSplitBranches`, `TestMergeBranches`, `TestGapPreservation`, `TestExactBoundaryAdjacency`, `TestIncompleteSchedule`, `TestPropagationLimit`, `TestInvalidDateRange`, `TestCycleFailFast`, `TestCrossProjectReachable`, `TestStaleSchedule`, `TestNoOpMove`, `TestValidationOrder`, `TestErrorsModule`, `TestPublicSurface`).
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` — extends Phase 1's lint-grep test to also walk `errors.py`, `scheduling.py`, `propagation.py` and assert no `rest_framework` / `django.http` / `plane.app.views` / `plane.app.serializers` / `transaction.atomic` imports.
- [ ] `apps/api/plane/app/services/timeline_propagation/errors.py` — empty stub with module docstring (so the `__init__.py` re-export in Wave 0's last task does not import-error).
- [ ] `apps/api/plane/app/services/timeline_propagation/scheduling.py` — empty stub with module docstring + the six helper signatures from CONTEXT.md D-03 as `def ... -> ...: raise NotImplementedError(...)`.
- [ ] `apps/api/plane/app/services/timeline_propagation/propagation.py` — empty stub with module docstring + `def propagate_move(...): raise NotImplementedError(...)` per D-12 signature.
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/conftest.py` (NEW or extended) — shared in-memory fixture builders (`build_adjacency(...)`, `build_scheduled_work_item(...)`, `build_move_intent(...)`) so per-test setup stays terse. NO `@django_db` fixtures.

_Existing pytest infrastructure (`pytest.ini`, `factories.py`, `run_tests.py`) covers the harness; Phase 2 adds only the per-package scaffolds above._

---

## Manual-Only Verifications

| Behavior                                                                                            | Requirement           | Why Manual                                                                                                | Test Instructions                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wire compatibility of the 7 `PropagationErrorCode` string values with the future Phase 3 serializer | API-06 (Phase 3 owns) | Phase 2 cannot test the serializer round-trip                                                             | Phase 3's contract test will assert `response.json()['code']` matches each `PropagationErrorCode.value` exactly. Phase 2 only locks the string identity; Phase 3 verifies the wire shape. |
| Performance budget on a 100-item propagation (single-process Python)                                | PROP-13               | Wall-clock measurement is environment-dependent; Phase 2 ships unit-test correctness, not perf benchmarks | Optional: add a `@pytest.mark.slow` benchmark in a follow-up that times `propagate_move(...)` on a synthetic 100-node chain and asserts < 100 ms; not required for Phase 2 sign-off.      |

_All required Phase 2 behaviors have automated verification — the table above lists deferred / cross-phase items, not gaps._

---

## Validation Sign-Off

- [ ] All Phase 2 tasks have `<automated>` verify pointing into `plane/tests/unit/services/timeline_propagation/`
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify (every wave's tasks land in the test files above)
- [ ] Wave 0 scaffolds cover all `MISSING` references (the six files listed above)
- [ ] No watch-mode flags in any `<automated>` command (`-q` only; never `--watch` / `pytest-watch`)
- [ ] Feedback latency < 5 s (per-task quick command runs the package subset, not the whole `-u` suite)
- [ ] `nyquist_compliant: true` set in frontmatter once the planner has filled the `Plan` and `Wave` columns above with concrete plan IDs

**Approval:** pending (will be set after planner finalizes plan/task IDs and the orchestrator re-runs the Nyquist gate).
