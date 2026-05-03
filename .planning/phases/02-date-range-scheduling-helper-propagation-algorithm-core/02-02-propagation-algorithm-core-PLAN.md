---
plan_id: 02-02
phase: 2
title: propagate_move BFS algorithm core + 11 PRD-pinned tests + edge-case suite
wave: 2
depends_on: [02-01]
files_modified:
  - apps/api/plane/app/services/timeline_propagation/propagation.py
  - apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py
autonomous: true
requirements:
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
---

# Plan 02-02: propagate_move BFS algorithm core

## Objective

Replace the Plan 02-01 STUB with the full `propagate_move(graph, work_items_by_id, move_intent, expected_versions) -> PropagationResult` BFS frontier-walk implementation per CONTEXT.md D-01..D-12, and ship the 11 PRD-pinned algorithmic tests (TEST-01..TEST-09, TEST-12, TEST-14) plus the auxiliary edge-case suite (validation order, no-op delta=0, cycle fail-fast, cross-project reachability, stale schedule, limit boundary at 100/101).

This plan covers Waves 4–11 from `02-RESEARCH.md` (the production algorithm + every algorithmic test). Plan 02-03 owns Wave 12 (the lint-grep purity invariant + coverage gate).

## Truths (CONTEXT.md anchors — 14 locked decisions)

- **D-01 (algorithm shape):** Single-direction BFS frontier walk parameterized by `delta = (requested_start - original_start).days`. `delta > 0` → forward through `Adjacency.successors`. `delta < 0` → backward through `Adjacency.predecessors`. `delta == 0` → return success with one update (the dragged item, idempotent), zero traversal.
- **D-02 (adjacency math):** Forward shift at successor `s`: `required_start = next_valid_start(max(p.target_date for p in P_visited))` where `P_visited = {p in adj.predecessors_of(s) if p in new_dates_by_id}`; `new_start = max(s.start_date, required_start)`; `shift_days = (new_start - s.start_date).days`; if `0` → frontier-stop; else `s.target_date += shift_days`. Backward symmetric mirror.
- **D-03 (date math seam):** ALL date arithmetic routes through `scheduling.py` helpers. `propagation.py` MUST NOT `import timedelta` directly; only `from datetime import date, datetime` for type annotations. Plan 02-03 enforces with lint-grep.
- **D-04 (types):** On success, `updates` ALWAYS includes the dragged item FIRST, then sorted by id (deterministic order — Pitfall 11). On failure, `updates = ()` (all-or-nothing).
- **D-05 / D-06 (validation order):** Fixed early-return order: `INVALID_DATE_RANGE` → `DEPENDENCY_CYCLE` → `INCOMPLETE_SCHEDULE on dragged` → `SCHEDULE_CHANGED` → walk.
- **D-07 (cycle fail-fast):** `graph.cycle is not None` → return `DEPENDENCY_CYCLE` regardless of reachability from the moved item; carry `LoadResult.cycle` verbatim into `PropagationFailure.cycle` (Pitfall 12).
- **D-08 (stale check):** Compare ONLY `expected_versions.get(dragged_id)` against `work_items_by_id[dragged_id].updated_at`. Untouched neighbors' `updated_at` are NEVER read (Pitfall 7). Missing key → `None != datetime` → `SCHEDULE_CHANGED` (per RESEARCH.md Open Question 2 recommendation).
- **D-09 (lazy INCOMPLETE_SCHEDULE):** During the walk, when reading a visited node's dates, if either is `None` → return `INCOMPLETE_SCHEDULE` with the offending `work_item_id`.
- **D-10 (cross-project reachability):** Build reverse indices `cross_project_out: dict[UUID, list[Edge]]` (forward; keyed by predecessor) and `cross_project_in: dict[UUID, list[Edge]]` (backward; keyed by successor) ONCE at the top of `propagate_move`. Per-visited-node lookup; fire `PROJECT_BOUNDARY_EXCEEDED` on first hit in walk direction.
- **D-11 (limit):** `affected: set[UUID] = {dragged_id}`. Increment ONLY on non-zero shift (frontier-stop nodes are NOT counted; Pitfall 3). Check `len(affected) > 100` IMMEDIATELY after each insertion (eager; Pitfall 8). Failure carries `work_item_id=None`.
- **D-12 (public surface):** Free function only, no class, no clock parameter. Signature locked.
- **D-13 (test fixtures):** Pure in-memory; `@pytest.mark.unit` only. NO `@pytest.mark.django_db`. Inputs are hand-built `Adjacency` / `LoadResult` / `ScheduledWorkItem` literals.
- **D-14 (purity):** No DRF / no Django HTTP / no ORM writes. Plan 02-03 enforces.
- **Pitfalls 1-12 (RESEARCH.md):** Pinned by tests below.

## Must-Haves

**Truths (observable behaviors after this plan ships):**

- `propagate_move(...)` returns `PropagationResult(is_success=True, updates=(<dragged>,))` for any valid no-violation move (TEST-01 / PROP-03).
- Rightward moves shift only the affected successors with minimum displacement; durations preserved (TEST-02 / PROP-04 + PROP-09).
- Leftward moves shift only the affected predecessors with minimum displacement (TEST-03 / PROP-05).
- Transitive chains, split branches, and merge joins all return the correct minimum set (TEST-04, TEST-05, TEST-06 / PROP-06).
- Pre-existing slack between work items is NOT compressed when no boundary violation occurs (TEST-07 / PROP-07).
- Exact-day adjacency (`succ.start == pred.target + 1`) is NEVER reported as a violation (TEST-08 / PROP-10).
- Missing dates on a reachable node return `INCOMPLETE_SCHEDULE` with the offending `work_item_id` (TEST-09 / PROP-17).
- Distinct-affected count > 100 returns `PROPAGATION_LIMIT_EXCEEDED` with `work_item_id=None`; exactly 100 succeeds (TEST-12 / PROP-13).
- Invalid date ranges (`requested_target < requested_start`) and duration mismatches return `INVALID_DATE_RANGE` (TEST-14 / PROP-08).
- All failure paths return `updates=()` (PROP-12, all-or-nothing).
- Cycles short-circuit BEFORE the walk and carry the cycle path verbatim (D-07).
- Cross-project reachable edges fire `PROJECT_BOUNDARY_EXCEEDED`; unreachable cross-project edges do NOT fail (D-10).
- Stale `updated_at` on the dragged item returns `SCHEDULE_CHANGED`; untouched neighbors' `updated_at` are not compared (D-08).
- `delta == 0` returns one update with no traversal (D-01).
- Validation order is fixed: `INVALID_DATE_RANGE` beats `DEPENDENCY_CYCLE` (D-06).

**Artifacts (files that must exist after this plan):**

- `apps/api/plane/app/services/timeline_propagation/propagation.py` — ≥ 200 lines; `propagate_move` + `_walk_forward` + `_walk_backward` + `_ok` + `_fail` underscore-prefixed module-helpers per Phase 1 graph.py convention; module-top `from collections import deque` (per RESEARCH.md Open Question 7).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — ≥ 27 algorithmic tests across 16 test classes (the placeholder STUB test from Plan 02-01 is REPLACED).

