# Phase 2: Date-Range Scheduling Helper & Propagation Algorithm Core - Research

**Researched:** 2026-05-04
**Domain:** Pure-Python date-range propagation algorithm over Phase 1's precedence graph — backend deep module, no DRF / no HTTP / no ORM writes / no `transaction.atomic`.
**Confidence:** HIGH

> Phase 2's 14 implementation decisions (D-01..D-14) are LOCKED in `02-CONTEXT.md`. This research illuminates the implementation path against those decisions; it does NOT relitigate any of them. Where a finding contradicts a locked decision it MUST be surfaced as `## OPEN QUESTION` — none surfaced.

---

## Phase Overview

Phase 2 delivers the canonical example of the project's deep-module-first directive: a pure-Python `propagate_move(graph, work_items_by_id, move_intent, expected_versions) -> PropagationResult` function that owns every non-trivial decision in dependency schedule propagation — duration preservation, Precedence Boundary check, minimum-movement calculation, BFS frontier walk in either direction with split/merge support, gap preservation, 100-item limit, and seven typed failure outcomes — while consuming Phase 1's `LoadResult` and an in-memory `Mapping[UUID, ScheduledWorkItem]`. The algorithm has zero coupling to Django views/DRF/HTTP/ORM-writes/`transaction.atomic`, isolates ALL date arithmetic in a single `scheduling.py` swap-seam (so ADR 0002's Working Calendar follow-up replaces one function module without touching `propagation.py`), and is exercised exclusively by `@pytest.mark.unit` tests with hand-built in-memory fixtures (no `@django_db`). The 11 PRD-pinned algorithmic test cases (TEST-01..TEST-09, TEST-12, TEST-14) are the acceptance contract.

**Primary recommendation:** Write the four files in strict TDD-order — `errors.py` → `types.py` (additions) → `scheduling.py` → `propagation.py` — and grow `propagation.py` one labeled TEST-NN case at a time, starting from the simplest no-violation case (TEST-01) and ending with the failure cases (TEST-09, TEST-12, TEST-14). Every algorithm change MUST be driven by a failing test first.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

> The 14 locked decisions below are verbatim from `02-CONTEXT.md`. The planner MUST honor every decision; alternatives have already been rejected.

### Locked Decisions

**D-01 (Algorithm shape):** Single-direction BFS frontier walk parameterized by `delta = requested_start_date - original_start_date`:

- `delta > 0` (rightward) → walk forward through `Adjacency.successors`.
- `delta < 0` (leftward) → walk backward through `Adjacency.predecessors`.
- `delta == 0` → return success with one update (the dragged item, idempotent), zero traversal.
  For each visited node, compute the minimum shift required to restore adjacency against already-shifted parent(s). Push neighbors onto the frontier ONLY when the visited node's own dates change (frontier-stop semantics preserve PROP-07 untouched gaps). Rejected alternatives: full topological recompute, arrival-time DP.

**D-02 (Adjacency math / Precedence Boundary):**

- Valid edge condition (PRD line 82, US-12, PROP-10): `succ.start_date >= pred.target_date + 1 day`. `succ.start == pred.target + 1` is the canonical adjacent case and is VALID, not a violation.
- Forward (rightward) shift at successor `s` with predecessors `P_visited` (only predecessors already updated by this walk): `required_start = max(p.target_date + 1 for p in P_visited)`; `new_start = max(s.start_date, required_start)`; `shift = new_start - s.start_date`. If `shift == 0` → frontier-stop. Else `s.target_date += shift` (PROP-09 duration preservation).
- Backward (leftward) shift at predecessor `p` with successors `S_visited`: mirror — `required_target = min(s.start_date - 1 for s in S_visited)`; `new_target = min(p.target_date, required_target)`; `shift = p.target_date - new_target`. If `shift == 0` → frontier-stop. Else `p.start_date -= shift`.
- All arithmetic uses `datetime.timedelta(days=1)`. Calendar-day only (PROP-11). NO weekend/holiday logic in Phase 2.

**D-03 (Date math isolation seam — ADR 0002 swap target):** `scheduling.py` owns the ONLY date arithmetic in this module. Public function signatures:

- `range_duration(start: date, target: date) -> timedelta` — `target - start` (start == target → 0-day duration).
- `add_calendar_days(d: date, n: int) -> date` — `d + timedelta(days=n)`.
- `next_valid_start(after_target: date) -> date` — `after_target + 1 day`.
- `previous_valid_target(before_start: date) -> date` — `before_start - 1 day`.
- `is_valid_range(start: date, target: date) -> bool` — `target >= start`.
- `boundary_violation(predecessor_target: date, successor_start: date) -> bool` — `successor_start < predecessor_target + 1 day`.
  `propagation.py` calls these helpers exclusively; never imports `timedelta` directly. NO Calendar Protocol injected today (YAGNI; the function module IS the seam).

**D-04 (Public types & shapes):** Three new value types in `types.py` (frozen, `slots=True`, identity by id):

- `ScheduledWorkItem(id: UUID, project_id: UUID, start_date: date | None, target_date: date | None, updated_at: datetime)` — mirrors `Issue` model fields; dates may be `None` (PROP-17); `updated_at` always present.
- `MoveIntent(work_item_id: UUID, original_start_date: date, original_target_date: date, requested_start_date: date, requested_target_date: date)` — all five required (dragged item must be complete).
- `WorkItemUpdate(id: UUID, start_date: date, target_date: date, updated_at: datetime)` — `updated_at` is the INPUT value (Phase 3 sets post-write value after `bulk_update`).
  And one `PropagationResult` (Result-pattern):
- `requested_work_item_id: UUID`
- `failure: PropagationFailure | None` — `None` iff success
- `updates: tuple[WorkItemUpdate, ...]` — empty on failure; on success ALWAYS includes the dragged item itself (PROP-03 / TEST-01)
- `total_updated_count: int` — `len(updates)`
- Convenience `is_success: bool` property = `failure is None`

**D-05 (Error codes & failure dataclass):** `errors.py` exposes `PropagationErrorCode` as Python 3.12 `StrEnum` with the 7 canonical wire codes:

- `DEPENDENCY_CYCLE`, `PROJECT_BOUNDARY_EXCEEDED`, `INCOMPLETE_SCHEDULE`, `PROPAGATION_LIMIT_EXCEEDED`, `SCHEDULE_CHANGED`, `PERMISSION_DENIED` (defined here for symmetry; raised only by Phase 3), `INVALID_DATE_RANGE`.
  And `PropagationFailure(code: PropagationErrorCode, message: str, work_item_id: UUID | None = None, cycle: tuple[UUID, ...] | None = None)` — frozen dataclass. The 7 codes are the STABLE CONTRACT (US-22, US-37, API-06).

**D-06 (Validation order — deterministic early returns):** `propagate_move` validates in this fixed order; the FIRST failure short-circuits and returns immediately:

1. `INVALID_DATE_RANGE` — `original_target < original_start` OR `requested_target < requested_start` OR `range_duration(original_*) != range_duration(requested_*)` (PROP-08 enforced inside the deep module).
2. `DEPENDENCY_CYCLE` — `graph.cycle is not None` (D-07: regardless of reachability).
3. `INCOMPLETE_SCHEDULE` (eager, on dragged item only) — dragged item itself missing dates.
4. `SCHEDULE_CHANGED` — `expected_versions[move_intent.work_item_id] != work_items_by_id[work_item_id].updated_at` (D-08: dragged item only).
5. Frontier walk; per visited node lazy checks: `INCOMPLETE_SCHEDULE` (D-09), `PROJECT_BOUNDARY_EXCEEDED` (D-10), `PROPAGATION_LIMIT_EXCEEDED` (D-11).

**D-07 (Cycle pre-check semantics):** Fail fast on `LoadResult.cycle is not None` regardless of reachability from the moved item. Reason: ADR 0001 server authority — a project graph with ANY cycle is structurally invalid for "all-or-nothing schedule propagation." Also keeps the algorithm trivially terminating: once `cycle is None` the same-project subgraph is a DAG and BFS without visited-set guards is sound (the visited set still exists for the limit check — D-11).

**D-08 (Stale schedule check ownership & granularity):** Phase 2 owns `SCHEDULE_CHANGED`. Interface: `expected_versions: Mapping[UUID, datetime]`. ONLY the dragged item's `updated_at` is compared (`expected_versions[move_intent.work_item_id]` must equal `work_items_by_id[work_item_id].updated_at`). Per-touched-item checks are explicitly rejected as overly brittle; per-graph version is overkill. The `Mapping` shape lets Phase 3 extend later without changing the signature.

**D-09 (`INCOMPLETE_SCHEDULE` timing — lazy):** Lazy detection during the walk. Algorithm reads each visited node's `start_date`/`target_date` only when computing a shift. If either is `None` → return `PropagationFailure(code=INCOMPLETE_SCHEDULE, work_item_id=that_node_id)` immediately (all-or-nothing — no partial updates emitted). Special case: dragged item missing dates → handled eagerly in D-06 step 3.

**D-10 (Cross-project failure semantics — reachability-based):** `PROJECT_BOUNDARY_EXCEEDED` fires only when the walk reaches a cross-project edge in the move's direction from a node already in the visited frontier. Build reverse indices `cross_project_out: Mapping[UUID, tuple[Edge, ...]]` (keyed by predecessor for forward walks) and `cross_project_in: Mapping[UUID, tuple[Edge, ...]]` (keyed by successor for backward walks) ONCE at the top of `propagate_move`. PROP-16/US-20 wording is "paths reaching outside the project fail propagation" — implies reachability.

**D-11 (Limit counting & enforcement):** The 100-item limit (PROP-13, US-29) counts DISTINCT affected Work Item ids INCLUDING the dragged item itself (so dragged item = 1 of 100; up to 99 propagated). Lazy enforcement: maintain `affected: set[UUID] = {dragged_id}` and grow only when nodes are visited WITH NON-ZERO SHIFT. Frontier-stop nodes (zero shift) are NOT counted. Check `if len(affected) > 100: return PROPAGATION_LIMIT_EXCEEDED` IMMEDIATELY after each insertion. Failure carries `work_item_id=None` (graph-level outcome). The algorithm does NOT enumerate the would-be-affected list past 100.

**D-12 (Public surface):** Single free function exported from `__init__.py`:

```python
def propagate_move(
    graph: LoadResult,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    move_intent: MoveIntent,
    expected_versions: Mapping[UUID, datetime],
) -> PropagationResult: ...
```

NO `Propagator` class. NO DI hooks. NO clock parameter (deterministic from inputs). Re-exports added to `__init__.py`: `propagate_move`, `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`, `PropagationFailure`, `PropagationErrorCode`. Phase 1 exports unchanged.

**D-13 (Test fixture style):** Pure in-memory fixtures — hand-built `Adjacency`, `LoadResult`, `ScheduledWorkItem` dicts, `MoveIntent` literals. NO `@pytest.mark.django_db`, NO `factory_boy`, NO DB roundtrip. Marker: `@pytest.mark.unit` only. Run: `cd apps/api && python run_tests.py -u`. One test per labeled PRD case (TEST-01..TEST-09, TEST-12, TEST-14) plus auxiliary cases for validation-order short-circuits, no-op move (delta=0), single-edge forward/backward, dragged-item-missing-dates, expected_versions missing the dragged id, limit-exceeded fires at exactly 101.

**D-14 (Lint-grep purity invariant — carried from Phase 1 D-08):** No `from rest_framework`, no `from django.http`, no `from django.db.models import`, no `transaction.atomic`, no `model_activity.delay(...)`, no `Issue.objects` writes anywhere in `errors.py`, `scheduling.py`, `propagation.py`. Extend or sibling-replicate the existing Phase 1 lint-grep test (`test_graph.py::test_no_drf_or_http_imports_in_module`) so it covers the new files.

### Claude's Discretion (auto-mode pre-resolved; flag for plan-phase confirmation)

- Field name `PropagationResult.failure` (vs `error`/`outcome`) — chose `failure` to mirror `PropagationFailure` and make `result.failure is None` self-documenting.
- `WorkItemUpdate.updated_at` carries the INPUT value (clock-free Phase 2; Phase 3 maps to post-write value when assembling the response).
- NO `dry_run` mode (FE-02: frontend preview is loaded-graph only; the call IS the commit).
- Re-export `scheduling.py` helpers from `__init__.py` so `test_scheduling.py` doesn't depth-import; revisit if any helper grows past one-line wrapper.

### Deferred Ideas (OUT OF SCOPE — researcher MUST NOT explore)

- Working Calendar protocol seam (ADR 0002 follow-up).
- Per-touched-item `updated_at` checks ("strict mode").
- `dry_run`/server-side preview.
- Cycle path enrichment (status, title, assignee).
- `PROPAGATION_LIMIT_EXCEEDED` carrying truncated affected list.
- Graph caching / incremental updates / memoization.
- Audit logging of propagation outcomes.
- Enforcing PROP-08 on `MoveIntent.__post_init__` (kept inside algorithm so failure surfaces as `INVALID_DATE_RANGE`).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID          | Description (verbatim from REQUIREMENTS.md)                                                                                         | Research Support                                                                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROP-03** | 移動した Work Item が既存の Precedence Boundary を 1 つも違反しない場合、その Work Item だけが更新される (US-2, US-5, US-10, US-11) | Algorithmic Pseudocode §"step 5" — frontier-stop on the dragged item happens after step 5; the result always carries one `WorkItemUpdate` for the dragged item per D-04. Pinned by TEST-01.                                                                      |
| **PROP-04** | rightward の move が successor の Precedence Boundary を違反したとき、影響する successor だけを最小量で前進させる (US-4, US-10)     | D-01 forward branch + D-02 forward shift formula. Pinned by TEST-02 (single successor) and TEST-04 (transitive chain).                                                                                                                                           |
| **PROP-05** | leftward の move が predecessor の Precedence Boundary を違反したとき、影響する predecessor だけを最小量で後退させる (US-3, US-11)  | D-01 backward branch + D-02 backward shift formula. Pinned by TEST-03.                                                                                                                                                                                           |
| **PROP-06** | 伝播は connected precedence path を遷移的に辿り、すべての影響枝を考慮する (chain / split / merge) (US-7, US-8, US-9)                | D-01 BFS frontier with neighbor expansion only on non-zero shift. Pinned by TEST-04 (chain), TEST-05 (split), TEST-06 (merge).                                                                                                                                   |
| **PROP-07** | 既存の schedule gap は、Precedence Boundary 違反を起こさない限り保存される (圧縮しない) (US-6)                                      | D-01 frontier-stop semantics: `new_start = max(s.start_date, required_start)`; gaps preserved by `max`. Pinned by TEST-07.                                                                                                                                       |
| **PROP-08** | 移動した Work Item の date-range duration (`target_date - start_date`) は保存される (US-13)                                         | D-06 step 1: `range_duration(original_*) != range_duration(requested_*)` → `INVALID_DATE_RANGE`. Pinned by TEST-14.                                                                                                                                              |
| **PROP-09** | 伝播される Work Item の date-range duration も保存される (US-14)                                                                    | D-02: per-node `target_date += shift` (forward) and `start_date -= shift` (backward) — duration is invariant under additive shift. Pinned by TEST-04 (chain assertions check each node's duration).                                                              |
| **PROP-10** | 後続の `start_date` が直前先行の `target_date + 1 calendar day` に等しい (adjacency) 場合は valid とみなす (US-12)                  | D-02: `boundary_violation` is `succ.start < pred.target + 1` (strict less-than). Pinned by TEST-08 (exact adjacency).                                                                                                                                            |
| **PROP-11** | 伝播は calendar-day date math で計算する (weekend/holiday は考慮しない)                                                             | D-03: `add_calendar_days(d, n) = d + timedelta(days=n)`. NO Working Calendar in Phase 2. Pinned implicitly by every TEST-NN passing dates that span weekends.                                                                                                    |
| **PROP-12** | 伝播は all-or-nothing で適用される (US-21)                                                                                          | D-09 lazy `INCOMPLETE_SCHEDULE`, D-10 reachability `PROJECT_BOUNDARY_EXCEEDED`, D-11 lazy limit — every failure path returns `updates=()` per D-04. Pinned by TEST-09, TEST-12 (assert `updates == ()` on failure).                                              |
| **PROP-13** | 伝播される Work Item 数の上限は 100。超過時は `PROPAGATION_LIMIT_EXCEEDED` で fail (US-29)                                          | D-11 dragged item = 1 of 100; lazy check after each insertion. Pinned by TEST-12 + auxiliary cases (`test_limit_exactly_at_100_succeeds`, `test_limit_at_101_fails`).                                                                                            |
| **PROP-14** | 伝播ロジックは独立した service module として実装される (US-33)                                                                      | D-12 free-function public surface; D-14 lint-grep purity invariant. Pinned by extended `test_no_drf_or_http_imports_in_module` covering the three new files.                                                                                                     |
| **PROP-17** | 伝播対象に `start_date` または `target_date` を欠く Work Item があれば伝播を停止し `INCOMPLETE_SCHEDULE` で fail (US-19)            | D-09 lazy detection during walk; D-06 step 3 eager check on dragged item. Pinned by TEST-09.                                                                                                                                                                     |
| **TEST-01** | backend service unit test: no-violation move (動かしたものだけ更新)                                                                 | TEST-01 maps to `test_no_violation_move_updates_only_dragged_item` — graph with one successor far in the future, drag the predecessor by a small delta that doesn't violate adjacency, assert `len(updates) == 1` and `updates[0].id == dragged_id`.             |
| **TEST-02** | backend service unit test: rightward propagation to one successor                                                                   | `test_rightward_move_propagates_to_one_successor` — predecessor and successor adjacent; drag predecessor right by 3 days; assert successor.start_date moves by 3 days, target_date moves by 3 days (duration preserved).                                         |
| **TEST-03** | backend service unit test: leftward propagation to one predecessor                                                                  | `test_leftward_move_propagates_to_one_predecessor` — symmetric mirror of TEST-02 using backward walk.                                                                                                                                                            |
| **TEST-04** | backend service unit test: transitive chain                                                                                         | `test_transitive_chain_rightward` — A→B→C all adjacent; drag A by 5 days; assert all three update by 5 days.                                                                                                                                                     |
| **TEST-05** | backend service unit test: split successor branches                                                                                 | `test_split_successor_branches` — A→B and A→C; drag A right; assert B and C both update.                                                                                                                                                                         |
| **TEST-06** | backend service unit test: merge predecessor branches                                                                               | `test_merge_predecessor_branches` — A→C and B→C; drag A right past B's end; assert C moves by max of (A→C shift, B→C shift) — D-02 `required_start = max(...)`.                                                                                                  |
| **TEST-07** | backend service unit test: gap preservation                                                                                         | `test_gap_preservation` — A→B with 10-day gap; drag A right by 3 days (still leaves 7-day gap); assert B is NOT in updates (frontier-stop).                                                                                                                      |
| **TEST-08** | backend service unit test: exact boundary adjacency                                                                                 | `test_exact_adjacency_is_valid` — A→B with B.start == A.target + 1; drag A right by 0 (no-op) or A's target stays the same; assert no violation reported.                                                                                                        |
| **TEST-09** | backend service unit test: incomplete scheduled work item → `INCOMPLETE_SCHEDULE`                                                   | `test_incomplete_successor_returns_incomplete_schedule` — A→B; B.target_date is None; drag A right; assert `failure.code == INCOMPLETE_SCHEDULE`, `failure.work_item_id == B.id`, `updates == ()`.                                                               |
| **TEST-12** | backend service unit test: 100 work item limit → `PROPAGATION_LIMIT_EXCEEDED`                                                       | `test_propagation_exceeds_100_returns_limit_exceeded` — chain of 101 nodes all needing shift; assert `failure.code == PROPAGATION_LIMIT_EXCEEDED`, `failure.work_item_id is None`. Plus auxiliary `test_limit_exactly_at_100_succeeds`.                          |
| **TEST-14** | backend service unit test: invalid date range → `INVALID_DATE_RANGE`                                                                | `test_requested_target_before_start_returns_invalid` — `MoveIntent(requested_start=2026-05-10, requested_target=2026-05-05)`; assert `failure.code == INVALID_DATE_RANGE`. Plus `test_duration_change_returns_invalid` — original duration ≠ requested duration. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Toolchain:** Python 3.12.10 (Docker base `python:3.12.10-alpine`); pyproject at `apps/api/pyproject.toml`. `apps/api` is excluded from the pnpm workspace.
- **Test runner:** `cd apps/api && python run_tests.py -u` (NOT `run_tests.sh` — delegates to a missing path). Direct: `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_propagation.py plane/tests/unit/services/timeline_propagation/test_scheduling.py`.
- **Pytest defaults (from `apps/api/pytest.ini`):** `--reuse-db --nomigrations -vs --strict-markers`. Markers `unit`, `contract`, `smoke`, `slow` declared. Phase 2 stays inside `unit`.
- **Lint:** `ruff` line-length 120, double quotes, `E + F` rules, `mccabe.max-complexity = 10`, `pylint.max-args = 8`, `pylint.max-statements = 50`. Tests have `E402, F401, F811` ignored. `__init__.py` has `F401` ignored (so re-export-only `__init__.py` is idiomatic).
- **CI:** Pytest is NOT in CI — must run locally. Pre-commit lint-staged runs `oxfmt` + `oxlint` on TS/JSON/MD; Python files lint-checked via `ruff` (`.github/workflows/pull-request-build-lint-api.yml`).
- **Coverage:** `python run_tests.py --coverage` enforces `--fail-under=90`. Phase 2's three new files should be ~100% covered by unit tests (pure-Python, deterministic, no I/O).

---

## Architectural Responsibility Map

| Capability                                                          | Primary Tier                    | Secondary Tier | Rationale                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validate `MoveIntent` shape (PROP-08 duration, valid range)         | API / Backend (service module)  | —              | D-06 step 1; happens before any traversal so the failure is `INVALID_DATE_RANGE`. Phase 3 serializer can also validate at HTTP boundary, but the algorithm refuses to propagate at a different duration even if the serializer is bypassed. |
| Decide direction of walk from `delta` sign                          | API / Backend (service module)  | —              | D-01; pure data — `requested - original`.                                                                                                                                                                                                   |
| Compute minimum per-node shift to restore adjacency                 | API / Backend (service module)  | —              | D-02 forward / backward formulas; pure date arithmetic via `scheduling.py` helpers.                                                                                                                                                         |
| Calendar-day date arithmetic                                        | API / Backend (`scheduling.py`) | —              | D-03 single seam — ADR 0002 swap target. `propagation.py` MUST NOT import `timedelta` directly.                                                                                                                                             |
| Frontier walk with split/merge handling                             | API / Backend (service module)  | —              | D-01 BFS with `affected: set[UUID]`; per-node neighbor expansion only on non-zero shift.                                                                                                                                                    |
| 100-item limit enforcement                                          | API / Backend (service module)  | —              | D-11 lazy check after each `affected.add(...)`.                                                                                                                                                                                             |
| Cross-project reachability check                                    | API / Backend (service module)  | —              | D-10 reverse indices built once at the top of `propagate_move`; per-visit lookup.                                                                                                                                                           |
| `INCOMPLETE_SCHEDULE` on visited node                               | API / Backend (service module)  | —              | D-09 lazy: only when the algorithm reads dates to compute a shift.                                                                                                                                                                          |
| Stale `updated_at` comparison on dragged item                       | API / Backend (service module)  | —              | D-08 dragged-item-only; algorithm owns the `expected_versions` mapping read. Phase 3 contract test pins the HTTP-level path.                                                                                                                |
| Cycle pre-check (translate `LoadResult.cycle` → `DEPENDENCY_CYCLE`) | API / Backend (service module)  | —              | D-07 fail-fast regardless of reachability.                                                                                                                                                                                                  |
| All-or-nothing result emission                                      | API / Backend (service module)  | —              | D-04 `updates=()` on failure; D-12 free function public surface.                                                                                                                                                                            |
| ORM read of `IssueRelation` rows / `Issue` work items               | API / Backend (Phase 3 view)    | —              | Deferred to Phase 3. Phase 2 consumes pre-materialized `LoadResult` and `Mapping[UUID, ScheduledWorkItem]`.                                                                                                                                 |
| `transaction.atomic` + `Issue.objects.bulk_update`                  | API / Backend (Phase 3 view)    | —              | Deferred to Phase 3. D-14 forbids these in Phase 2 files.                                                                                                                                                                                   |
| HTTP request/response serialization                                 | API / Backend (Phase 3 view)    | —              | Deferred to Phase 3.                                                                                                                                                                                                                        |

**Why this matters:** Phase 2's discipline is "every concern that can be answered with pure-Python data should be." The algorithm produces a `PropagationResult` that Phase 3 inspects and persists; Phase 2 doesn't know HTTP exists.

---

## Implementation Path (Test-First Order)

The 11 PRD-pinned tests grow the production code in waves. Each wave's RED test pins the smallest API addition; the GREEN minimum implementation is listed inline.

### Wave 0: scaffolding (no production code, only failing test scaffolds)

**Files:**

- `apps/api/plane/app/services/timeline_propagation/errors.py` — empty module + module docstring (D-14 purity).
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — empty module + module docstring (D-03 swap-seam declaration).
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — empty module + module docstring.
- `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — first failing test for `range_duration`.
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — first failing test for `propagate_move(...)` import.
- Extend `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module` — already walks `pkg_root.rglob("*.py")` (graph.py:417-435) so the new files are picked up automatically; only assert that the test STILL passes after each new file is added (no test code change required — the existing rglob covers `errors.py`, `scheduling.py`, `propagation.py` as soon as they exist).

### Wave 1: `errors.py` — `PropagationErrorCode` + `PropagationFailure` (D-05)

**RED test:** `test_propagation.py::test_propagation_error_code_has_seven_canonical_values`

```python
from plane.app.services.timeline_propagation import PropagationErrorCode
assert {c.value for c in PropagationErrorCode} == {
    "DEPENDENCY_CYCLE", "PROJECT_BOUNDARY_EXCEEDED", "INCOMPLETE_SCHEDULE",
    "PROPAGATION_LIMIT_EXCEEDED", "SCHEDULE_CHANGED", "PERMISSION_DENIED",
    "INVALID_DATE_RANGE",
}
```

**GREEN minimum:** Add `StrEnum` subclass to `errors.py`; add `PropagationFailure` frozen dataclass; re-export both from `__init__.py`.

### Wave 2: `types.py` additions (D-04) — `ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`

**RED test:** `test_propagation.py::test_propagation_result_carries_dragged_item_on_success` — construct a `PropagationResult` literal and assert field shapes.

**GREEN minimum:** Append four frozen-dataclass definitions to `types.py` (NEVER reshape Phase 1's `WorkItemNode`/`Edge`/`Adjacency`/`LoadResult`); re-export from `__init__.py`.

### Wave 3: `scheduling.py` helpers (D-03)

**RED tests:** `test_scheduling.py` — one test per helper:

- `test_range_duration_zero_when_start_equals_target`
- `test_range_duration_one_day_when_target_one_day_after_start`
- `test_add_calendar_days_advances_calendar`
- `test_next_valid_start_is_target_plus_one`
- `test_previous_valid_target_is_start_minus_one`
- `test_is_valid_range_target_equal_start_is_valid`
- `test_boundary_violation_strict_less_than`

**GREEN minimum:** Implement six pure-function helpers using `datetime.timedelta(days=1)`. The seam is established here; `propagation.py` will import from this module exclusively.

### Wave 4: `propagation.py` shell — TEST-01 no-violation (PROP-03)

**RED test:** `test_propagation.py::test_no_violation_move_updates_only_dragged_item` (TEST-01)

- Fixture: empty `Adjacency` (no edges) for the dragged item; one `ScheduledWorkItem` for the dragged item; `MoveIntent` shifts dates by 0 (or any small delta with no neighbors).
- Assert: `result.is_success`, `len(result.updates) == 1`, `updates[0].id == dragged_id`, `updates[0].start_date == requested_start_date`, `updates[0].target_date == requested_target_date`, `total_updated_count == 1`.

**GREEN minimum:** `propagate_move` returns a `PropagationResult` with one `WorkItemUpdate` for the dragged item. No traversal yet. Validation order steps 1-4 from D-06 must be coded in (even if no test exercises them yet — they short-circuit before traversal).

### Wave 5: TEST-02 rightward single + TEST-03 leftward single (PROP-04, PROP-05)

**RED tests:**

- `test_rightward_move_propagates_to_one_successor` (TEST-02)
- `test_leftward_move_propagates_to_one_predecessor` (TEST-03)

**GREEN minimum:** Add the BFS forward walk + backward walk branches in `propagate_move`. D-02 shift formulas. Frontier-stop on zero shift. Single neighbor depth — no transitive case yet.

### Wave 6: TEST-04 transitive + TEST-05 split + TEST-06 merge (PROP-06, PROP-09)

**RED tests:**

- `test_transitive_chain_rightward` (TEST-04)
- `test_split_successor_branches` (TEST-05)
- `test_merge_predecessor_branches` (TEST-06)

**GREEN minimum:** Generalize the BFS to a queue-driven loop that re-pushes neighbors on every non-zero-shift visit; track `affected: set[UUID]` to dedupe across multiple paths into the same node (Pitfall 4). For merge cases, ensure the `required_start = max(p.target + 1 for p in P_visited)` formula reads ALREADY-VISITED predecessors only (Pitfall 5).

### Wave 7: TEST-07 gap preservation + TEST-08 exact adjacency (PROP-07, PROP-10)

**RED tests:**

- `test_gap_preservation` (TEST-07)
- `test_exact_adjacency_is_valid` (TEST-08)

**GREEN minimum:** No new code if Wave 6 implemented `new_start = max(s.start_date, required_start)` correctly — these tests verify the boundary condition is `<` not `<=` (Pitfall 1). If RED, fix the off-by-one.

### Wave 8: TEST-09 incomplete schedule (PROP-17)

**RED test:** `test_incomplete_successor_returns_incomplete_schedule` (TEST-09) + `test_incomplete_dragged_item_returns_incomplete_schedule_eager`

**GREEN minimum:** D-09 lazy check inside the walk loop: when reading `s.start_date` or `pred.target_date`, if `None` → return `PropagationFailure(code=INCOMPLETE_SCHEDULE, work_item_id=node_id)` with `updates=()`. D-06 step 3 eager check at top of `propagate_move`.

### Wave 9: TEST-12 limit (PROP-13)

**RED tests:**

- `test_propagation_exceeds_100_returns_limit_exceeded` (TEST-12)
- `test_limit_exactly_at_100_succeeds`
- `test_limit_at_101_fails`

**GREEN minimum:** D-11 lazy check immediately after each `affected.add(visited_id)` — `if len(affected) > 100: return PropagationFailure(code=PROPAGATION_LIMIT_EXCEEDED, work_item_id=None, ...)`. Verify Pitfall 8 (eager, not after full enumeration).

### Wave 10: TEST-14 invalid range (PROP-08)

**RED tests:**

- `test_requested_target_before_start_returns_invalid` (TEST-14)
- `test_duration_change_returns_invalid`
- `test_original_target_before_start_returns_invalid`

**GREEN minimum:** D-06 step 1 — implement at the very top of `propagate_move` using `is_valid_range` and `range_duration` from `scheduling.py`.

### Wave 11: Auxiliary edge cases (close the contract)

**RED tests (no new PRD cases — these pin D-06, D-07, D-08, D-10 behavior):**

- `test_validation_order_invalid_range_beats_cycle` — both invariants violated; assert `INVALID_DATE_RANGE` wins.
- `test_cycle_pre_check_fires_regardless_of_reachability` — graph with cycle on unrelated nodes; drag a leaf; assert `DEPENDENCY_CYCLE` (D-07).
- `test_stale_updated_at_returns_schedule_changed` — `expected_versions[dragged_id] != work_items_by_id[dragged_id].updated_at` (D-08).
- `test_expected_versions_missing_dragged_id_raises_or_fails` — `expected_versions = {}` — confirm contract: this is a programmer error from Phase 3, NOT a typed failure code; recommend `KeyError` (Phase 3 view will always populate this dict). Plan-phase to confirm.
- `test_no_op_move_returns_one_update_no_traversal` — `delta == 0` (D-01).
- `test_cross_project_reachable_successor_fails` (D-10) — graph with `cross_project_edges` reachable from dragged; assert `PROJECT_BOUNDARY_EXCEEDED`.
- `test_cross_project_unreachable_succeeds` (D-10 reachability) — graph with cross-project edges NOT reachable from dragged; assert success.

### Wave 12: Lint-grep purity confirmation (D-14)

**RED test:** Already exists in Phase 1 — `test_graph.py::test_no_drf_or_http_imports_in_module` walks all `*.py` under the package. Just verify it remains GREEN after every Wave above. If it ever goes RED, the offending file imports a forbidden module.

---

## Algorithmic Pseudocode

Full pseudocode for `propagate_move(...)` honoring D-01, D-02, D-06..D-11. Helper signatures from D-03 used verbatim.

```python
# apps/api/plane/app/services/timeline_propagation/propagation.py
from collections.abc import Mapping
from datetime import date, datetime
from uuid import UUID

from .errors import PropagationErrorCode, PropagationFailure
from .scheduling import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)
from .types import (
    Adjacency,
    Edge,
    LoadResult,
    MoveIntent,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemUpdate,
)

LIMIT = 100  # PROP-13 / D-11


def propagate_move(
    graph: LoadResult,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    move_intent: MoveIntent,
    expected_versions: Mapping[UUID, datetime],
) -> PropagationResult:
    dragged_id = move_intent.work_item_id

    # --- D-06 step 1: INVALID_DATE_RANGE (PROP-08, TEST-14) ----------------
    if not is_valid_range(move_intent.original_start_date, move_intent.original_target_date):
        return _fail(dragged_id, PropagationErrorCode.INVALID_DATE_RANGE,
                     work_item_id=dragged_id,
                     message="original date range is invalid")
    if not is_valid_range(move_intent.requested_start_date, move_intent.requested_target_date):
        return _fail(dragged_id, PropagationErrorCode.INVALID_DATE_RANGE,
                     work_item_id=dragged_id,
                     message="requested date range is invalid")
    if (
        range_duration(move_intent.original_start_date, move_intent.original_target_date)
        != range_duration(move_intent.requested_start_date, move_intent.requested_target_date)
    ):
        return _fail(dragged_id, PropagationErrorCode.INVALID_DATE_RANGE,
                     work_item_id=dragged_id,
                     message="duration changed (move-only — resize unsupported)")

    # --- D-06 step 2: DEPENDENCY_CYCLE (D-07 fail-fast) --------------------
    if graph.cycle is not None:
        return _fail(dragged_id, PropagationErrorCode.DEPENDENCY_CYCLE,
                     cycle=graph.cycle,
                     message=f"cycle detected: {' -> '.join(str(n) for n in graph.cycle)}")

    # --- D-06 step 3: INCOMPLETE_SCHEDULE on dragged item ------------------
    dragged = work_items_by_id[dragged_id]  # KeyError → programmer error from Phase 3
    if dragged.start_date is None or dragged.target_date is None:
        return _fail(dragged_id, PropagationErrorCode.INCOMPLETE_SCHEDULE,
                     work_item_id=dragged_id,
                     message="dragged work item is missing start_date or target_date")

    # --- D-06 step 4: SCHEDULE_CHANGED (D-08 dragged-item-only) ------------
    if expected_versions.get(dragged_id) != dragged.updated_at:
        return _fail(dragged_id, PropagationErrorCode.SCHEDULE_CHANGED,
                     work_item_id=dragged_id,
                     message="schedule changed since drag started")

    # --- D-10: build cross-project reverse indices ONCE --------------------
    cross_project_out: dict[UUID, list[Edge]] = {}  # forward: keyed by predecessor
    cross_project_in: dict[UUID, list[Edge]] = {}   # backward: keyed by successor
    for e in graph.adjacency.cross_project_edges:
        cross_project_out.setdefault(e.predecessor_id, []).append(e)
        cross_project_in.setdefault(e.successor_id, []).append(e)

    # --- D-01: compute delta + direction ----------------------------------
    delta = (move_intent.requested_start_date - move_intent.original_start_date).days

    # --- Always emit dragged item update (PROP-03 / TEST-01) --------------
    affected: set[UUID] = {dragged_id}
    new_dates_by_id: dict[UUID, tuple[date, date]] = {
        dragged_id: (move_intent.requested_start_date, move_intent.requested_target_date),
    }

    # --- D-01: delta == 0 → no traversal ----------------------------------
    if delta == 0:
        return _ok(dragged_id, work_items_by_id, new_dates_by_id, affected)

    # --- D-01: choose direction --------------------------------------------
    if delta > 0:
        result = _walk_forward(
            graph.adjacency, work_items_by_id,
            cross_project_out, dragged_id, new_dates_by_id, affected,
        )
    else:  # delta < 0
        result = _walk_backward(
            graph.adjacency, work_items_by_id,
            cross_project_in, dragged_id, new_dates_by_id, affected,
        )
    if isinstance(result, PropagationFailure):
        return PropagationResult(
            requested_work_item_id=dragged_id,
            failure=result,
            updates=(),
            total_updated_count=0,
        )
    return _ok(dragged_id, work_items_by_id, new_dates_by_id, affected)


def _walk_forward(
    adj: Adjacency,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    cross_project_out: Mapping[UUID, list[Edge]],
    dragged_id: UUID,
    new_dates_by_id: dict[UUID, tuple[date, date]],
    affected: set[UUID],
) -> PropagationFailure | None:
    """BFS forward walk from `dragged_id` over `Adjacency.successors`."""
    from collections import deque
    frontier: deque[UUID] = deque([dragged_id])

    while frontier:
        node_id = frontier.popleft()
        node_target = new_dates_by_id[node_id][1]  # use NEW (already-shifted) target

        # D-10: cross-project reachability check at this node
        if node_id in cross_project_out:
            return PropagationFailure(
                code=PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED,
                message="propagation reaches a cross-project edge",
                work_item_id=node_id,
            )

        # Expand to same-project successors (deterministic order — Pitfall 4)
        for succ_id in sorted(adj.successors_of(node_id)):
            succ = work_items_by_id.get(succ_id)
            if succ is None:
                # Defensive: graph claims succ exists but Phase 3's queryset
                # didn't materialize it. Treat as INCOMPLETE_SCHEDULE on the
                # offending node — Phase 3's view is responsible for loading
                # all reachable items.
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"successor {succ_id} not in work_items_by_id",
                    work_item_id=succ_id,
                )

            # D-09 lazy: now we need succ's dates → check
            if succ.start_date is None or succ.target_date is None:
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"successor {succ_id} is missing dates",
                    work_item_id=succ_id,
                )

            # D-02 forward shift: required_start = max(p.target + 1 for p in P_visited)
            # Pitfall 5: only consider predecessors already in `affected`
            # (otherwise an untouched predecessor's old target could falsely
            # constrain succ — but Pitfall 5 is about the OPPOSITE direction:
            # we shouldn't include the OLD target of an already-visited pred
            # whose date we've just updated. Use new_dates_by_id for visited
            # predecessors; ignore unvisited predecessors entirely.)
            visited_pred_targets: list[date] = []
            for pred_id in adj.predecessors_of(succ_id):
                if pred_id in new_dates_by_id:
                    visited_pred_targets.append(new_dates_by_id[pred_id][1])
            if not visited_pred_targets:
                continue  # no path from dragged item via visited preds — should not happen
            required_start = next_valid_start(max(visited_pred_targets))
            new_start = max(succ.start_date, required_start)
            shift_days = (new_start - succ.start_date).days

            if shift_days == 0:
                continue  # frontier-stop (PROP-07 gap preserved)

            # D-02: target += shift (PROP-09 duration preservation)
            new_target = add_calendar_days(succ.target_date, shift_days)

            # D-11: lazy limit check after each insertion
            if succ_id not in affected:
                affected.add(succ_id)
                if len(affected) > LIMIT:
                    return PropagationFailure(
                        code=PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED,
                        message=f"propagation would update more than {LIMIT} work items",
                        work_item_id=None,
                    )
            new_dates_by_id[succ_id] = (new_start, new_target)
            frontier.append(succ_id)

    return None  # success


