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
    4. SCHEDULE_CHANGED   — dragged item's current schedule no longer matches
       the drag-start original dates (D-08 dragged-only)
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
    start_for_working_duration,
    target_for_working_duration,
    working_day_target_on_or_before,
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
    dragged_duration = None
    dragged_snapshot = work_items_by_id.get(dragged_id)
    if dragged_snapshot is not None:
        dragged_duration = dragged_snapshot.planned_duration_working_days

    effective_requested_target_date = move_intent.requested_target_date
    if dragged_duration is not None:
        effective_requested_target_date = target_for_working_duration(
            move_intent.requested_start_date,
            dragged_duration,
        )
    elif range_duration(move_intent.original_start_date, move_intent.original_target_date) != range_duration(
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
    expected_updated_at = expected_versions.get(dragged_id)
    has_schedule_changed_since_drag_start = (
        dragged.start_date != move_intent.original_start_date or dragged.target_date != move_intent.original_target_date
    )
    if expected_updated_at is None or has_schedule_changed_since_drag_start:
        return _fail(
            dragged_id,
            PropagationErrorCode.SCHEDULE_CHANGED,
            message="schedule changed since drag started (dragged item date range mismatch)",
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
        dragged_id: (move_intent.requested_start_date, effective_requested_target_date),
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
            new_target = _target_after_start_shift(succ, new_start, shift_days)

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

            if pred.planned_duration_working_days is not None:
                # Working-day durations only round-trip through working-day
                # targets; pulling back to Friday still satisfies
                # `target <= required_target`.
                new_target = working_day_target_on_or_before(new_target)
                shift_days = (pred.target_date - new_target).days

            new_start = _start_before_target_shift(pred, new_target, shift_days)

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
                # Already visited — update dates if a new visit produced a smaller shift
                # (merge case: re-process when a later successor demands a further pullback)
                _, existing_target = new_dates_by_id[pred_id]
                if new_target < existing_target:
                    new_dates_by_id[pred_id] = (new_start, new_target)
                    frontier.append(pred_id)

    return None  # success


def _target_after_start_shift(item: ScheduledWorkItem, new_start: date, shift_days: int) -> date:
    if item.planned_duration_working_days is not None:
        return target_for_working_duration(new_start, item.planned_duration_working_days)
    if item.target_date is None:
        raise ValueError("target_date is required")
    return add_calendar_days(item.target_date, shift_days)


def _start_before_target_shift(item: ScheduledWorkItem, new_target: date, shift_days: int) -> date:
    if item.planned_duration_working_days is not None:
        return start_for_working_duration(new_target, item.planned_duration_working_days)
    if item.start_date is None:
        raise ValueError("start_date is required")
    return add_calendar_days(item.start_date, -shift_days)


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
            planned_duration_working_days=work_items_by_id[dragged_id].planned_duration_working_days,
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
                planned_duration_working_days=work_items_by_id[other_id].planned_duration_working_days,
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