**Key links:**

- `propagation.py` imports `from .scheduling import (...)` for ALL date arithmetic — verified by Plan 02-03's lint-grep (NO `from datetime import timedelta`).
- `propagation.py` imports `from .errors import PropagationErrorCode, PropagationFailure` and `from .types import (...)` (Phase 2 types).
- `propagation.py` reads `graph.adjacency.successors_of(...)` / `.predecessors_of(...)` (Phase 1 contract; returns `frozenset()` for unknown ids — no KeyError).
- `propagation.py` reads `graph.adjacency.cross_project_edges` (Phase 1 contract; tuple of Edges with `cross_project=True`).
- `propagation.py` reads `graph.cycle` (Phase 1 contract; closed path tuple or None).

## Tasks

<task id="02-02-T1">
  <title>Task 1: Replace propagation.py STUB with full BFS algorithm</title>
  <read_first>
    - apps/api/plane/app/services/timeline_propagation/propagation.py (the STUB created in Plan 02-01 — replace its body)
    - apps/api/plane/app/services/timeline_propagation/graph.py (Phase 1 — see lines 1-58 for module docstring shape, lines 78-81 for module-level constant placement convention, lines 175-228 for iterative-walk discipline)
    - apps/api/plane/app/services/timeline_propagation/types.py (the four new dataclasses landed in Plan 02-01 — `ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`)
    - apps/api/plane/app/services/timeline_propagation/errors.py (Plan 02-01: `PropagationErrorCode`, `PropagationFailure`)
    - apps/api/plane/app/services/timeline_propagation/scheduling.py (Plan 02-01: six helpers — use ALL of them for date math; do NOT import `timedelta` directly)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-RESEARCH.md §"Algorithmic Pseudocode" (lines 321-637 — full reference implementation; planner / executor follow this verbatim)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-RESEARCH.md §"Pitfalls" (Pitfalls 1-12: off-by-one, frozen-mutation, frontier-stop counting, BFS dedupe, P_visited semantics, no-op short-circuit, expected_versions scope, lazy limit, timedelta import, bulk_update Phase 3 hand-off, dragged-first ordering, cycle path forwarding)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md (D-01 through D-12 — every algorithm decision)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-PATTERNS.md §3 (the propagation.py file shape — section dividers, module-level constants, underscore-prefixed helpers, BFS via `collections.deque`)
  </read_first>
  <action>
Replace `apps/api/plane/app/services/timeline_propagation/propagation.py` ENTIRELY with this implementation (RESEARCH.md §"Algorithmic Pseudocode" verbatim, with Open Question 7 lift of `deque` to module-top):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Date-range schedule propagation algorithm for Timeline Dependency.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

Algorithm shape (CONTEXT.md D-01):
    BFS frontier walk parameterized by `delta = requested_start - original_start`.
    delta > 0 (rightward) → walk forward through `Adjacency.successors`.
    delta < 0 (leftward)  → walk backward through `Adjacency.predecessors`.
    delta == 0            → return one update (idempotent), no traversal.

Adjacency math (D-02 / PROP-10):
    `succ.start >= pred.target + 1 day` is the canonical adjacent case (VALID).
    All date arithmetic routes through `.scheduling` helpers (D-03 swap seam).
    `propagation.py` MUST NOT import `timedelta` directly.

Validation order (D-06; first failure short-circuits):
    1. INVALID_DATE_RANGE — original/requested range invalid OR duration mismatch (PROP-08)
    2. DEPENDENCY_CYCLE   — graph.cycle is not None (D-07 fail-fast)
    3. INCOMPLETE_SCHEDULE — dragged item missing dates (eager)
    4. SCHEDULE_CHANGED   — expected_versions[dragged_id] != dragged.updated_at (D-08 dragged-only)
    5. Walk; per-visited-node lazy checks: INCOMPLETE_SCHEDULE (D-09),
       PROJECT_BOUNDARY_EXCEEDED (D-10 reachability), PROPAGATION_LIMIT_EXCEEDED (D-11 lazy).

Caller assumptions (D-08, D-12):
    - The caller (Phase 3 view) MUST populate `work_items_by_id` with every
      Work Item reachable from the dragged item via the precedence subgraph.
    - The caller MUST pass `expected_versions[move_intent.work_item_id]`;
      a missing key falls through to `SCHEDULE_CHANGED` rather than raising
      (a Phase 3 bug should not crash the algorithm — it should surface as
      a typed failure the API can turn into HTTP 409 / 422).