def _walk_backward(
    adj: Adjacency,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    cross_project_in: Mapping[UUID, list[Edge]],
    dragged_id: UUID,
    new_dates_by_id: dict[UUID, tuple[date, date]],
    affected: set[UUID],
) -> PropagationFailure | None:
    """BFS backward walk — symmetric mirror of _walk_forward."""
    from collections import deque
    frontier: deque[UUID] = deque([dragged_id])

    while frontier:
        node_id = frontier.popleft()
        node_start = new_dates_by_id[node_id][0]  # use NEW start

        if node_id in cross_project_in:
            return PropagationFailure(
                code=PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED,
                message="propagation reaches a cross-project edge",
                work_item_id=node_id,
            )

        for pred_id in sorted(adj.predecessors_of(node_id)):
            pred = work_items_by_id.get(pred_id)
            if pred is None:
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"predecessor {pred_id} not in work_items_by_id",
                    work_item_id=pred_id,
                )
            if pred.start_date is None or pred.target_date is None:
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"predecessor {pred_id} is missing dates",
                    work_item_id=pred_id,
                )

            # D-02 backward shift: required_target = min(s.start - 1 for s in S_visited)
            visited_succ_starts: list[date] = []
            for succ_id in adj.successors_of(pred_id):
                if succ_id in new_dates_by_id:
                    visited_succ_starts.append(new_dates_by_id[succ_id][0])
            if not visited_succ_starts:
                continue
            required_target = previous_valid_target(min(visited_succ_starts))
            new_target = min(pred.target_date, required_target)
            shift_days = (pred.target_date - new_target).days

            if shift_days == 0:
                continue

            new_start = add_calendar_days(pred.start_date, -shift_days)

            if pred_id not in affected:
                affected.add(pred_id)
                if len(affected) > LIMIT:
                    return PropagationFailure(
                        code=PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED,
                        message=f"propagation would update more than {LIMIT} work items",
                        work_item_id=None,
                    )
            new_dates_by_id[pred_id] = (new_start, new_target)
            frontier.append(pred_id)

    return None


