---
phase: 01-precedence-graph-loader-normalization
plan: 02
subsystem: api
tags:
  [python, django, graph-algorithm, cycle-detection, three-color-dfs, precedence-graph, timeline-propagation, tdd-green]

# Dependency graph
requires:
  - phase: 01-precedence-graph-loader-normalization
    provides: "timeline_propagation public surface (WorkItemNode, Edge, Adjacency, LoadResult), barrel __init__.py forward-referencing .graph, RED test_relates_to_is_dropped"
provides:
  - "load_precedence_graph(relations, project_id) -> LoadResult — pure-Python loader: blocked_by filter + direction translation + cross-project classification + iterative three-color DFS cycle detection"
  - "_make_edge — direction translation (predecessor=related_issue_id, successor=issue_id) with both-endpoints cross-project classification (PROP-16 strict)"
  - "_detect_cycle — iterative three-color DFS with self-edge guard, deterministic sort order, never throws across module boundary"
  - "10/10 tests in 01-VALIDATION.md GREEN — every PROP/D-NN identifier in Phase 1 pinned by at least one test"
  - "Lint-grep purity test — D-08 / PROP-18 invariant pinned for the future Phase 2 modules (scheduling.py, propagation.py, errors.py)"
affects: [phase-2, phase-3]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Iterative three-color DFS (white/gray/black) with explicit list-of-(node, iter) stack — first cycle-detection algorithm in apps/api/plane/"
    - "Deterministic DFS iteration order via sorted() on roots and successors — keeps test assertions on the cycle tuple stable across runs (Pitfall 4)"
    - "typing.Protocol structural-typed row input (RelationLike) — first Protocol use in apps/api/plane/; lets the loader accept ORM rows OR plain dataclasses without import-time coupling"
    - "Lint-grep purity test pattern: pathlib.Path.rglob('*.py') over a deep-module package + assertion on absence of forbidden import substrings — first instance of this enforcement in the test suite"
    - "Both-endpoints cross-project classification: ANY foreign endpoint taints the edge (PROP-16 'paths reaching outside the project fail propagation' applies regardless of which side of the row holds the foreign Issue)"
    - "TDD inter-plan handoff fully closed: Plan 01-01 shipped the failing PROP-02 test, Plan 01-02 Task 1's first action drove it GREEN, Task 2 added the remaining 9 tests"

key-files:
  created:
    - apps/api/plane/app/services/timeline_propagation/graph.py
    - .planning/phases/01-precedence-graph-loader-normalization/deferred-items.md
  modified:
    - apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py

key-decisions:
  - "D-01 honored: loader is a pure free function over Iterable[RelationLike]; no IssueRelation.objects.filter() call inside; no DRF/HTTP/views/serializers imports."
  - "D-02 honored: cycle detection is iterative three-color DFS; no recursion; no sys.setrecursionlimit; never throws across the module boundary."
  - "D-03 honored: cross-project edges live in Adjacency.cross_project_edges with cross_project=True and never enter same-project successors/predecessors; foreign issue dates are never dereferenced (only project_id is read)."
  - "D-04 honored: row(issue=X, related_issue=Y, blocked_by) → Edge(predecessor=Y, successor=X) with the verbatim Pitfall 1 comment in the source."
  - "D-05 honored: defensive deleted_at IS NULL skip on input rows; self-edge classified as one-node cycle (a, a) before any color tracking."
  - "D-06 honored: Adjacency exposes both successors and predecessors mappings pre-computed at load time, with successors_of/predecessors_of returning empty frozenset for unknown ids."
  - "D-08 honored: zero forbidden imports (rest_framework, django.http, plane.app.views, plane.app.serializers) anywhere under apps/api/plane/app/services/timeline_propagation/, enforced by the lint-grep test."
  - "Rule 1 deviation locked: cross-project classification reads BOTH endpoints' project_id (issue + related_issue), not only the related_issue side as the plan's literal _make_edge skeleton showed. The plan's PROP-16 test scenario (foreign issue / local related_issue) requires both-side checking; the corrected rule is now reflected in the module docstring and a unit test."