Module scope (PROP-18): move-only.
"""

# Python imports
from collections import deque
from collections.abc import Mapping
from datetime import date, datetime
from uuid import UUID

# Module imports
from .errors import PropagationErrorCode, PropagationFailure
from .scheduling import (
    add_calendar_days,
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

LIMIT = 100  # PROP-13 / D-11 — distinct-affected cap including the dragged item


def propagate_move(
    graph: LoadResult,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    move_intent: MoveIntent,
    expected_versions: Mapping[UUID, datetime],
) -> PropagationResult:
    """Compute the minimum schedule propagation for a single Work Item move.

    See module docstring for the algorithm contract. Returns a `PropagationResult`
    whose `failure` is `None` on success (with `updates` containing the dragged
    item plus the minimum set of propagated items in deterministic order:
    dragged first, then sorted by UUID), or a typed `PropagationFailure` on
    every error path (with `updates=()` — all-or-nothing per PROP-12).

    Never raises across the module boundary on a typed failure; only `KeyError`
    is permitted, and only when `work_items_by_id` is missing the dragged item
    itself (a Phase 3 contract violation — the algorithm has no recovery path).
    """
    dragged_id = move_intent.work_item_id

    # --- D-06 step 1: INVALID_DATE_RANGE (PROP-08, TEST-14) ---
    if not is_valid_range(move_intent.original_start_date, move_intent.original_target_date):
        return _fail(
            dragged_id,
            PropagationErrorCode.INVALID_DATE_RANGE,
            message="original date range is invalid (target < start)",
            work_item_id=dragged_id,
        )
    if not is_valid_range(move_intent.requested_start_date, move_intent.requested_target_date):
        return _fail(
            dragged_id,
            PropagationErrorCode.INVALID_DATE_RANGE,
            message="requested date range is invalid (target < start)",
            work_item_id=dragged_id,
        )
    if range_duration(
        move_intent.original_start_date, move_intent.original_target_date
    ) != range_duration(
        move_intent.requested_start_date, move_intent.requested_target_date
    ):
        return _fail(
            dragged_id,
            PropagationErrorCode.INVALID_DATE_RANGE,
            message="duration changed (move-only — resize unsupported per PROP-08)",
            work_item_id=dragged_id,
        )

    # --- D-06 step 2: DEPENDENCY_CYCLE (D-07 fail-fast regardless of reachability) ---
    if graph.cycle is not None:
        return _fail(
            dragged_id,
            PropagationErrorCode.DEPENDENCY_CYCLE,
            message=f"cycle detected: {' -> '.join(str(n) for n in graph.cycle)}",
            cycle=graph.cycle,
        )

    # --- D-06 step 3: INCOMPLETE_SCHEDULE on dragged item (eager) ---
    dragged = work_items_by_id[dragged_id]  # KeyError → Phase 3 contract violation
    if dragged.start_date is None or dragged.target_date is None:
        return _fail(
            dragged_id,
            PropagationErrorCode.INCOMPLETE_SCHEDULE,
            message="dragged work item is missing start_date or target_date",
            work_item_id=dragged_id,
        )

    # --- D-06 step 4: SCHEDULE_CHANGED (D-08 dragged-item-only) ---
    if expected_versions.get(dragged_id) != dragged.updated_at:
        return _fail(
            dragged_id,
            PropagationErrorCode.SCHEDULE_CHANGED,
            message="schedule changed since drag started (dragged item updated_at mismatch)",
            work_item_id=dragged_id,
        )

    # --- D-10: build cross-project reverse indices ONCE ---
    cross_project_out: dict[UUID, list[Edge]] = {}  # forward: keyed by predecessor
    cross_project_in: dict[UUID, list[Edge]] = {}  # backward: keyed by successor
    for e in graph.adjacency.cross_project_edges:
        cross_project_out.setdefault(e.predecessor_id, []).append(e)
        cross_project_in.setdefault(e.successor_id, []).append(e)

    # --- D-01: compute delta + direction ---
    delta = (move_intent.requested_start_date - move_intent.original_start_date).days

    # --- Always emit dragged item update (PROP-03 / TEST-01) ---
    affected: set[UUID] = {dragged_id}
    new_dates_by_id: dict[UUID, tuple[date, date]] = {
        dragged_id: (move_intent.requested_start_date, move_intent.requested_target_date),
    }

    # --- D-01: delta == 0 → no traversal ---
    if delta == 0:
        return _ok(dragged_id, work_items_by_id, new_dates_by_id, affected)

    # --- D-01: choose direction ---
    if delta > 0:
        failure = _walk_forward(
            graph.adjacency,
            work_items_by_id,
            cross_project_out,
            dragged_id,
            new_dates_by_id,
            affected,
        )
    else:  # delta < 0
        failure = _walk_backward(
            graph.adjacency,
            work_items_by_id,
            cross_project_in,
            dragged_id,
            new_dates_by_id,
            affected,
        )

    if failure is not None:
        return PropagationResult(
            requested_work_item_id=dragged_id,
            failure=failure,
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
    """BFS forward walk over `Adjacency.successors`; rightward propagation.

    Frontier-stop on zero shift (PROP-07 gap preserved). Deterministic neighbor
    expansion via `sorted(...)` so the resulting `updates` tuple order is stable
    across runs (Pitfall 4 — frozenset iteration is undefined).
    """
    frontier: deque[UUID] = deque([dragged_id])

    while frontier:
        node_id = frontier.popleft()

        # D-10 reachability: cross-project edge from this node fires PROJECT_BOUNDARY_EXCEEDED
        if node_id in cross_project_out:
            return PropagationFailure(
                code=PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED,
                message=f"propagation reaches a cross-project edge from {node_id}",
                work_item_id=node_id,
            )

        for succ_id in sorted(adj.successors_of(node_id)):
            succ = work_items_by_id.get(succ_id)
            if succ is None:
                # Defensive: graph claims succ exists but Phase 3's queryset
                # didn't materialize it. Treat as INCOMPLETE_SCHEDULE on the
                # offending node (RESEARCH.md Open Question 3 recommendation).
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"successor {succ_id} not in work_items_by_id",
                    work_item_id=succ_id,
                )

            # D-09 lazy: read dates only when we need them
            if succ.start_date is None or succ.target_date is None:
                return PropagationFailure(
                    code=PropagationErrorCode.INCOMPLETE_SCHEDULE,
                    message=f"successor {succ_id} is missing start_date or target_date",
                    work_item_id=succ_id,
                )

            # D-02 forward: required_start = max(p.target + 1 for p in P_visited)
            # Pitfall 5: only consider predecessors already in new_dates_by_id
            visited_pred_targets: list[date] = []
            for pred_id in adj.predecessors_of(succ_id):
                if pred_id in new_dates_by_id:
                    visited_pred_targets.append(new_dates_by_id[pred_id][1])
            if not visited_pred_targets:
                # No path from dragged item via visited preds — should not happen
                # in a well-formed BFS (we only enqueue successors of visited nodes).
                continue

            required_start = next_valid_start(max(visited_pred_targets))
            new_start = max(succ.start_date, required_start)
            shift_days = (new_start - succ.start_date).days

            if shift_days == 0:
                continue  # frontier-stop (PROP-07 gap preserved); succ NOT counted

            # D-02: target += shift (PROP-09 duration preservation)
            new_target = add_calendar_days(succ.target_date, shift_days)

            # D-11: lazy limit check after each insertion (Pitfall 8 — eager)
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
            else:
                # Already visited — update dates if a new visit produced a larger shift
                # (merge case Pitfall 4: re-process when a later predecessor demands more)
                existing_start, _ = new_dates_by_id[succ_id]
                if new_start > existing_start:
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
    """BFS backward walk over `Adjacency.predecessors`; leftward propagation.

    Symmetric mirror of `_walk_forward`. Frontier-stop on zero shift; deterministic
    neighbor expansion via `sorted(...)`.
    """
    frontier: deque[UUID] = deque([dragged_id])

    while frontier:
        node_id = frontier.popleft()

        if node_id in cross_project_in:
            return PropagationFailure(
                code=PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED,
                message=f"propagation reaches a cross-project edge from {node_id}",
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
                    message=f"predecessor {pred_id} is missing start_date or target_date",
                    work_item_id=pred_id,
                )

            # D-02 backward: required_target = min(s.start - 1 for s in S_visited)
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
                continue  # frontier-stop

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
            else:
                _, existing_target = new_dates_by_id[pred_id]
                if new_target < existing_target:
                    new_dates_by_id[pred_id] = (new_start, new_target)
                    frontier.append(pred_id)

    return None  # success


def _ok(
    dragged_id: UUID,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    new_dates_by_id: Mapping[UUID, tuple[date, date]],
    affected: set[UUID],
) -> PropagationResult:
    """Build a successful PropagationResult.

    Order (Pitfall 11): dragged item FIRST, then other affected ids sorted by UUID
    for deterministic output.
    """
    updates_list: list[WorkItemUpdate] = []
    dragged_start, dragged_target = new_dates_by_id[dragged_id]
    updates_list.append(
        WorkItemUpdate(
            id=dragged_id,
            start_date=dragged_start,
            target_date=dragged_target,
            updated_at=work_items_by_id[dragged_id].updated_at,  # D-04 INPUT value
        )
    )
    for other_id in sorted(affected - {dragged_id}):
        s, t = new_dates_by_id[other_id]
        updates_list.append(
            WorkItemUpdate(
                id=other_id,
                start_date=s,
                target_date=t,
                updated_at=work_items_by_id[other_id].updated_at,
            )
        )
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
    """Build a failing PropagationResult with `updates=()` (PROP-12 all-or-nothing)."""
    return PropagationResult(
        requested_work_item_id=dragged_id,
        failure=PropagationFailure(
            code=code,
            message=message,
            work_item_id=work_item_id,
            cycle=cycle,
        ),
        updates=(),
        total_updated_count=0,
    )
```

**Critical implementation notes for the executor:**

1. **DO NOT import `from datetime import timedelta`** — Plan 02-03's lint-grep test will FAIL otherwise (Pitfall 9 / D-03). Use only `from datetime import date, datetime` for type annotations.
2. **DO NOT mutate `succ` or `pred` directly** — they are frozen+slots dataclasses (Pitfall 2). All updates accumulate in `new_dates_by_id`.
3. **Frontier-stop = NOT counted** — when `shift_days == 0`, do NOT add to `affected` (Pitfall 3).
4. **Sort neighbors before iterating** — `sorted(adj.successors_of(node_id))` keeps test assertions deterministic (Pitfall 4).
5. **`_walk_forward` and `_walk_backward` re-enqueue on a larger shift** — the merge case (TEST-06) reaches a successor twice; the second visit may need to bump the shift further. The `else` branch (`if pred_id in affected: ...`) handles this. Without it, TEST-06 with asymmetric merge cases could under-shift.
6. **`KeyError` on `work_items_by_id[dragged_id]`** is intentional — it's a Phase 3 programmer-error contract (the dragged item MUST be in the dict; a missing key is unrecoverable).
   </action>
   <acceptance_criteria> - `apps/api/plane/app/services/timeline_propagation/propagation.py` is at least 200 lines (was a 30-line STUB after Plan 02-01). - `grep -c "raise NotImplementedError" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 0 (STUB removed). - `grep -cE "^def (propagate_move|_walk_forward|_walk_backward|_ok|_fail)\(" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 5 (one public function + four underscore-prefixed helpers, mirroring graph.py convention). - `grep -c "from collections import deque" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 1 (RESEARCH.md Open Question 7 — module-top import). - `grep -cE "from datetime import .*timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 0 (Pitfall 9 / D-03 — no `timedelta` import). - `grep -c "from .scheduling import" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 1 (D-03 — date math routes through scheduling). - `grep -c "LIMIT = 100" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 1 (D-11). - `cd apps/api && python -c "from plane.app.services.timeline_propagation import propagate_move; assert callable(propagate_move)"` exits 0. - The Plan 02-01 STUB-raise test (`test_propagate_move_stub_raises_not_implemented`) is REMOVED in Task 2 — it MUST not appear after T2 is complete; this acceptance criterion is checked again in T2.
   </acceptance_criteria>
   <automated>cd apps/api && python -c "from plane.app.services.timeline_propagation import propagate_move; assert callable(propagate_move) and propagate_move.**name** == 'propagate_move'" && grep -E "from datetime import .\*timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py | wc -l | grep -q "^0$"</automated>
   <requirements>PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-09, PROP-12, PROP-13</requirements>
   </task>

<task id="02-02-T2">
  <title>Task 2: Replace test_propagation.py STUB test with the 11 PRD-pinned cases + auxiliary edge-case suite (≥27 tests)</title>
  <read_first>
    - apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py (the scaffold from Plan 02-01 — KEEP `TestErrorsModule` and `TestPublicSurface`; REMOVE the placeholder `test_propagate_move_stub_raises_not_implemented`; ADD all the test classes listed in the docstring)
    - apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py (lines 391-407 — pure-no-DB test class shape Phase 2 mirrors; lines 333-347 — `TestLoadPrecedenceGraphEmpty` empty-input pattern)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-RESEARCH.md §"Test Case Map" (the 11 PRD-pinned tests with exact input/expected fixtures) and §"Auxiliary tests" (the 11 edge-case tests pinning D-06/D-07/D-08/D-10/D-11)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-VALIDATION.md (per-task verification map — the 27 test name list + automated commands)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-PATTERNS.md §6 ("test_propagation.py NEW") — class-naming convention (`TestRightwardPropagation`, `TestLeftwardPropagation`, etc.) and module-level `_make_*` helper pattern
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md §D-13 (test fixture style) and §"Specifics" (validation-order assertion + limit boundary test commitments)
  </read_first>
  <action>
Replace `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` ENTIRELY with the file below. **Keep `TestErrorsModule` and `TestPublicSurface` from Plan 02-01** (do not delete them — they remain the regression guards for the typed contract). **Remove `test_propagate_move_stub_raises_not_implemented`** (the algorithm now exists). Add all the algorithmic test classes.

The fixtures use module-level `_make_*` helpers (per PATTERNS.md §6 — there is no in-tree precedent for per-package conftest, and per CONTEXT.md D-13 hand-built dataclass literals are preferred over fixtures).

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.propagate_move`.

Pure-Python tests — NO `@pytest.mark.django_db` (CONTEXT.md D-13). Hand-built
in-memory `Adjacency` / `LoadResult` / `ScheduledWorkItem` / `MoveIntent`
literals; no factory_boy.

Coverage map (CONTEXT.md D-NN / RESEARCH.md test case map):
  TestErrorsModule              → D-05 (PropagationErrorCode 7-value StrEnum)
  TestPublicSurface             → D-12 (propagate_move + value types re-exports)
  TestNoViolationMove           → TEST-01 / PROP-03 (D-01, D-04)
  TestRightwardPropagation      → TEST-02 / PROP-04 + PROP-09 (D-01, D-02)
  TestLeftwardPropagation       → TEST-03 / PROP-05 + PROP-09 (D-01, D-02)
  TestTransitiveChain           → TEST-04 / PROP-06 (D-01)
  TestSplitBranches             → TEST-05 / PROP-06 (D-01)
  TestMergeBranches             → TEST-06 / PROP-06 (D-01, D-02)
  TestGapPreservation           → TEST-07 / PROP-07 (D-01)
  TestExactBoundaryAdjacency    → TEST-08 / PROP-10 (D-02)
  TestIncompleteSchedule        → TEST-09 / PROP-17 (D-09)
  TestPropagationLimit          → TEST-12 / PROP-13 (D-11) + 100/101 boundary
  TestInvalidDateRange          → TEST-14 / PROP-08 (D-06 step 1)
  TestCycleFailFast             → D-07 fail-fast regardless of reachability
  TestCrossProjectReachable     → D-10 reachability-based PROJECT_BOUNDARY_EXCEEDED
  TestStaleSchedule             → D-08 dragged-only stale check
  TestNoOpMove                  → D-01 delta=0 idempotent return
  TestValidationOrder           → D-06 fixed early-return order
"""