def _ok(
    dragged_id: UUID,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    new_dates_by_id: Mapping[UUID, tuple[date, date]],
    affected: set[UUID],
) -> PropagationResult:
    # Deterministic update order: dragged item first, others sorted by id (Pitfall 4)
    updates_list: list[WorkItemUpdate] = []
    dragged_dates = new_dates_by_id[dragged_id]
    updates_list.append(WorkItemUpdate(
        id=dragged_id,
        start_date=dragged_dates[0],
        target_date=dragged_dates[1],
        updated_at=work_items_by_id[dragged_id].updated_at,  # D-04 input value
    ))
    for other_id in sorted(affected - {dragged_id}):
        s, t = new_dates_by_id[other_id]
        updates_list.append(WorkItemUpdate(
            id=other_id,
            start_date=s,
            target_date=t,
            updated_at=work_items_by_id[other_id].updated_at,
        ))
    updates = tuple(updates_list)
    return PropagationResult(
        requested_work_item_id=dragged_id,
        failure=None,
        updates=updates,
        total_updated_count=len(updates),
    )


def _fail(
    dragged_id: UUID,
    code: PropagationErrorCode,
    *,
    message: str,
    work_item_id: UUID | None = None,
    cycle: tuple[UUID, ...] | None = None,
) -> PropagationResult:
    return PropagationResult(
        requested_work_item_id=dragged_id,
        failure=PropagationFailure(
            code=code, message=message, work_item_id=work_item_id, cycle=cycle,
        ),
        updates=(),
        total_updated_count=0,
    )