patterns-established:
  - "Pure-Python deep module under apps/api/plane/app/services/ — no Django imports beyond what's needed for the input row's structural protocol; the ORM call lives in Phase 3's view."
  - "Both-endpoints cross-project rule via getattr-with-fallback — the loader prefers issue_project_id / related_project_id annotations (Phase 3 may add via .annotate()) and falls back to row.issue.project_id / row.related_issue.project_id."
  - "Phase 1 invariant gates verifiable by grep: D-08 (no DRF/HTTP/views/serializers) + D-02 (no sys.setrecursionlimit) — both are CI-friendly one-liners and the lint-grep test in test_graph.py also enforces D-08."
  - "Inter-plan TDD handoff completed cleanly: RED in plan N (failing test_relates_to_is_dropped from Plan 01-01) → GREEN by plan N+1 Task 1's implementation → expanded coverage in plan N+1 Task 2. Pattern reusable for future deep-module phases."

requirements-completed: [PROP-01, PROP-02, PROP-15, PROP-16, TEST-11]

# Metrics
duration: 5m55s
completed: 2026-05-03
---

# Phase 1 Plan 02: Precedence Graph Loader & Normalization Summary

**Pure-Python `load_precedence_graph(...)` with `blocked_by` filter, predecessor→successor direction translation, both-endpoints cross-project classification, and iterative three-color DFS cycle detection — all 10 validation rows pin PROP/D-NN identifiers green; D-08 lint-grep purity is now enforced by a test.**

## Performance

- **Duration:** 5m55s
- **Started:** 2026-05-03T15:31:33Z
- **Completed:** 2026-05-03T15:37:28Z
- **Tasks:** 2
- **Files created:** 2 (graph.py + deferred-items.md)
- **Files modified:** 1 (test_graph.py extended from 1 test to 10)

## Accomplishments

- `apps/api/plane/app/services/timeline_propagation/graph.py` (210 lines) implements the deep-module loader: filters `relation_type == "blocked_by"` only (PROP-02), defensively skips `deleted_at IS NOT NULL` (D-05), translates each row into `Edge(predecessor_id=related_issue_id, successor_id=issue_id)` (D-04), classifies cross-project edges by reading BOTH endpoints' project_id (PROP-16 strict), and runs iterative three-color DFS with self-edge guard and deterministic sort order (D-02 / D-05 / Pitfall 4).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` extended from the single Plan-01-01 RED test to 10 cases (1 preserved, 9 new). All 10 rows of `01-VALIDATION.md` are now green; PROP-01, PROP-02, PROP-15, PROP-16, TEST-11, D-04, D-05, D-06, D-08 are each pinned by at least one passing test.
- Plan 01-01's RED test (`test_relates_to_is_dropped`) drove GREEN by Task 1's first commit — the inter-plan TDD handoff that Plan 01-01 designed worked end-to-end.
- The D-08 / PROP-18 lint-grep test (`test_no_drf_or_http_imports_in_module`) walks `pathlib.Path.rglob("*.py")` under `apps/api/plane/app/services/timeline_propagation/` and asserts no forbidden imports — locks the deep-module isolation invariant for the future Phase 2 modules (`scheduling.py`, `propagation.py`, `errors.py`).
- Phase 1 invariant gates pass: `! grep -RnE "(rest_framework|django.http|plane.app.views|plane.app.serializers)" apps/api/plane/app/services/timeline_propagation/` exits 0, and `! grep -RnE "sys\.setrecursionlimit" apps/api/plane/app/services/timeline_propagation/` exits 0.
- 11 tests collected, 11 PASSED in `pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x` (~1.2 s end-to-end inside the docker container).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement graph.py — loader + iterative three-color DFS** — `7c8cf118b7` (feat)
2. **Task 2: Extend test_graph.py — 9 additional cases + lint-grep purity (with Rule 1 cross-project bugfix)** — `e0d9d07eef` (test)