# Python imports
from collections.abc import Mapping
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    Adjacency,
    Edge,
    LoadResult,
    MoveIntent,
    PropagationErrorCode,
    PropagationFailure,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemUpdate,
    propagate_move,
)


# --------------------------------------------------------------------------
# In-memory fixture builders (D-13 pure dataclass construction, no fixtures)
# --------------------------------------------------------------------------


_FIXED_NOW = datetime(2026, 5, 4, 12, 0, 0, tzinfo=timezone.utc)


def _make_scheduled(
    item_id: UUID,
    project_id: UUID,
    *,
    start: date | None,
    target: date | None,
    updated_at: datetime = _FIXED_NOW,
) -> ScheduledWorkItem:
    return ScheduledWorkItem(
        id=item_id,
        project_id=project_id,
        start_date=start,
        target_date=target,
        updated_at=updated_at,
    )


def _make_adjacency(
    *,
    successors: dict[UUID, set[UUID]] | None = None,
    nodes: set[UUID] | None = None,
    cross_project_edges: tuple[Edge, ...] = (),
) -> Adjacency:
    """Build an Adjacency from forward edges; predecessors are derived for symmetry."""
    successors = successors or {}
    predecessors_mut: dict[UUID, set[UUID]] = {}
    for pred, succs in successors.items():
        for s in succs:
            predecessors_mut.setdefault(s, set()).add(pred)
    all_nodes: set[UUID] = set(nodes or set())
    for pred, succs in successors.items():
        all_nodes.add(pred)
        all_nodes.update(succs)
    return Adjacency(
        successors={k: frozenset(v) for k, v in successors.items()},
        predecessors={k: frozenset(v) for k, v in predecessors_mut.items()},
        nodes=frozenset(all_nodes),
        cross_project_edges=cross_project_edges,
    )