```

**Notes on the pseudocode:**

1. **`new_dates_by_id`** is the single source of truth for "what dates does this node have RIGHT NOW in the propagation"? When iterating predecessors of a successor (forward walk), we ONLY consider predecessors whose new dates we've already computed (i.e., `pred_id in new_dates_by_id`). This is the correct interpretation of D-02's "P_in_visited": only those reached by this propagation walk. Untouched predecessors are out of scope by construction (forward-walk-from-dragged-item invariant).
2. **Frontier-stop** preserves PROP-07 — if `shift_days == 0`, the node is NOT added to `affected`, NOT added to `new_dates_by_id`, NOT pushed onto the frontier. Its descendants are not walked (the descendants are constrained only via this node's old, unchanged dates).
3. **Cross-project check** happens at node POP (not at neighbor expansion). Reasoning: D-10 says "fires when the walk REACHES a cross-project edge from a node already in the visited frontier" — the dragged item itself counts as visited, so a cross-project edge directly out of the dragged item fires immediately on the first iteration.
4. **`sorted(...)`** on neighbor expansion keeps the test assertions deterministic (Pitfall 4 from Phase 1 carries forward).
5. **`KeyError` on missing `expected_versions[dragged_id]`** — pseudocode uses `.get(dragged_id)` returning `None`, then `None != dragged.updated_at` (a `datetime`) is `True` → returns `SCHEDULE_CHANGED`. This is reasonable behavior (a missing version IS a stale-by-default), but plan-phase should confirm whether this should instead `KeyError` (programmer-error contract). My recommendation: keep the `.get` form so a Phase 3 bug doesn't crash; surface as `SCHEDULE_CHANGED`.
6. **`work_items_by_id.get(node_id)` returning `None` for a graph-known node** — defensive `INCOMPLETE_SCHEDULE`. Phase 3 is responsible for loading all `Issue` rows reachable in the project; if it doesn't, this is the failure surface.

---

## Test Case Map

Each of the 11 PRD-pinned tests below uses the same fixture style: hand-built `Adjacency`, hand-built `Mapping[UUID, ScheduledWorkItem]`, literal `MoveIntent`, single-entry `expected_versions`. No `@django_db`. Marker: `@pytest.mark.unit`.

| TEST-NN               | Input fixture                                                                                                                                                                           | Expected `PropagationResult`                                                                                                                                                                          | Locked decision(s) pinned                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **TEST-01** (PROP-03) | Adjacency: empty (or A→B with B far in future). work_items: dragged A only (or A and B). MoveIntent: shift A by small delta with no boundary impact.                                    | `is_success=True`, `len(updates)==1`, `updates[0].id == A.id`, `updates[0].start_date == requested_start_date`, `total_updated_count==1`.                                                             | D-01 frontier-stop, D-04 dragged-item-always-emitted.                                       |
| **TEST-02** (PROP-04) | Adjacency: A→B (B.start == A.target+1, adjacent). work_items: A, B. MoveIntent: shift A right by 3 days.                                                                                | `is_success=True`, `len(updates)==2`, `updates[0]` = A new dates, `updates[1]` = B with start+3, target+3 (duration preserved).                                                                       | D-01 forward walk, D-02 forward shift, PROP-09 duration.                                    |
| **TEST-03** (PROP-05) | Adjacency: A→B (adjacent). work_items: A, B. MoveIntent: shift B left by 3 days.                                                                                                        | `is_success=True`, `len(updates)==2`, B updated, A's target -= 3, A's start -= 3 (duration preserved).                                                                                                | D-01 backward walk, D-02 backward shift, PROP-09.                                           |
| **TEST-04** (PROP-06) | Adjacency: A→B→C (all adjacent). work_items: A, B, C. MoveIntent: shift A right by 5 days.                                                                                              | `is_success=True`, `len(updates)==3`, all three shifted by exactly 5 days, durations preserved.                                                                                                       | D-01 BFS transitive walk; queue iteration.                                                  |
| **TEST-05** (PROP-06) | Adjacency: A→B and A→C (split, both adjacent to A). work_items: A, B, C. MoveIntent: shift A right by 4 days.                                                                           | `is_success=True`, `len(updates)==3`, B and C both shifted by 4 days.                                                                                                                                 | Split case — neighbor expansion sets `successors_of(A) = {B, C}`.                           |
| **TEST-06** (PROP-06) | Adjacency: A→C and B→C (merge). work_items: A, B, C with A.target == C.start-1 (A-C adjacent), B.target == C.start-1 (B-C adjacent). MoveIntent: shift A right by 7 days.               | `is_success=True`, `len(updates)==2`, only A and C move; C.start = A.target+7+1; B is NOT in updates (B unchanged → frontier-stop on B not reached because we walk forward from A and don't visit B). | D-02 `required_start = max(p.target+1 for p in P_visited)` — only visited preds. Pitfall 5. |
| **TEST-07** (PROP-07) | Adjacency: A→B with B.start == A.target+10 (10-day gap). work_items: A, B. MoveIntent: shift A right by 3 days (still leaves 7-day gap, no violation).                                  | `is_success=True`, `len(updates)==1`, only A updated. B is frontier-stopped.                                                                                                                          | D-01 frontier-stop, D-02 `new_start = max(s.start_date, required_start)` keeps B unchanged. |
| **TEST-08** (PROP-10) | Adjacency: A→B with B.start == A.target + 1 exactly (canonical adjacency). work_items: A, B. MoveIntent: shift A right by 0 (no-op) OR shift A so the new boundary is exactly +1 again. | `is_success=True`, A's new dates emitted, B unchanged (frontier-stop).                                                                                                                                | D-02 strict-less-than: `boundary_violation = succ.start < pred.target+1` — equal is VALID.  |
| **TEST-09** (PROP-17) | Adjacency: A→B. work_items: A complete, B with `target_date=None`. MoveIntent: shift A right by enough to require B to move.                                                            | `is_success=False`, `failure.code == INCOMPLETE_SCHEDULE`, `failure.work_item_id == B.id`, `updates == ()`.                                                                                           | D-09 lazy detection.                                                                        |
| **TEST-12** (PROP-13) | Adjacency: linear chain of 101 nodes A1→A2→...→A101 all adjacent. work_items: 101 entries. MoveIntent: shift A1 right by 1 day (forces all 101 to shift).                               | `is_success=False`, `failure.code == PROPAGATION_LIMIT_EXCEEDED`, `failure.work_item_id is None`, `updates == ()`.                                                                                    | D-11 lazy check after 101st insertion.                                                      |
| **TEST-14** (PROP-08) | Adjacency: empty. work_items: A only. MoveIntent: `requested_target_date < requested_start_date` (e.g., requested_start=2026-05-10, requested_target=2026-05-05).                       | `is_success=False`, `failure.code == INVALID_DATE_RANGE`, `failure.work_item_id == A.id`, `updates == ()`.                                                                                            | D-06 step 1, `is_valid_range`.                                                              |

### Auxiliary tests (not PRD-pinned but pin a locked decision)

| Test name                                               | Pins                 | Notes                                                                                                                                    |
| ------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `test_no_op_move_returns_one_update_no_traversal`       | D-01 delta==0 branch | Shift with `requested == original`. Result: 1 update for dragged, no walk happened.                                                      |
| `test_validation_order_invalid_range_beats_cycle`       | D-06 fixed order     | Both invariants violated; assert `INVALID_DATE_RANGE` wins.                                                                              |
| `test_cycle_pre_check_fires_regardless_of_reachability` | D-07                 | Graph cycle on disconnected component; drag a leaf in the DAG part; assert `DEPENDENCY_CYCLE`.                                           |
| `test_stale_updated_at_returns_schedule_changed`        | D-08                 | `expected_versions[dragged_id] = old_datetime`; dragged.updated_at = newer; assert `SCHEDULE_CHANGED`.                                   |
| `test_expected_versions_only_compares_dragged_item`     | D-08                 | Successor's `updated_at` differs from any expected value; should NOT trigger SCHEDULE_CHANGED (Phase 2 doesn't even read it).            |
| `test_cross_project_reachable_successor_fails`          | D-10                 | `cross_project_edges = (Edge(predecessor=A, successor=foreign, cross_project=True),)`; drag A right; assert `PROJECT_BOUNDARY_EXCEEDED`. |
| `test_cross_project_unreachable_succeeds`               | D-10 reachability    | `cross_project_edges` exist but NOT from A's reachable subgraph; drag A; assert success.                                                 |
| `test_limit_exactly_at_100_succeeds`                    | D-11 boundary        | Chain of 100 nodes all needing shift; `len(affected) == 100`; assert success.                                                            |
| `test_limit_at_101_fails`                               | D-11 boundary        | Chain of 101; assert `PROPAGATION_LIMIT_EXCEEDED`.                                                                                       |
| `test_failure_emits_empty_updates_tuple`                | D-04                 | All-or-nothing: every failure path returns `updates == ()`.                                                                              |
| `test_purity_lint_grep_extends_to_new_files`            | D-14                 | `test_no_drf_or_http_imports_in_module` already covers via `rglob` — verify it passes.                                                   |

---

## Existing Code Insights — Directionality & Field Verification

### Directionality consistency: Phase 1 → Phase 2

`apps/api/plane/app/services/timeline_propagation/graph.py:136-172` — `_make_edge` constructs:

```python
Edge(
    predecessor_id=row.related_issue_id,  # Y
    successor_id=row.issue_id,             # X
    source_relation_id=row.id,
    cross_project=cross_project,
)
```

And `graph.py:120-121`:

```python
successors_mut.setdefault(edge.predecessor_id, set()).add(edge.successor_id)
predecessors_mut.setdefault(edge.successor_id, set()).add(edge.predecessor_id)
```

So `Adjacency.successors[A]` = "things A is a predecessor of" = "things blocked by A" = "things that must wait for A to finish before they can start." Phase 2's forward (rightward) walk uses `adj.successors_of(node_id)` to find the next nodes whose `start_date` is constrained by the moved node's `target_date`. This is consistent.

`apps/api/plane/app/services/timeline_propagation/types.py:72-78` — `successors_of` and `predecessors_of` BOTH return `frozenset()` for unknown ids (no `KeyError`). Phase 2 leverages this: `for succ_id in sorted(adj.successors_of(node_id))` is safe even when `node_id` is the dragged item not in any edge (loop just doesn't execute).

### `Issue` model field verification

`apps/api/plane/db/models/issue.py:145-146`:

```python
start_date = models.DateField(null=True, blank=True)
target_date = models.DateField(null=True, blank=True)
```

Confirms `ScheduledWorkItem.start_date: date | None` and `target_date: date | None` (D-04). The model uses `target_date`, NOT `due_date` — important because PRD line 82 says "successor must start no earlier than the calendar day after its predecessor ENDS" and the existing Plane model field is `target_date`. (Note: `Issue.get_default_properties()` at line 29-44 contains a `"due_date": True` key, but that's a per-user display-property toggle on the issue VIEW, NOT a model field. The schedulable date field is `target_date`.)

`apps/api/plane/db/mixins.py:16-23` — `TimeAuditModel`:

```python
class TimeAuditModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, ...)
    updated_at = models.DateTimeField(auto_now=True, ...)