**Plan metadata commit:** _to be added in final commit_

_Note: Task 1 is tagged `tdd="true"`. The TDD cycle for Task 1 is RED→GREEN where the RED step lives in Plan 01-01's commit `8252a268c6` (the failing `test_relates_to_is_dropped`); Task 1's commit is the GREEN implementation. Task 2 is tagged `tdd="true"` and is the natural REFACTOR/expansion phase — adding the remaining 9 tests against the now-GREEN implementation, with one Rule 1 deviation surfacing (and being fixed) when the cross-project test exposed a gap in the literal plan skeleton._

## Files Created/Modified

### Created

- `apps/api/plane/app/services/timeline_propagation/graph.py` — 210 lines. Module docstring documents Direction translation (D-04 / Pitfall 1), Filters in order (PROP-02 + D-05), Cross-project classification (PROP-16 / D-03 / Pitfall 2 — both endpoints), Cycle detection (D-02 / D-05), Caller assumptions (D-05), and Module scope (PROP-18 move-only). Functions: `load_precedence_graph` (the public entry point), `_make_edge` (direction + cross-project translation), `_detect_cycle` (iterative three-color DFS). Protocol: `RelationLike` (structural subtype of IssueRelation, lets tests pass plain dataclasses if desired).
- `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md` — Documents 5 pre-existing unit-suite failures in `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, and `utils/test_url.py`. These pre-date Phase 1 (verified by `git stash` + re-run on parent commit `7c8cf118b7`); out of scope per SCOPE BOUNDARY.

### Modified

- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — Extended from 130 lines / 1 test to 397 lines / 10 tests. Module docstring rewritten to declare the Coverage map (Phase 1 / 01-VALIDATION.md). Imports now include `pathlib` (lint-grep test) and `Adjacency` from `.types` (convenience-method test). New fixtures: `other_project`, `other_state` (cross-project test). Existing fixtures (`workspace`, `project`, `state`) and helpers (`_make_issue`, `_make_blocked_by`) preserved byte-for-byte. Existing `test_relates_to_is_dropped` preserved verbatim. Added: `test_duplicate_is_dropped`, `test_blocking_via_get_actual_relation_normalizes_to_one_edge`, `TestLoadPrecedenceGraphDirection`, `TestLoadPrecedenceGraphCycle` (3-node + self-edge), `TestLoadPrecedenceGraphCrossProject`, `TestLoadPrecedenceGraphEmpty` (no DB), `TestLoadPrecedenceGraphAdjacencyShape`, `TestAdjacencyConvenienceMethods` (no DB), `test_no_drf_or_http_imports_in_module` (module-level, no DB).

## Test Inventory (mapped to PROP/TEST/D-NN)

Final test inventory matches `01-VALIDATION.md` rows 41-50:

| #   | Test class / function                 | Method                                                       | Pins                 | DB? |
| --- | ------------------------------------- | ------------------------------------------------------------ | -------------------- | --- |
| 1   | TestLoadPrecedenceGraphFilters        | test_relates_to_is_dropped                                   | PROP-02 / US-17      | yes |
| 2   | TestLoadPrecedenceGraphFilters        | test_duplicate_is_dropped                                    | PROP-02 / US-18      | yes |
| 3   | TestLoadPrecedenceGraphFilters        | test_blocking_via_get_actual_relation_normalizes_to_one_edge | PROP-01 / D-04 alias | yes |
| 4   | TestLoadPrecedenceGraphDirection      | test_predecessor_is_related_issue_successor_is_issue         | D-04 directionality  | yes |
| 5   | TestLoadPrecedenceGraphCycle          | test_three_node_cycle_is_detected                            | PROP-15 / TEST-11    | yes |
| 6   | TestLoadPrecedenceGraphCycle          | test_self_edge_is_one_node_cycle                             | PROP-15 / D-05       | yes |
| 7   | TestLoadPrecedenceGraphCrossProject   | test_cross_project_successor_marked                          | PROP-16 / D-03       | yes |
| 8   | TestLoadPrecedenceGraphAdjacencyShape | test_chain_split_merge_adjacency_contents                    | D-06 symmetry        | yes |
| 9   | TestLoadPrecedenceGraphEmpty          | test_empty_input_yields_empty_adjacency_no_cycle             | regression guard     | no  |
| 10  | TestAdjacencyConvenienceMethods       | test_successors_of_unknown_id_returns_empty_frozenset        | D-06 (no-KeyError)   | no  |
| 11  | (module-level)                        | test_no_drf_or_http_imports_in_module                        | D-08 / PROP-18       | no  |

Total: 11 tests collected, 11 PASSED. (Row count in `01-VALIDATION.md` is 10 — the lint-grep test is row 9 in some renderings; combined the validation map is fully satisfied.)

## Decisions Made

All decisions on the planning side (D-01 through D-10) were locked in CONTEXT.md and applied verbatim except for one corrected rule (see Deviations below). The execution-time decisions:

- (E-1) Apply Rule 1 to fix `_make_edge` cross-project classification when the cross-project test exposed that the plan's literal skeleton (`related_project_id` only) is insufficient for PROP-16's "paths reaching outside the project" semantics. The corrected rule reads BOTH endpoints' project_id; this is the rule the test author already encoded into the cross-project test (foreign Issue on the `issue` side, local Issue on the `related_issue` side). The fix is documented in the module docstring and pinned by the now-GREEN `test_cross_project_successor_marked`.
- (E-2) Document pre-existing unit-suite failures in `deferred-items.md` rather than fix them (SCOPE BOUNDARY). All 5 failures live outside `apps/api/plane/app/services/timeline_propagation/` and were verified to fail on the parent commit `7c8cf118b7` (and on Plan 01-01's tip `c7df9b8d2d`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cross-project classification must read both endpoints, not only `related_issue`**

- **Found during:** Task 2 (running the new `TestLoadPrecedenceGraphCrossProject::test_cross_project_successor_marked` test against Task 1's implementation)
- **Issue:** The plan's Task 1 `_make_edge` skeleton only checked `related_issue.project_id != project_id` for the cross-project flag. The plan also requires (in Task 2's test scenario) that a row whose `issue` (= successor) is in a foreign project AND whose `related_issue` (= predecessor) is in the local project be classified as cross-project. With the plan's literal skeleton, that edge would (incorrectly) enter `successors`/`predecessors` and `nodes`. The test correctly pinned the intended PROP-16 semantics ("paths reaching outside the project fail propagation"); the implementation needed to match. The Pitfall 2 invariant (never use `row.project_id` for cross-project classification) was preserved — the fix reads `row.issue.project_id` (with `issue_project_id` annotation preferred), not `row.project_id`.
- **Fix:** Extended `_make_edge` to read both endpoints' `project_id`, preferring `issue_project_id` / `related_project_id` annotations (allowing Phase 3 to `.annotate()` them on the queryset) and falling back to `row.issue.project_id` / `row.related_issue.project_id`. The cross-project flag is now `(issue_project_id != project_id) or (related_project_id != project_id)`. Module docstring updated to document the corrected rule.
- **Files modified:** `apps/api/plane/app/services/timeline_propagation/graph.py` (function `_make_edge`, module docstring)
- **Verification:** `TestLoadPrecedenceGraphCrossProject::test_cross_project_successor_marked` passes; the same-project tests (TestLoadPrecedenceGraphAdjacencyShape, TestLoadPrecedenceGraphDirection, TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected) all still pass — the corrected rule is a strict superset, never producing false-positive cross-project flags for same-project edges.
- **Committed in:** `e0d9d07eef` (Task 2 commit, alongside the test additions that surfaced the gap)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** No scope creep. The fix is a strict-correctness adjustment that keeps PROP-16's semantics ("paths reaching outside the project fail propagation") true regardless of which side of the IssueRelation row the foreign Issue lives on. Phase 2's PROP-16 enforcement remains independent of this loader-level classification — Phase 2 still walks reachability from the moved Work Item; this loader only ensures the precedence subgraph it hands to Phase 2 contains no cross-project leaks in either direction.

## Issues Encountered

- **Pre-existing unit-suite failures in unrelated files** (5 tests in `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py`). Verified to fail on the parent commit `7c8cf118b7` AND on Plan 01-01's tip `c7df9b8d2d`. Not caused by Plan 01-02 changes; documented in `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md` per SCOPE BOUNDARY rule. The Phase 1 verification gate that mattered — every test in `plane/tests/unit/services/timeline_propagation/test_graph.py` passes green — is satisfied (11/11).

## Verification Results

Final plan verification block (from PLAN.md `<verification>`):

| #   | Check                                                                                                                               | Result                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | All 10 validation rows GREEN                                                                                                        | 11 collected, 11 PASSED in 1.17s                                                                                         |
| 2   | D-08 lint-grep invariant — no DRF/HTTP/views/serializers imports anywhere under `apps/api/plane/app/services/timeline_propagation/` | exit 0 (clean)                                                                                                           |
| 3   | D-02 iterative-only invariant — no `sys.setrecursionlimit` anywhere in the package                                                  | exit 0 (clean)                                                                                                           |
| 4   | Full unit suite regression (`python run_tests.py -u`)                                                                               | 107 passed; 5 pre-existing unrelated failures documented in deferred-items.md (no new failures introduced by Plan 01-02) |

Per-task acceptance criteria verification:

- Task 1: `graph.py` exists with all required functions (`load_precedence_graph`, `_detect_cycle`, `_make_edge`); the verbatim Pitfall 1 directionality comment ("predecessor=Y, successor=X") is present; no forbidden imports; no recursion-limit hacks; no `from __future__ import annotations`; deterministic iteration via `iter(sorted(adj.successors_of(...)))` and `for root in sorted(adj.nodes)`; D-05 self-edge guard `if child == node:`; Pitfall 2 mitigation via `related_project_id` annotation lookup; Plan 01-01's RED test (`test_relates_to_is_dropped`) is now GREEN. ✓
- Task 2: All 7 NEW test classes/functions exist; the 2 NEW methods on `TestLoadPrecedenceGraphFilters` exist; `@pytest.mark.unit` count = 9 (≥ 8 required); `@pytest.mark.django_db` count = 9 (≥ 7 required); no DRF/HTTP/views/serializers imports in test file; `Adjacency` import from `.types` present; coverage-map docstring present; `pytest test_graph.py -x` exits 0 (11/11); per-test PROP/TEST verification: `TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected` ✓, `TestLoadPrecedenceGraphCrossProject::test_cross_project_successor_marked` ✓, `test_no_drf_or_http_imports_in_module` ✓. ✓

## Threat Flags

None. The Plan 01-02 threat register (T-01-02-01..T-01-02-04) is fully mitigated:

- **T-01-02-01 DoS via cycle path** — mitigated. Iterative three-color DFS is O(V+E); no recursion; no `sys.setrecursionlimit`. Verified by the iterative-only invariant grep.
- **T-01-02-02 Information disclosure via foreign-project endpoint dereference** — mitigated. `_make_edge` reads only `project_id` from each endpoint (via `issue_project_id` / `related_project_id` annotations or `row.issue.project_id` / `row.related_issue.project_id` fallback). Never reads name, description, start_date, target_date, or any other field. Cross-project edges never enter `successors` / `predecessors` / `nodes`. Pinned by `test_cross_project_successor_marked` (asserts `result.adjacency.nodes == frozenset()` for the cross-project-only scenario).
- **T-01-02-03 Tampering via forbidden DRF/HTTP imports** — mitigated. The `test_no_drf_or_http_imports_in_module` lint-grep test scans every `.py` under `apps/api/plane/app/services/timeline_propagation/` and asserts none contain `rest_framework`, `django.http`, `plane.app.views`, or `plane.app.serializers`. Pinned for all current and future package files.
- **T-01-02-04 DoS via self-edge infinite loop** — mitigated. `_detect_cycle` checks `if child == node` BEFORE color tracking and returns `(node, node)` immediately. Pinned by `test_self_edge_is_one_node_cycle`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 1 is complete; Phase 2 (Scheduling Helper & Propagation Algorithm Core) is unblocked.**

Cross-phase contracts locked by this plan (Phase 2 / Phase 3 must consume verbatim):

- `WorkItemNode(id: UUID, project_id: UUID)` — node identity
- `Edge(predecessor_id: UUID, successor_id: UUID, source_relation_id: UUID, cross_project: bool)` — typed edge
- `Adjacency(successors, predecessors, nodes, cross_project_edges)` with `successors_of(node_id) -> frozenset[UUID]` and `predecessors_of(node_id) -> frozenset[UUID]` returning empty for unknown ids
- `LoadResult(adjacency: Adjacency, cycle: tuple[UUID, ...] | None)` — cycle is closed-path tuple on first back-edge or None for a DAG
- Public symbols re-exported from `apps/api/plane/app/services/timeline_propagation/__init__.py`: `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph`
- Behavioral invariants pinned by 11 unit tests:
  - `relation_type='blocked_by'` only; `relates_to`/`duplicate`/etc dropped (PROP-02)
  - `Edge(predecessor=related_issue_id, successor=issue_id)` direction (D-04)
  - Both-endpoints cross-project flag (PROP-16 / D-03 strict)
  - Iterative three-color DFS with self-edge guard (D-02 / D-05)
  - No DRF/HTTP/views/serializers imports anywhere in the package (D-08)
  - `Adjacency.successors_of(unknown) == frozenset()` (D-06 no-KeyError)

Phase 2 plan-phase guidance:

1. Phase 2 may **add** modules under `apps/api/plane/app/services/timeline_propagation/` (`scheduling.py`, `propagation.py`, `errors.py`); they will inherit the D-08 lint-grep invariant automatically because the test scans all `.py` under the package.
2. Phase 2 introduces `ScheduledWorkItem(id, start_date, target_date, updated_at)` and `MoveIntent` types — keep them frozen+slots dataclasses to match the convention established by `types.py`.
3. Phase 2's `propagate_move(...)` consumes `LoadResult.adjacency` directly: walks `successors_of(...)` for rightward moves, `predecessors_of(...)` for leftward moves, fails fast when `result.cycle is not None` with `DEPENDENCY_CYCLE`, and consults `cross_project_edges` reachability for `PROJECT_BOUNDARY_EXCEEDED`.
4. Phase 3 owns the queryset construction and DI: `IssueRelation.objects.filter(project=project, deleted_at__isnull=True).select_related("issue", "related_issue")` (or `.annotate(issue_project_id=..., related_project_id=...)` for fewer joins), pre-filter archived/draft endpoints, then call the loader.

## Self-Check: PASSED

All claimed files exist on disk:

- `apps/api/plane/app/services/timeline_propagation/graph.py` — FOUND
- `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — FOUND
- `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md` — FOUND
- `.planning/phases/01-precedence-graph-loader-normalization/01-02-SUMMARY.md` — FOUND (this file)

Both task commit hashes reachable from `git log --oneline --all`:

- `7c8cf118b7` (Task 1: feat) — FOUND
- `e0d9d07eef` (Task 2: test + Rule 1 fix) — FOUND

---

_Phase: 01-precedence-graph-loader-normalization_
_Completed: 2026-05-03_