def _make_load_result(
    adjacency: Adjacency,
    *,
    cycle: tuple[UUID, ...] | None = None,
) -> LoadResult:
    return LoadResult(adjacency=adjacency, cycle=cycle)


def _make_intent(
    work_item_id: UUID,
    *,
    original_start: date,
    original_target: date,
    requested_start: date,
    requested_target: date,
) -> MoveIntent:
    return MoveIntent(
        work_item_id=work_item_id,
        original_start_date=original_start,
        original_target_date=original_target,
        requested_start_date=requested_start,
        requested_target_date=requested_target,
    )


def _make_versions(work_item_id: UUID, value: datetime = _FIXED_NOW) -> Mapping[UUID, datetime]:
    return {work_item_id: value}


# --------------------------------------------------------------------------
# TestErrorsModule + TestPublicSurface (kept verbatim from Plan 02-01)
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestErrorsModule:
    """PropagationErrorCode is a 7-value StrEnum in canonical order (D-05)."""

    def test_seven_str_enum_codes_present_in_canonical_order(self):
        expected = [
            "DEPENDENCY_CYCLE",
            "PROJECT_BOUNDARY_EXCEEDED",
            "INCOMPLETE_SCHEDULE",
            "PROPAGATION_LIMIT_EXCEEDED",
            "SCHEDULE_CHANGED",
            "PERMISSION_DENIED",
            "INVALID_DATE_RANGE",
        ]
        assert [c.value for c in PropagationErrorCode] == expected
        for value in expected:
            assert PropagationErrorCode(value).value == value

    def test_propagation_failure_defaults_for_optional_fields(self):
        failure = PropagationFailure(
            code=PropagationErrorCode.DEPENDENCY_CYCLE,
            message="diagnostic",
        )
        assert failure.work_item_id is None
        assert failure.cycle is None


@pytest.mark.unit
class TestPublicSurface:
    """The Phase 2 public surface is importable through the package barrel (D-12)."""

    def test_init_exports_propagate_move_and_value_types(self):
        assert callable(propagate_move)
        assert MoveIntent.__dataclass_params__.frozen is True
        assert ScheduledWorkItem.__dataclass_params__.frozen is True
        assert WorkItemUpdate.__dataclass_params__.frozen is True
        assert PropagationResult.__dataclass_params__.frozen is True

    def test_init_re_exports_scheduling_helpers(self):
        from plane.app.services import timeline_propagation as pkg

        for name in (
            "add_calendar_days",
            "boundary_violation",
            "is_valid_range",
            "next_valid_start",
            "previous_valid_target",
            "range_duration",
        ):
            assert hasattr(pkg, name)


# --------------------------------------------------------------------------
# TEST-01 (PROP-03): no-violation move updates only the dragged item
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestNoViolationMove:
    """A move that does not violate any boundary returns one update only (TEST-01)."""

    def test_TEST_01_only_dragged_item_updated(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # A → B with B far in the future (huge gap)
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 6, 1), target=date(2026, 6, 5)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),  # +3 days; B still far
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert result.failure is None
        assert len(result.updates) == 1
        assert result.updates[0].id == a
        assert result.updates[0].start_date == date(2026, 5, 7)
        assert result.updates[0].target_date == date(2026, 5, 9)
        assert result.total_updated_count == 1


# --------------------------------------------------------------------------
# TEST-02 (PROP-04 + PROP-09): rightward propagation to one successor
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestRightwardPropagation:
    """Rightward move forces adjacent successor to shift by minimum amount (TEST-02)."""

    def test_TEST_02_single_successor_shift(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # A.target=2026-05-06, B.start=2026-05-07 (adjacent). Shift A right by 3 days.
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 7), target=date(2026, 5, 10)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),  # +3 days
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 2
        # Order: dragged first
        assert result.updates[0].id == a
        # B shifts by 3 days; duration preserved (PROP-09: 3 days)
        b_update = result.updates[1]
        assert b_update.id == b
        assert b_update.start_date == date(2026, 5, 10)  # 7 + 3
        assert b_update.target_date == date(2026, 5, 13)  # 10 + 3


# --------------------------------------------------------------------------
# TEST-03 (PROP-05 + PROP-09): leftward propagation to one predecessor
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestLeftwardPropagation:
    """Leftward move forces adjacent predecessor to shift backward (TEST-03)."""

    def test_TEST_03_single_predecessor_shift(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # A.target=2026-05-06, B.start=2026-05-07 (adjacent). Shift B left by 3 days.
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 7), target=date(2026, 5, 10)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            b,
            original_start=date(2026, 5, 7),
            original_target=date(2026, 5, 10),
            requested_start=date(2026, 5, 4),  # -3 days
            requested_target=date(2026, 5, 7),
        )
        result = propagate_move(graph, items, intent, _make_versions(b))

        assert result.is_success
        assert len(result.updates) == 2
        assert result.updates[0].id == b
        a_update = result.updates[1]
        assert a_update.id == a
        # A shifts left by 3 days; duration preserved
        assert a_update.start_date == date(2026, 5, 1)  # 4 - 3
        assert a_update.target_date == date(2026, 5, 3)  # 6 - 3