```

And `Issue` extends `ProjectBaseModel` which transitively extends `AuditModel` which extends `TimeAuditModel` (line 85 of mixins.py). Confirms `ScheduledWorkItem.updated_at: datetime` (timezone-aware — Django default is `USE_TZ=True`).

### Bulk update + `auto_now` interaction (Pitfall 10 setup, Phase 3 concern)

`apps/api/plane/app/views/issue/base.py:1168` — the existing bulk-date-update endpoint does:

```python
Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])
```

Note that ONLY `start_date` and `target_date` are in the field list — `updated_at` is NOT. This is canonical Django behavior: `bulk_update` does NOT call `save()` and does NOT trigger `auto_now=True` field updates. The existing endpoint already has this concern silently; whether the existing endpoint considers it a bug is out of scope.

For Phase 3's propagation endpoint: if we want propagation to bump `updated_at` (which API-12 / US-32 implies — "audit に追跡可能"), Phase 3 MUST either (a) add `"updated_at"` to the `bulk_update` field list and pass `timezone.now()` on each `Issue` instance manually, or (b) iterate `Issue.save()` calls (slow), or (c) accept the existing convention that bulk_update is a low-level write that bypasses `auto_now`. Phase 2 carries `updated_at` on `WorkItemUpdate` as the INPUT value (D-04) — meaning Phase 3 must compute the post-write value and pass it back to the client as part of the API response. Plan-phase: flag this as a Phase 3 hand-off note in the SUMMARY.

---

## Pitfalls

### Pitfall 1: Off-by-one on the adjacency rule (`>= +1` vs `> +1`)

**What goes wrong:** The boundary check uses `succ.start < pred.target` (strict `<` against `pred.target` instead of `pred.target + 1`), which makes `succ.start == pred.target` valid. PRD line 82 is explicit: "successor must start no earlier than the calendar day AFTER its predecessor ends" → `succ.start >= pred.target + 1` → `succ.start == pred.target + 1` is the canonical adjacent case (PROP-10 / TEST-08), and `succ.start == pred.target` is a 1-day overlap (INVALID).

**Concrete example:**

```python
# WRONG:
def boundary_violation(pred_target, succ_start):
    return succ_start < pred_target  # ← would let succ.start == pred.target slip through