# --------------------------------------------------------------------------
# TEST-04 (PROP-06): transitive chain rightward
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestTransitiveChain:
    """A→B→C all adjacent; drag A right by 5 days; all three shift (TEST-04)."""

    def test_TEST_04_three_node_chain_full_shift(self):
        proj = uuid4()
        a, b, c = uuid4(), uuid4(), uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 1), target=date(2026, 5, 3)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            c: _make_scheduled(c, proj, start=date(2026, 5, 7), target=date(2026, 5, 9)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}, b: {c}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 1),
            original_target=date(2026, 5, 3),
            requested_start=date(2026, 5, 6),  # +5
            requested_target=date(2026, 5, 8),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 3
        by_id = {u.id: u for u in result.updates}
        # A shifted +5
        assert by_id[a].start_date == date(2026, 5, 6)
        assert by_id[a].target_date == date(2026, 5, 8)
        # B shifted +5 (PROP-09 duration preserved: 2 days)
        assert by_id[b].start_date == date(2026, 5, 9)
        assert by_id[b].target_date == date(2026, 5, 11)
        # C shifted +5 (PROP-09 duration preserved: 2 days)
        assert by_id[c].start_date == date(2026, 5, 12)
        assert by_id[c].target_date == date(2026, 5, 14)


# --------------------------------------------------------------------------
# TEST-05 (PROP-06): split successor branches
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestSplitBranches:
    """A→B and A→C both adjacent; drag A right; both shift (TEST-05)."""

    def test_TEST_05_split_successor_branches_each_shifted(self):
        proj = uuid4()
        a, b, c = uuid4(), uuid4(), uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 1), target=date(2026, 5, 3)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            c: _make_scheduled(c, proj, start=date(2026, 5, 4), target=date(2026, 5, 8)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b, c}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 1),
            original_target=date(2026, 5, 3),
            requested_start=date(2026, 5, 5),  # +4
            requested_target=date(2026, 5, 7),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 3
        by_id = {u.id: u for u in result.updates}
        assert by_id[b].start_date == date(2026, 5, 8)  # 4 + 4
        assert by_id[b].target_date == date(2026, 5, 10)
        assert by_id[c].start_date == date(2026, 5, 8)  # 4 + 4
        assert by_id[c].target_date == date(2026, 5, 12)


# --------------------------------------------------------------------------
# TEST-06 (PROP-06): merge predecessor branches
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestMergeBranches:
    """A→C and B→C; drag A right; only A and C move (B unchanged — Pitfall 5) (TEST-06)."""

    def test_TEST_06_merge_predecessor_branches_only_visited_preds_constrain(self):
        proj = uuid4()
        a, b, c = uuid4(), uuid4(), uuid4()
        # Both A and B end on 2026-05-06; C starts 2026-05-07 (adjacent to both).
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            c: _make_scheduled(c, proj, start=date(2026, 5, 7), target=date(2026, 5, 10)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {c}, b: {c}}))
        # Drag A right by 7 days; B is NOT walked (we walk forward from A only).
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 11),  # +7
            requested_target=date(2026, 5, 13),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        # Only A and C move; B is NOT in updates
        ids = {u.id for u in result.updates}
        assert a in ids
        assert c in ids
        assert b not in ids
        assert len(result.updates) == 2
        c_update = next(u for u in result.updates if u.id == c)
        # required_start = max(P_visited.target) + 1 = A.new_target(13) + 1 = 14
        assert c_update.start_date == date(2026, 5, 14)
        # PROP-09 duration preserved (3 days)
        assert c_update.target_date == date(2026, 5, 17)


# --------------------------------------------------------------------------
# TEST-07 (PROP-07): gap preservation
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestGapPreservation:
    """Pre-existing gap is preserved when no boundary violation (TEST-07)."""

    def test_TEST_07_existing_gap_not_compressed(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # 10-day gap between A.target and B.start
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 1), target=date(2026, 5, 3)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 13), target=date(2026, 5, 15)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        # Drag A right by 3 days; still leaves 7-day gap → no shift on B (frontier-stop)
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 1),
            original_target=date(2026, 5, 3),
            requested_start=date(2026, 5, 4),
            requested_target=date(2026, 5, 6),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 1  # Only A; B is frontier-stopped (Pitfall 3)
        assert result.updates[0].id == a


# --------------------------------------------------------------------------
# TEST-08 (PROP-10): exact boundary adjacency is valid (not a violation)
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestExactBoundaryAdjacency:
    """succ.start == pred.target + 1 is the canonical adjacent case; valid (TEST-08)."""

    def test_TEST_08_adjacent_is_valid_not_a_violation(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # A.target = 2026-05-06; B.start = 2026-05-07 (exactly adjacent)
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 7), target=date(2026, 5, 9)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        # No-op move on A (delta=0) — just confirming adjacency is not a violation.
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 4),
            requested_target=date(2026, 5, 6),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 1  # Only A (delta=0 no-op short-circuit)
        # B is NOT shifted because adjacency is valid (boundary_violation = False at +1)


# --------------------------------------------------------------------------
# TEST-09 (PROP-17): incomplete schedule on reachable node
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestIncompleteSchedule:
    """Missing dates on a reachable node returns INCOMPLETE_SCHEDULE (TEST-09 / D-09 lazy)."""

    def test_TEST_09_missing_dates_on_reachable_node_fails(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 7), target=None),  # missing
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 10),  # forces B to need to move
            requested_target=date(2026, 5, 12),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure is not None
        assert result.failure.code == PropagationErrorCode.INCOMPLETE_SCHEDULE
        assert result.failure.work_item_id == b
        assert result.updates == ()  # PROP-12 all-or-nothing
        assert result.total_updated_count == 0

    def test_incomplete_dragged_item_returns_incomplete_schedule_eager(self):
        """D-06 step 3: dragged item missing dates is detected EAGERLY before the walk."""
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=None, target=None),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 5),
            requested_target=date(2026, 5, 7),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.INCOMPLETE_SCHEDULE
        assert result.failure.work_item_id == a