# CORRECT (D-03):
def boundary_violation(pred_target, succ_start):
    return succ_start < pred_target + timedelta(days=1)  # equivalent: succ_start <= pred_target
```

**How to detect in tests:** TEST-08 (`test_exact_adjacency_is_valid`) — set `succ.start = pred.target + 1` exactly, drag pred by 0 days; assert no violation. Add a sibling `test_one_day_overlap_is_violation` setting `succ.start = pred.target` (1-day overlap) — should trigger a successor shift on a rightward drag of any size, OR be caught by a dedicated boundary-violation test.

### Pitfall 2: Mutating the input `ScheduledWorkItem` instead of accumulating updates separately

**What goes wrong:** A naive implementation does `succ.start_date = new_start` then later iterates `succ.start_date` again and gets the new value, causing `shift_days` to be wrong on the next iteration. Phase 1 D-04 / Phase 2 D-04 both lock `frozen=True, slots=True` — so this would actually `FrozenInstanceError` at runtime, which is the desired behavior (fast failure).

**Concrete example:**

```python
# WRONG (would raise FrozenInstanceError on the assignment):
succ.start_date = new_start  # ← FrozenInstanceError

# CORRECT: maintain a separate dict from the original ScheduledWorkItem
new_dates_by_id[succ_id] = (new_start, new_target)
```

**How to detect in tests:** This is enforced by the dataclass framework — any test that exercises a multi-node propagation will trip the error if a misguided implementation tries to mutate. TEST-04 (transitive chain) is the canonical test that would expose this.

### Pitfall 3: Counting frontier-stop nodes against the 100-item limit

**What goes wrong:** D-11 says "frontier-stop nodes (zero shift) are NOT counted." A naive implementation that adds every visited node to `affected` would incorrectly hit the limit on graphs with many no-shift descendants.

**Concrete example:**

```python
# WRONG:
for succ_id in sorted(adj.successors_of(node_id)):
    affected.add(succ_id)  # ← counts even shift==0 nodes
    if len(affected) > LIMIT: ...

# CORRECT:
shift_days = (new_start - succ.start_date).days
if shift_days == 0:
    continue  # frontier-stop — do NOT add to affected
if succ_id not in affected:
    affected.add(succ_id)
    if len(affected) > LIMIT: ...
```

**How to detect in tests:** TEST-07 (gap preservation) — single successor with a 10-day gap, drag predecessor by 3 days. If the implementation counts the frontier-stopped successor, `len(updates) == 2`; correct is `len(updates) == 1`. Plus an explicit `test_frontier_stop_does_not_count_against_limit`: chain where the first 100 nodes shift and node 101 is frontier-stopped; assert success.

### Pitfall 4: BFS visited set growing unbounded when the algorithm doesn't dedupe across multiple paths into the same node (split/merge cases)

**What goes wrong:** In merge cases (TEST-06: A→C, B→C), the frontier might enqueue C twice — once as A's successor, once as B's successor (if both are visited). Without dedupe via `affected`, the algorithm processes C twice, computes the shift relative to a different `P_visited` set each time, and produces inconsistent results.

**Concrete example:**

```python
# WRONG: enqueue without dedupe check
for succ_id in sorted(adj.successors_of(node_id)):
    frontier.append(succ_id)  # ← C enqueued twice

# CORRECT: enqueue only when shift > 0 AND dedupe via affected set
if succ_id not in affected:
    affected.add(succ_id)
    new_dates_by_id[succ_id] = (new_start, new_target)
    frontier.append(succ_id)
```

**How to detect in tests:** TEST-06 (merge predecessor branches) — assertion on `len(updates)` should match the unique node count. Plus `test_diamond_graph_visits_sink_once`: A→B→D, A→C→D (diamond); assert D appears in `updates` exactly once.

### Pitfall 5: Computing `required_start = max(p.target+1 for p in P)` over ALL predecessors instead of only the predecessors visited so far

**What goes wrong:** D-02 says `required_start = max(p.target_date + 1 for p in P_in_visited)`. A naive implementation iterates `adj.predecessors_of(succ_id)` and reads ALL predecessors' OLD `target_date` from `work_items_by_id`, inflating the constraint. The correct semantics: the propagation walk only restores adjacency against predecessors it has actually shifted; untouched predecessors are out of scope (the walk hasn't reached them, so by definition they're either unchanged or unrelated).

**Concrete example (TEST-06 merge):** A→C (A.target=Day 5, C.start=Day 6) and B→C (B.target=Day 5, C.start=Day 6). Shift A right by 7 days → A.target becomes Day 12. The forward walk from A reaches C with `P_visited = {A}`, `required_start = max(A.new_target + 1) = Day 13`. C shifts to Day 13. **B is unchanged** because the walk never visits B (we don't walk backward). The OLD B.target is Day 5; if we incorrectly included B in `P_visited`, `required_start = max(Day 13, Day 5+1) = Day 13` — same answer here, but in cases where a propagation pulls a successor BACKWARD via leftward intent, including untouched nodes' old dates would produce the wrong result.

```python
# WRONG: read all predecessors' OLD targets
required_start = max(work_items_by_id[p].target_date + timedelta(days=1)
                     for p in adj.predecessors_of(succ_id))

# CORRECT: only visited predecessors' NEW targets
visited_pred_targets = [
    new_dates_by_id[p][1] for p in adj.predecessors_of(succ_id)
    if p in new_dates_by_id
]
required_start = next_valid_start(max(visited_pred_targets))
```

**How to detect in tests:** TEST-06 with asymmetric gaps (A.target=Day 5, B.target=Day 8, C.start=Day 9 — B-C adjacent, A-C with 3-day gap). Drag A right by 1 day → A.target=Day 6, still 2-day gap to C, no shift. C should NOT be in updates. A wrong implementation that includes B's old target would compute `required_start = max(A.new=Day 7, B.old+1=Day 9) = Day 9` — equal to C.start, so still no shift. But shift A by 4 days → A.target=Day 9. Correct: `P_visited = {A}`, required = Day 10, C shifts to Day 10 (1 day shift). Wrong: `required = max(Day 10, B.old=Day 9) = Day 10`, same answer. The bug surfaces in **leftward** scenarios — see auxiliary `test_leftward_merge_only_considers_visited_successors`.

### Pitfall 6: `delta == 0` no-op move accidentally still walking and returning > 1 update

**What goes wrong:** If the algorithm doesn't short-circuit on `delta == 0` and instead enters the BFS loop, the dragged item's "shift" relative to itself is 0, but if the BFS expands neighbors anyway, the algorithm might compute spurious shifts on adjacent neighbors due to floating-point or signed-arithmetic mistakes.

**Concrete example:** Idempotent client resubmit with `MoveIntent(original == requested)`. Expected: success with 1 update (the dragged item's "new" dates which equal the original). Wrong: BFS enters, finds successor with `start_date` equal to the dragged item's `target_date + 1`, computes `required_start = next_valid_start(target)` = original boundary, `new_start = max(succ.start, required_start)` = succ.start unchanged, shift = 0, frontier-stop. Actually OK in this case BUT: a wrong implementation might still emit an update for the successor with its UNCHANGED dates, inflating `total_updated_count`.

**How to detect in tests:** `test_no_op_move_returns_one_update_no_traversal` — assert `len(updates) == 1` and `updates[0].id == dragged_id`.

### Pitfall 7: `expected_versions` mismatch on UNTOUCHED neighbors triggering false `SCHEDULE_CHANGED` (D-08 says only dragged item is compared)

**What goes wrong:** A defensive implementation that iterates ALL `expected_versions` keys and compares each against the corresponding `work_items_by_id[k].updated_at` would falsely fail when Phase 3 passes a multi-entry `expected_versions` dict that includes neighbors. D-08 is explicit: ONLY the dragged item's `updated_at` is compared.

**Concrete example:**

```python
# WRONG:
for k, expected_dt in expected_versions.items():
    if work_items_by_id[k].updated_at != expected_dt:
        return _fail(..., SCHEDULE_CHANGED, work_item_id=k)

# CORRECT (D-08):
if expected_versions.get(dragged_id) != dragged.updated_at:
    return _fail(..., SCHEDULE_CHANGED, work_item_id=dragged_id)
```

**How to detect in tests:** `test_expected_versions_only_compares_dragged_item` — pass `expected_versions = {dragged_id: dragged.updated_at, neighbor_id: <random datetime>}`; assert success (because only dragged is compared).

### Pitfall 8: `PROPAGATION_LIMIT_EXCEEDED` short-circuit happening AFTER the algorithm already tried to compute the full set (must be eager on each insertion)

**What goes wrong:** A wrong implementation accumulates the full `affected` set first, then checks `if len(affected) > 100: fail` at the end. On pathological graphs (10,000 nodes), this is wasted work.

**Concrete example:**

```python
# WRONG:
while frontier:
    # ... walk ALL nodes, build affected ...
if len(affected) > LIMIT: return PROPAGATION_LIMIT_EXCEEDED  # ← too late

# CORRECT (D-11):
while frontier:
    # ... visit node ...
    if shift > 0 and node_id not in affected:
        affected.add(node_id)
        if len(affected) > LIMIT:
            return PROPAGATION_LIMIT_EXCEEDED  # ← eager
```

**How to detect in tests:** Hard to test for laziness directly without timing assertions. Approximate by `test_limit_at_101_does_not_visit_node_102`: chain of 200 nodes all needing shift, instrument the visited set with a wrapper that counts visits, assert visit count ≤ 101 + epsilon. Practical alternative: code review pins this; `test_limit_at_101_fails` exists as the basic correctness test.

### Pitfall 9: Importing `datetime.timedelta` directly inside `propagation.py` instead of routing through `scheduling.py` (D-03 swap seam violation)

**What goes wrong:** `propagation.py` writes `succ.target + timedelta(days=shift)` instead of `add_calendar_days(succ.target, shift)`. When ADR 0002 swaps `scheduling.py` to working-day arithmetic, the `propagation.py` `timedelta` calls are NOT swapped, breaking the propagation against the new calendar.

**Concrete example:**

```python
# WRONG in propagation.py:
from datetime import timedelta
new_target = succ.target_date + timedelta(days=shift_days)