# --------------------------------------------------------------------------
# TEST-12 (PROP-13): 100-item limit
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestPropagationLimit:
    """Distinct affected count > 100 returns PROPAGATION_LIMIT_EXCEEDED (TEST-12 / D-11)."""

    def _build_chain(self, length: int) -> tuple[LoadResult, dict[UUID, ScheduledWorkItem], list[UUID]]:
        proj = uuid4()
        ids = [uuid4() for _ in range(length)]
        # A1 → A2 → ... → AN, all adjacent (gap = 1 day, so adjacent at +1)
        items: dict[UUID, ScheduledWorkItem] = {}
        successors: dict[UUID, set[UUID]] = {}
        start = date(2026, 1, 1)
        for i, item_id in enumerate(ids):
            items[item_id] = _make_scheduled(
                item_id, proj,
                start=date(2026, 1, 1 + 2 * i),
                target=date(2026, 1, 2 + 2 * i),
            )
            if i < length - 1:
                successors[item_id] = {ids[i + 1]}
        graph = _make_load_result(_make_adjacency(successors=successors))
        return graph, items, ids

    def test_TEST_12_at_101_distinct_affected_fails(self):
        # Chain of 101 nodes, all adjacent; drag A1 right by 1 day forces all 101 to shift.
        graph, items, ids = self._build_chain(101)
        first = ids[0]
        intent = _make_intent(
            first,
            original_start=items[first].start_date,
            original_target=items[first].target_date,
            requested_start=items[first].start_date.replace(day=items[first].start_date.day + 1) if items[first].start_date.day < 28 else items[first].start_date,
            requested_target=items[first].target_date.replace(day=items[first].target_date.day + 1) if items[first].target_date.day < 28 else items[first].target_date,
        )
        # The .replace tricks above are fragile around month boundaries; use safer arithmetic:
        from datetime import timedelta as _td  # local import for TEST fixture only — production code is forbidden from this
        intent = _make_intent(
            first,
            original_start=items[first].start_date,
            original_target=items[first].target_date,
            requested_start=items[first].start_date + _td(days=1),
            requested_target=items[first].target_date + _td(days=1),
        )
        result = propagate_move(graph, items, intent, _make_versions(first))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED
        assert result.failure.work_item_id is None  # graph-level outcome
        assert result.updates == ()

    def test_at_100_distinct_affected_succeeds(self):
        # Chain of 100 nodes; drag A1 right by 1 day forces all 100 to shift; len(affected) == 100.
        from datetime import timedelta as _td
        graph, items, ids = self._build_chain(100)
        first = ids[0]
        intent = _make_intent(
            first,
            original_start=items[first].start_date,
            original_target=items[first].target_date,
            requested_start=items[first].start_date + _td(days=1),
            requested_target=items[first].target_date + _td(days=1),
        )
        result = propagate_move(graph, items, intent, _make_versions(first))

        assert result.is_success
        assert result.total_updated_count == 100


# --------------------------------------------------------------------------
# TEST-14 (PROP-08): invalid date range
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestInvalidDateRange:
    """Invalid range or duration mismatch returns INVALID_DATE_RANGE (TEST-14 / D-06 step 1)."""

    def test_TEST_14_target_before_start_fails(self):
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 10),
            requested_target=date(2026, 5, 5),  # target before start
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.INVALID_DATE_RANGE
        assert result.failure.work_item_id == a
        assert result.updates == ()

    def test_duration_mismatch_fails_with_invalid_date_range(self):
        """PROP-08: requested duration must equal original duration; algorithm rejects resize."""
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),  # original duration = 2 days
            requested_start=date(2026, 5, 10),
            requested_target=date(2026, 5, 15),  # requested duration = 5 days (mismatch)
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.INVALID_DATE_RANGE


# --------------------------------------------------------------------------
# D-07: cycle pre-check fail-fast regardless of reachability
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestCycleFailFast:
    """LoadResult.cycle is not None → DEPENDENCY_CYCLE regardless of reachability (D-07)."""

    def test_load_result_cycle_short_circuits_regardless_of_reachability(self):
        proj = uuid4()
        a = uuid4()
        x, y, z = uuid4(), uuid4(), uuid4()
        # Cycle on a disconnected component (X→Y→Z→X); drag a leaf A unrelated to the cycle.
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        adj = _make_adjacency(nodes={a, x, y, z})
        # Hand-build a cycle path tuple (a closed path: last == first).
        cycle_path = (x, y, z, x)
        graph = _make_load_result(adj, cycle=cycle_path)
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.DEPENDENCY_CYCLE
        # Pitfall 12: cycle path is forwarded verbatim
        assert result.failure.cycle == cycle_path
        assert result.updates == ()


# --------------------------------------------------------------------------
# D-10: cross-project reachability
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestCrossProjectReachable:
    """PROJECT_BOUNDARY_EXCEEDED fires only when reachable (D-10)."""

    def test_reachable_cross_project_edge_fails(self):
        proj = uuid4()
        a = uuid4()
        foreign = uuid4()
        relation_id = uuid4()
        # Cross-project edge from A to a foreign issue.
        cross_edge = Edge(
            predecessor_id=a,
            successor_id=foreign,
            source_relation_id=relation_id,
            cross_project=True,
        )
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        adj = _make_adjacency(nodes={a}, cross_project_edges=(cross_edge,))
        graph = _make_load_result(adj)
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),  # rightward; A is reachable
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED
        assert result.failure.work_item_id == a
        assert result.updates == ()

    def test_unreachable_cross_project_edge_succeeds(self):
        proj = uuid4()
        a = uuid4()
        unrelated = uuid4()
        foreign = uuid4()
        relation_id = uuid4()
        # Cross-project edge from an UNRELATED node (not the dragged item, not its reachable subgraph).
        cross_edge = Edge(
            predecessor_id=unrelated,
            successor_id=foreign,
            source_relation_id=relation_id,
            cross_project=True,
        )
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        # 'unrelated' appears only in cross_project_edges; A's reachable subgraph is empty.
        adj = _make_adjacency(nodes={a, unrelated}, cross_project_edges=(cross_edge,))
        graph = _make_load_result(adj)
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success  # cross-project edge is unreachable from A
        assert len(result.updates) == 1
        assert result.updates[0].id == a


# --------------------------------------------------------------------------
# D-08: dragged-only stale schedule check
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestStaleSchedule:
    """SCHEDULE_CHANGED fires only on dragged-item updated_at mismatch (D-08)."""

    def test_dragged_item_updated_at_mismatch_fails(self):
        proj = uuid4()
        a = uuid4()
        actual = datetime(2026, 5, 4, 12, 0, 0, tzinfo=timezone.utc)
        stale = datetime(2026, 5, 4, 11, 0, 0, tzinfo=timezone.utc)  # 1h older
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6), updated_at=actual),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, {a: stale})

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.SCHEDULE_CHANGED
        assert result.failure.work_item_id == a

    def test_untouched_neighbor_updated_at_difference_does_not_fail(self):
        """Pitfall 7 / D-08: only the dragged item's updated_at is compared."""
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        actual = datetime(2026, 5, 4, 12, 0, 0, tzinfo=timezone.utc)
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6), updated_at=actual),
            b: _make_scheduled(b, proj, start=date(2026, 6, 1), target=date(2026, 6, 5), updated_at=actual),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),  # B still far in future, no shift
            requested_target=date(2026, 5, 9),
        )
        # expected_versions has a STALE neighbor entry — but it's NOT compared.
        result = propagate_move(graph, items, intent, {a: actual, b: datetime(2020, 1, 1, tzinfo=timezone.utc)})

        assert result.is_success  # neighbor's updated_at mismatch is ignored

    def test_missing_dragged_id_in_expected_versions_returns_schedule_changed(self):
        """RESEARCH.md Open Question 2: missing key falls through to SCHEDULE_CHANGED via .get(...)."""
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 9),
        )
        # expected_versions is EMPTY — .get(dragged_id) returns None, mismatch fires.
        result = propagate_move(graph, items, intent, {})

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.SCHEDULE_CHANGED