# CORRECT (D-03):
from .scheduling import add_calendar_days
new_target = add_calendar_days(succ.target_date, shift_days)
```

**How to detect in tests:** `test_propagation_does_not_import_timedelta_directly` — sibling lint-grep test that asserts `"timedelta" not in propagation_py_text` (allow `from .scheduling import ...`). Add to the existing `test_no_drf_or_http_imports_in_module` test or as a sibling. Note: `propagation.py` SHOULD import `from datetime import date, datetime` (for type annotations) but NOT `timedelta`. The lint-grep regex should be precise: `^(from datetime import .*timedelta|import datetime.timedelta)` — or just check that the string `"timedelta"` does NOT appear in `propagation.py` (the simpler check).

### Pitfall 10: `bulk_update` semantics on `Issue` rows (`auto_now=True` updates `updated_at` on every save — is `bulk_update` an exception? Phase 3 cares; flag here so the planner can hand off the issue cleanly)

**What goes wrong:** Django's `Model.objects.bulk_update(...)` does NOT trigger `pre_save` signals, does NOT call `Model.save()`, and does NOT update `auto_now=True` fields. The existing bulk-date-update endpoint at `apps/api/plane/app/views/issue/base.py:1168` uses `Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])` and silently inherits this behavior — `updated_at` does NOT bump.

**Phase 2 impact:** D-04 explicitly says `WorkItemUpdate.updated_at` carries the INPUT `updated_at` value, so Phase 2 is unaffected by this mechanism. **Phase 3 impact:** API-12 / US-32 ("audit に追跡可能") implies `updated_at` SHOULD bump. Phase 3 must either:

- (a) Add `"updated_at"` to the `bulk_update` field list AND set `issue.updated_at = timezone.now()` on each instance before bulk update.
- (b) Use `Issue.objects.filter(id__in=...).update(updated_at=timezone.now())` AFTER the `bulk_update(["start_date", "target_date"])` call (still a single SQL UPDATE).
- (c) Accept the existing-codebase convention that bulk endpoints don't bump `updated_at` (and update `WorkItemUpdate.updated_at` in the response with the original value).

**Recommendation for Phase 3 plan-phase:** Choose (a) — add `"updated_at"` to the field list and set it explicitly. This makes the algorithm's `WorkItemUpdate.updated_at` (the INPUT value) easy to swap in the response: Phase 3 stores `now = timezone.now()` once, sets each `Issue.updated_at = now`, calls `bulk_update(["start_date", "target_date", "updated_at"])`, then maps `WorkItemUpdate.updated_at` to `now` in the response payload. **This is a Phase 3 decision** — Phase 2 just flags it.

**How to detect (Phase 3 contract test, NOT Phase 2):** `test_propagation_response_updated_at_is_after_request_start_time` — call the endpoint, assert each returned `updated_at` is more recent than the request start time.

### Pitfall 11 (BONUS — discovered during research): Returning the dragged item's update LAST instead of FIRST

**What goes wrong:** D-04 says `updates: tuple[WorkItemUpdate, ...]` — order is part of the data. The pseudocode emits the dragged item first, then sorted others. A wrong implementation that uses `for k in sorted(affected): ...` would put the dragged item in the middle of the sort order (sorted by UUID), making the first entry sometimes a propagated neighbor, not the dragged item.

**How to detect:** Most tests don't care about order, BUT `test_dragged_item_appears_first_in_updates` pins this for callers that rely on `updates[0]` being the dragged item (Phase 3's response builder may want this for clarity).

### Pitfall 12 (BONUS): Forgetting to forward `LoadResult.cycle` verbatim into `PropagationFailure.cycle`

**What goes wrong:** D-05 says `PropagationFailure(code=..., cycle=tuple[UUID,...] | None)`. When `graph.cycle is not None`, the failure must carry that path verbatim for downstream diagnostics. A wrong implementation creates the `PropagationFailure` without setting `cycle=`, losing the diagnostic value.

**How to detect:** `test_dependency_cycle_failure_carries_cycle_path` — graph with cycle (a, b, c, a); assert `failure.cycle == (a, b, c, a)`.

---

## ADR 0002 Swap Compatibility

D-03 declares `scheduling.py` as the SINGLE seam for date arithmetic. ADR 0002's Working Calendar follow-up replaces this one function module without modifying `propagation.py`.

### Expected `propagation.py` import list (the contract)

```python
# apps/api/plane/app/services/timeline_propagation/propagation.py
from collections import deque
from collections.abc import Mapping
from datetime import date, datetime  # ← TYPE annotations only
from uuid import UUID

from .errors import PropagationErrorCode, PropagationFailure
from .scheduling import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)
from .types import (
    Adjacency,
    Edge,
    LoadResult,
    MoveIntent,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemUpdate,
)
```

**Key invariants enforced by this import list:**

1. `from datetime import date, datetime` — types ONLY. No `timedelta` direct import (Pitfall 9).
2. `from .scheduling import ...` — every date computation routes through the seam.
3. No `from rest_framework`, no `from django.http`, no `from django.db.models import` — D-14.

### ADR 0002 swap delta (illustrative, not in scope)

When the Working Calendar milestone lands, `scheduling.py` is replaced (or wrapped) with working-day implementations. The function signatures STAY THE SAME:

```python
# Future scheduling.py (illustrative — D-03 says NOT in Phase 2):
def add_calendar_days(d: date, n: int, calendar: WorkingCalendar) -> date:
    """Now: skip non-working days. Same signature + extra arg."""
```

Or, more likely, the public surface is reshaped to take a `Calendar` parameter and `propagation.py` accepts a `calendar: Calendar` argument from Phase 3. **That decision is ADR 0002's, not Phase 2's.** Phase 2's job is to make the swap a one-file replacement, which the import list above achieves.

**Verifiable today:** `grep -n "timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py` should return ZERO matches after Phase 2 ships. `grep -n "^from .scheduling" apps/api/plane/app/services/timeline_propagation/propagation.py` should return ONE match listing all six helpers.

---

## Validation Architecture

> Phase 2 is a pure-Python deep module — every assertion is a unit test against `propagate_move(...)`. No HTTP, no DB roundtrip needed. The Nyquist sampling rate per test commit is "any of the affected `test_propagation.py` / `test_scheduling.py` tests"; per wave merge is the full timeline_propagation unit suite.

### Test Framework

| Property           | Value                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | pytest 9.0.3 + pytest-django 4.5.2 (`apps/api/requirements/test.txt`)                                                                                                           |
| Config file        | `apps/api/pytest.ini` (`--reuse-db --nomigrations -vs --strict-markers`; markers `unit`/`contract`/`smoke`/`slow`)                                                              |
| Quick run command  | `cd apps/api && python run_tests.py -u -- plane/tests/unit/services/timeline_propagation/test_propagation.py plane/tests/unit/services/timeline_propagation/test_scheduling.py` |
| Full suite command | `cd apps/api && python run_tests.py -u` (all unit tests; includes Phase 1 `test_graph.py`)                                                                                      |
| Coverage check     | `cd apps/api && python run_tests.py -u --coverage` (enforces `--fail-under=90`)                                                                                                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                    | Test Type | Automated Command                                                                                                                                   | File Exists?   |
| ------- | ----------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| PROP-03 | No-violation move updates only the dragged item             | unit      | `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::test_no_violation_move_updates_only_dragged_item -x`                    | ❌ Wave 4      |
| PROP-04 | Rightward move propagates to one successor                  | unit      | `pytest ...::test_rightward_move_propagates_to_one_successor -x`                                                                                    | ❌ Wave 5      |
| PROP-05 | Leftward move propagates to one predecessor                 | unit      | `pytest ...::test_leftward_move_propagates_to_one_predecessor -x`                                                                                   | ❌ Wave 5      |
| PROP-06 | Transitive chain / split / merge                            | unit      | `pytest ...::test_transitive_chain_rightward ...::test_split_successor_branches ...::test_merge_predecessor_branches -x`                            | ❌ Wave 6      |
| PROP-07 | Gap preservation (no compression)                           | unit      | `pytest ...::test_gap_preservation -x`                                                                                                              | ❌ Wave 7      |
| PROP-08 | Dragged item duration preserved (else `INVALID_DATE_RANGE`) | unit      | `pytest ...::test_duration_change_returns_invalid -x`                                                                                               | ❌ Wave 10     |
| PROP-09 | Propagated items' duration preserved                        | unit      | (assertion inside TEST-04)                                                                                                                          | ❌ Wave 6      |
| PROP-10 | Exact adjacency is valid                                    | unit      | `pytest ...::test_exact_adjacency_is_valid -x`                                                                                                      | ❌ Wave 7      |
| PROP-11 | Calendar-day arithmetic                                     | unit      | (assertion across all TEST-NN — pin via `test_propagation_does_not_import_timedelta_directly` lint check)                                           | ❌ Wave 12     |
| PROP-12 | All-or-nothing on failure                                   | unit      | `pytest ...::test_failure_emits_empty_updates_tuple -x`                                                                                             | ❌ Wave 8/9/10 |
| PROP-13 | 100-item limit                                              | unit      | `pytest ...::test_propagation_exceeds_100_returns_limit_exceeded ...::test_limit_exactly_at_100_succeeds ...::test_limit_at_101_fails -x`           | ❌ Wave 9      |
| PROP-14 | Service module isolation                                    | unit      | `pytest plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module -x` (already exists; must remain green) | ✅ Phase 1     |
| PROP-17 | INCOMPLETE_SCHEDULE on missing dates                        | unit      | `pytest ...::test_incomplete_successor_returns_incomplete_schedule ...::test_incomplete_dragged_item_returns_incomplete_schedule_eager -x`          | ❌ Wave 8      |
| TEST-01 | No-violation move                                           | unit      | `pytest ...::test_no_violation_move_updates_only_dragged_item -x`                                                                                   | ❌ Wave 4      |
| TEST-02 | Rightward to one successor                                  | unit      | `pytest ...::test_rightward_move_propagates_to_one_successor -x`                                                                                    | ❌ Wave 5      |
| TEST-03 | Leftward to one predecessor                                 | unit      | `pytest ...::test_leftward_move_propagates_to_one_predecessor -x`                                                                                   | ❌ Wave 5      |
| TEST-04 | Transitive chain                                            | unit      | `pytest ...::test_transitive_chain_rightward -x`                                                                                                    | ❌ Wave 6      |
| TEST-05 | Split successor                                             | unit      | `pytest ...::test_split_successor_branches -x`                                                                                                      | ❌ Wave 6      |
| TEST-06 | Merge predecessor                                           | unit      | `pytest ...::test_merge_predecessor_branches -x`                                                                                                    | ❌ Wave 6      |
| TEST-07 | Gap preservation                                            | unit      | `pytest ...::test_gap_preservation -x`                                                                                                              | ❌ Wave 7      |
| TEST-08 | Exact adjacency                                             | unit      | `pytest ...::test_exact_adjacency_is_valid -x`                                                                                                      | ❌ Wave 7      |
| TEST-09 | Incomplete schedule                                         | unit      | `pytest ...::test_incomplete_successor_returns_incomplete_schedule -x`                                                                              | ❌ Wave 8      |
| TEST-12 | 100 limit                                                   | unit      | `pytest ...::test_propagation_exceeds_100_returns_limit_exceeded -x`                                                                                | ❌ Wave 9      |
| TEST-14 | Invalid date range                                          | unit      | `pytest ...::test_requested_target_before_start_returns_invalid -x`                                                                                 | ❌ Wave 10     |

### Sampling Rate

- **Per task commit:** Run only the affected wave's tests — `pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::<wave_test_name> -x`.
- **Per wave merge:** Full `cd apps/api && python run_tests.py -u -- plane/tests/unit/services/timeline_propagation/`.
- **Phase gate:** Full unit suite green AND coverage ≥ 90% on the three new files. Run `cd apps/api && python run_tests.py -u --coverage` and inspect `htmlcov/index.html` for the timeline_propagation package.

### Wave 0 Gaps (must exist before any test can run)

- [ ] `apps/api/plane/app/services/timeline_propagation/errors.py` — empty module + docstring (Wave 1 fills it).
- [ ] `apps/api/plane/app/services/timeline_propagation/scheduling.py` — empty module + docstring (Wave 3 fills it).
- [ ] `apps/api/plane/app/services/timeline_propagation/propagation.py` — empty module + docstring (Wave 4 fills it).
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — new test file with first failing test for `range_duration`.
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — new test file with first failing import test for `propagate_move`.
- [ ] No framework install needed (pytest, pytest-django, factory_boy already in `requirements/test.txt`).
- [ ] No new shared `conftest.py` fixtures needed (D-13 pure in-memory fixtures live in each test file).

### Validation Dimensions (the Nyquist coverage matrix)

| Dimension                                                                             | Test type                    | Pinned by                                                                                  |
| ------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Functional correctness — 11 PRD test cases                                            | `@pytest.mark.unit` per-case | TEST-01..TEST-09, TEST-12, TEST-14                                                         |
| Validation order short-circuits                                                       | unit                         | `test_validation_order_invalid_range_beats_cycle`                                          |
| Cycle pre-check fails fast                                                            | unit                         | `test_cycle_pre_check_fires_regardless_of_reachability`                                    |
| Stale check granularity (dragged-item-only)                                           | unit                         | `test_expected_versions_only_compares_dragged_item`                                        |
| Cross-project reachability                                                            | unit                         | `test_cross_project_reachable_successor_fails` + `test_cross_project_unreachable_succeeds` |
| Limit boundary at exactly 100 / 101                                                   | unit                         | `test_limit_exactly_at_100_succeeds` + `test_limit_at_101_fails`                           |
| All-or-nothing emission                                                               | unit                         | `test_failure_emits_empty_updates_tuple`                                                   |
| Module purity (D-14 lint-grep)                                                        | unit                         | `test_no_drf_or_http_imports_in_module` (already exists, auto-extends via `rglob`)         |
| Date-arithmetic isolation (no `timedelta` in propagation.py)                          | unit                         | `test_propagation_does_not_import_timedelta_directly` (NEW)                                |
| Coverage gate ≥ 90% on the three new files                                            | tooling                      | `python run_tests.py -u --coverage` (CI-style)                                             |
| Test fixture purity (no `@django_db` in `test_propagation.py` / `test_scheduling.py`) | unit                         | `test_phase2_tests_use_no_django_db_marker` (sibling lint-grep test, optional)             |
| Empty graph + no-violation move                                                       | unit                         | TEST-01 covers (dragged-only graph)                                                        |
| No-op move (delta=0)                                                                  | unit                         | `test_no_op_move_returns_one_update_no_traversal`                                          |

---

## Open Questions for Planner

1. **Should `scheduling.py` helpers be re-exported from `__init__.py`?** CONTEXT.md Claude's Discretion bullet 4 leans yes (so `test_scheduling.py` doesn't depth-import). Plan-phase to confirm and explicitly enumerate the public surface in `__init__.py`. Recommendation: yes — re-export `add_calendar_days`, `next_valid_start`, `previous_valid_target`, `is_valid_range`, `boundary_violation`, `range_duration`. Total `__all__` after Phase 2: 12 names (5 from Phase 1 + 7 new types/enum + 6 scheduling helpers if re-exported = 18 — manageable).

2. **`expected_versions[dragged_id]` MISSING — `KeyError` vs `SCHEDULE_CHANGED`?** Pseudocode uses `.get(dragged_id)` returning `None`; comparison `None != datetime(...)` returns `True` → `SCHEDULE_CHANGED`. Alternative: `expected_versions[dragged_id]` raising `KeyError` (programmer-error contract; Phase 3 ALWAYS provides it). Recommendation: keep `.get(...)` form so Phase 3 bugs don't crash with `KeyError` across the API boundary; the resulting `SCHEDULE_CHANGED` code is a sane safety net. Plan-phase to confirm with explicit test.

3. **Defensive `INCOMPLETE_SCHEDULE` when `work_items_by_id.get(node_id)` returns `None`?** Pseudocode treats it as `INCOMPLETE_SCHEDULE` on the offending node. Alternative: raise `KeyError` (programmer-error — Phase 3's queryset must load all reachable items). Recommendation: keep typed-failure form for safety; pin with test `test_unknown_successor_id_returns_incomplete_schedule`. Plan-phase to confirm.

4. **Order of `updates` in success result.** D-04 doesn't specify order. Pseudocode emits dragged item first, then sorted others. Plan-phase: confirm this is the intended contract (otherwise downstream consumers — Phase 3 response serializer, Phase 4 store — need to find the dragged item by id).

5. **`PropagationFailure.message` strings — diagnostic English vs user-facing prose.** CONTEXT.md "Specifics" bullet 5 says "diagnostic English ('Cycle detected: A → B → C → A') rather than user-facing prose." Recommendation: stick to diagnostic form. Phase 5 owns localized user-facing messages via `@plane/i18n`. Plan-phase to lock the exact phrasing per code (consider these strings as "developer documentation visible in logs," not UI strings).

6. **Lint-grep test placement — extend `test_graph.py` or new `test_purity.py`?** Phase 1's `test_no_drf_or_http_imports_in_module` already lives in `test_graph.py:411-435` and uses `pkg_root.rglob("*.py")` so it auto-covers new files. Plan-phase choice: (a) leave it where it is (no test refactor needed), or (b) move to `test_purity.py` for thematic clarity. Recommendation: (a) — minimum-blast-radius. Add a new sibling test `test_propagation_does_not_import_timedelta_directly` for Pitfall 9 in either `test_graph.py` or a new `test_purity.py`.

7. **`from collections import deque` inside function vs module top.** Pseudocode imports inside `_walk_forward` / `_walk_backward` for clarity; idiomatic Python is module-top imports. Plan-phase: lift to module-top (`# Python imports` block per Phase 1 convention).

---

## Sources

### Primary (HIGH confidence)

- `apps/api/plane/app/services/timeline_propagation/__init__.py` (Phase 1 surface — verified, current).
- `apps/api/plane/app/services/timeline_propagation/types.py` (Phase 1 types — verified, current).
- `apps/api/plane/app/services/timeline_propagation/graph.py` (loader contract — verified, current).
- `apps/api/plane/db/models/issue.py:104-176` (`Issue` model: `start_date`/`target_date` are `DateField(null=True)`; uses `target_date` not `due_date`).
- `apps/api/plane/db/mixins.py:16-23` (`TimeAuditModel.updated_at = DateTimeField(auto_now=True)`).
- `apps/api/plane/app/views/issue/base.py:1168` (existing `Issue.objects.bulk_update(["start_date", "target_date"])` pattern — confirms `auto_now` interaction concern).
- `apps/api/pytest.ini` (markers, `--reuse-db --nomigrations` defaults).
- `apps/api/run_tests.py` (canonical test runner; `-u` flag for unit; `--coverage` enforces 90%).
- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` (the 14 locked decisions).
- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` (Phase 1 D-06 adjacency shape, D-08 lint-grep).
- `.planning/phases/01-precedence-graph-loader-normalization/01-RESEARCH.md` (Pitfalls 1-5 carried forward as Phase 2 background).
- `.planning/REQUIREMENTS.md` (PROP-03..PROP-14, PROP-17 + TEST-01..TEST-09, TEST-12, TEST-14 mapped to Phase 2).
- `.planning/ROADMAP.md` §"Phase 2" (goal, success criteria, modules-to-change, first-minimum-task).
- `docs/prd/timeline-dependency-date-range-propagation.md` (line 82 adjacency rule, lines 137-138 7 codes, line 171 ADR 0002 swap).
- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` (server authority lock).
- `docs/adr/0002-working-calendar-with-japan-holiday-preset.md` (deferred; relevant only to D-03 swap-seam).
- `CONTEXT.md` (Ubiquitous Language: Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary).

### Secondary (MEDIUM confidence)

- `.planning/codebase/STACK.md` (Python 3.12.10 — `StrEnum` available; pytest 9.0.3, factory_boy 3.3.0, freezegun 1.2.2; coverage --fail-under=90).
- `.planning/codebase/TESTING.md` (pytest markers; `apps/api/plane/tests/unit/services/` directory layout already established in Phase 1).
- `.planning/codebase/ARCHITECTURE.md` (layered Django REST monolith; service module is the deep layer between view and ORM).

### Tertiary (LOW confidence — flagged for plan-phase validation)

- Pitfall 10's recommendation for Phase 3 `bulk_update` strategy (a/b/c) is informed by canonical Django behavior (`bulk_update` skips signals + auto_now) but the specific Plane-codebase choice is a Phase 3 decision; flag to planner for cross-phase awareness only.

---

## Metadata

**Confidence breakdown:**

- Locked decisions (D-01..D-14): HIGH — verbatim from CONTEXT.md.
- Phase 1 surface compatibility: HIGH — verified by reading `__init__.py`, `types.py`, `graph.py`.
- `Issue` model field names (`target_date`, not `due_date`): HIGH — verified at `apps/api/plane/db/models/issue.py:145-146`.
- `bulk_update` + `auto_now` interaction: HIGH for the canonical Django behavior (well-documented in stdlib); MEDIUM for the Plane-codebase Phase 3 implementation choice (deferred).
- `StrEnum` availability on Python 3.12: HIGH — stdlib since 3.11, codebase pinned to 3.12.10.
- Test directory layout: HIGH — Phase 1 already created `apps/api/plane/tests/unit/services/timeline_propagation/`.
- Pitfalls 1-9: HIGH — derived from D-01..D-11 with concrete code examples.
- Pitfall 10 (bulk_update): MEDIUM — Phase 3 concern flagged for the planner, not Phase 2's responsibility.
- Pitfalls 11-12 (BONUS): HIGH — derived from D-04 / D-05 contract.

**Research date:** 2026-05-04
**Valid until:** Phase 2 plan-phase consumes this; if Phase 2 implementation is delayed beyond 30 days, re-verify `Issue` model fields and `pytest.ini` markers haven't drifted.

## Assumptions Log

| #   | Claim                                                                                                  | Section                | Risk if Wrong                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Django `bulk_update` does NOT trigger `auto_now=True` field updates (canonical Django stdlib behavior) | Pitfall 10             | LOW — confirmed by reading existing `apps/api/plane/app/views/issue/base.py:1168` which uses the same pattern without bumping `updated_at`. Phase 3 will revisit. |
| A2  | `StrEnum` from Python 3.11+ stdlib serializes via `code.value` cleanly to JSON                         | D-05 / Wave 1          | LOW — standard stdlib behavior; CONTEXT.md D-05 explicitly chose `StrEnum` for this reason.                                                                       |
| A3  | `from collections import deque` is the idiomatic Python BFS frontier container                         | Algorithmic Pseudocode | LOW — `deque` is stdlib, `popleft()` is O(1); used throughout the codebase.                                                                                       |
| A4  | `Issue.target_date` (not `Issue.due_date`) is the schedulable end-date field                           | Existing Code Insights | NONE — verified at `apps/api/plane/db/models/issue.py:146`.                                                                                                       |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (This table has 4 entries, all LOW or NONE risk.)

## RESEARCH COMPLETE