# --------------------------------------------------------------------------
# D-01: delta == 0 no-op short-circuit
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestNoOpMove:
    """delta == 0 returns one update (the dragged item) and skips the walk (D-01)."""

    def test_delta_zero_returns_single_update_no_traversal(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        # B adjacent to A; drag A with requested == original (delta = 0).
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
            b: _make_scheduled(b, proj, start=date(2026, 5, 7), target=date(2026, 5, 10)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 4),
            requested_target=date(2026, 5, 6),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert len(result.updates) == 1
        assert result.updates[0].id == a


# --------------------------------------------------------------------------
# D-06: validation order — INVALID_DATE_RANGE beats DEPENDENCY_CYCLE
# --------------------------------------------------------------------------


@pytest.mark.unit
class TestValidationOrder:
    """D-06 fixed early-return order: INVALID_DATE_RANGE precedes DEPENDENCY_CYCLE."""

    def test_invalid_range_short_circuits_before_cycle(self):
        proj = uuid4()
        a = uuid4()
        x, y = uuid4(), uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        # Cycle exists in the graph (X→Y→X) AND requested range is invalid.
        adj = _make_adjacency(nodes={a, x, y})
        graph = _make_load_result(adj, cycle=(x, y, x))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 10),
            requested_target=date(2026, 5, 5),  # invalid: target < start
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        assert result.failure.code == PropagationErrorCode.INVALID_DATE_RANGE  # NOT DEPENDENCY_CYCLE
```

**Critical implementation notes for the executor:**

1. **REMOVE the placeholder `test_propagate_move_stub_raises_not_implemented`** test from Plan 02-01 — the algorithm now exists; the placeholder is obsolete and would FAIL.
2. The `test_propagation_limit_at_101_fails` test does have an `import timedelta` inside the test body (with comment marking it as test-only). This is allowed in TEST files because Plan 02-03's lint-grep test scopes the `timedelta` ban to `propagation.py` ONLY (not test files). Test code may use `timedelta` for fixture arithmetic; production code may not.
3. All test bodies use Arrange / Act / Assert layout per Phase 1 convention.
4. Determinism: tests assert on `result.updates[0].id == a` (the dragged item is FIRST per `_ok` ordering) and use `by_id = {u.id: u for u in result.updates}` for non-positional assertions.
   </action>
   <acceptance_criteria> - `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` does NOT contain `test_propagate_move_stub_raises_not_implemented` — `grep -c "test_propagate_move_stub_raises_not_implemented" apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` returns 0. - `grep -cE "^class Test(NoViolationMove|RightwardPropagation|LeftwardPropagation|TransitiveChain|SplitBranches|MergeBranches|GapPreservation|ExactBoundaryAdjacency|IncompleteSchedule|PropagationLimit|InvalidDateRange|CycleFailFast|CrossProjectReachable|StaleSchedule|NoOpMove|ValidationOrder):" apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` returns 16. - The 11 PRD-pinned tests are GREEN — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestNoViolationMove::test_TEST_01_only_dragged_item_updated" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestRightwardPropagation::test_TEST_02_single_successor_shift" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestLeftwardPropagation::test_TEST_03_single_predecessor_shift" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestTransitiveChain::test_TEST_04_three_node_chain_full_shift" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestSplitBranches::test_TEST_05_split_successor_branches_each_shifted" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestMergeBranches::test_TEST_06_merge_predecessor_branches_only_visited_preds_constrain" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestGapPreservation::test_TEST_07_existing_gap_not_compressed" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestExactBoundaryAdjacency::test_TEST_08_adjacent_is_valid_not_a_violation" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestIncompleteSchedule::test_TEST_09_missing_dates_on_reachable_node_fails" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestPropagationLimit::test_TEST_12_at_101_distinct_affected_fails" "plane/tests/unit/services/timeline_propagation/test_propagation.py::TestInvalidDateRange::test_TEST_14_target_before_start_fails" -q` exits 0. - The auxiliary edge-case tests are GREEN — full file run: `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_propagation.py -q` exits 0 with at least 27 tests collected. - NO `@pytest.mark.django_db` anywhere in `test_propagation.py` — `grep -c "django_db" apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` returns 0 (D-13). - Phase 1 tests still GREEN — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -q` exits 0 (regression guard). - Plan 02-01 scheduling tests still GREEN — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_scheduling.py -q` exits 0.
   </acceptance_criteria>
   <automated>cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_propagation.py -q</automated>
   <requirements>PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-09, PROP-12, PROP-13, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09, TEST-12, TEST-14</requirements>
   </task>

## Verification

**Per-task verification** is pinned in each task's `<automated>` block.

**Plan-level verification (after both tasks complete):**

```bash
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/ -q
```

Expected: ALL Phase 1 tests still green + 12 scheduling tests green (Plan 02-01) + ≥27 propagation tests green (Plans 02-01 scaffold + 02-02 algorithm). Total Phase 2 tests: ~45 green.

**Regression guard:**

```bash
cd apps/api && python run_tests.py -u
```

Pre-existing unit-suite failures in `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py` are out-of-scope per `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md` — verify the count of pre-existing failures has NOT increased after this plan.

## Success Criteria

- All 11 PRD-pinned tests (TEST-01..TEST-09, TEST-12, TEST-14) GREEN.
- All 16 auxiliary edge-case tests GREEN.
- `propagate_move(...)` callable from the package barrel and producing correct `PropagationResult` for every TEST-NN fixture.
- Phase 1 tests + Plan 02-01 scheduling tests unaffected (no regression).
- `propagation.py` does NOT import `timedelta` directly (Plan 02-03 enforces this with lint-grep; this plan honors it manually).

## Output

After completion, create `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-02-SUMMARY.md` documenting:

- Files modified (propagation.py + test_propagation.py).
- Test counts: 11 PRD-pinned GREEN + 16 auxiliary GREEN + 4 from Plan 02-01 = 31 total in `test_propagation.py`.
- All 24 Phase 2 requirements addressed (PROP-03..PROP-14 algorithm-side + PROP-17 + 11 TEST-NN).
- Phase 3 hand-off notes: `bulk_update` + `auto_now` interaction (RESEARCH.md Pitfall 10) — Phase 3 plan-phase MUST decide between (a) explicit `updated_at = timezone.now()` + extended `bulk_update` field list, (b) follow-up `Issue.objects.filter(...).update(updated_at=...)`, or (c) accept existing convention.

<threat_model>
**ASVS L1 surface:** none (pure-Python algorithm; no auth boundary, no SQL, no network, no PII, no untrusted input).
**Indirect contributions:** the `PROPAGATION_LIMIT_EXCEEDED` failure path implemented here (D-11) is a denial-of-service control — caps work at 100 distinct affected items per propagation, eagerly enforced after each insertion (Pitfall 8) so pathological graphs cannot run unbounded compute. The cycle pre-check (D-07) also bounds compute by failing fast on any cyclic project graph before the BFS walk starts.
**Phase 3 hand-off:** authentication, authorization (`PERMISSION_DENIED` is declared in `errors.py` for symmetry but is RAISED only by Phase 3's viewset), CSRF, request body validation at the HTTP boundary, and `transaction.atomic` rollback semantics are owned by the Phase 3 viewset, not Phase 2.
</threat_model>
