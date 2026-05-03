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
        """The 7 canonical wire codes appear in this exact order (D-05 / API-06)."""
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
        # StrEnum: each member equals its string value (allows JSON serialization)
        for value in expected:
            assert PropagationErrorCode(value).value == value

    def test_propagation_failure_defaults_for_optional_fields(self):
        """PropagationFailure(code, message) leaves work_item_id and cycle as None (D-05)."""
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
        """`from plane.app.services.timeline_propagation import propagate_move, ...` works (D-12)."""
        # If the import at the top of this file failed, pytest would already be RED.
        # This test pins the public surface as an explicit assertion.
        assert callable(propagate_move)
        assert MoveIntent.__dataclass_params__.frozen is True
        assert ScheduledWorkItem.__dataclass_params__.frozen is True
        assert WorkItemUpdate.__dataclass_params__.frozen is True
        assert PropagationResult.__dataclass_params__.frozen is True

    def test_init_re_exports_scheduling_helpers(self):
        """All six scheduling helpers are re-exported from the package barrel (Claude's Discretion bullet 4)."""
        from plane.app.services import timeline_propagation as pkg

        for name in (
            "add_calendar_days",
            "boundary_violation",
            "is_valid_range",
            "next_valid_start",
            "previous_valid_target",
            "range_duration",
        ):
            assert hasattr(pkg, name), f"missing scheduling helper export: {name}"


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
        from datetime import timedelta as _td
        proj = uuid4()
        ids = [uuid4() for _ in range(length)]
        # A1 → A2 → ... → AN, all adjacent (target + 1 = next start).
        # Use timedelta for date arithmetic to avoid month-overflow (January only has 31 days;
        # 100+ nodes each spanning 2 days would overflow day=202 in January).
        items: dict[UUID, ScheduledWorkItem] = {}
        successors: dict[UUID, set[UUID]] = {}
        base = date(2026, 1, 1)
        for i, item_id in enumerate(ids):
            item_start = base + _td(days=2 * i)
            item_target = item_start + _td(days=1)  # 2-day span
            items[item_id] = _make_scheduled(
                item_id, proj,
                start=item_start,
                target=item_target,
            )
            if i < length - 1:
                successors[item_id] = {ids[i + 1]}
        graph = _make_load_result(_make_adjacency(successors=successors))
        return graph, items, ids

    def test_TEST_12_at_101_distinct_affected_fails(self):
        """Chain of 101 nodes, all adjacent; drag A1 right by 1 day forces all 101 to shift."""
        from datetime import timedelta as _td  # test fixture only — production code is forbidden
        graph, items, ids = self._build_chain(101)
        first = ids[0]
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
        """Chain of 100 nodes; drag A1 right by 1 day forces all 100 to shift; succeeds."""
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

    def test_original_target_before_start_returns_invalid(self):
        """D-06 step 1 also validates original range."""
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(a, proj, start=date(2026, 5, 4), target=date(2026, 5, 6)),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 6),
            original_target=date(2026, 5, 4),  # original target < start — invalid
            requested_start=date(2026, 5, 10),
            requested_target=date(2026, 5, 8),  # same invalid shape
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

    def test_cycle_fires_before_incomplete_schedule_on_dragged(self):
        """D-06 step 2 before step 3: DEPENDENCY_CYCLE beats INCOMPLETE_SCHEDULE on dragged."""
        proj = uuid4()
        a = uuid4()
        x, y = uuid4(), uuid4()
        # Dragged item has None dates (would be INCOMPLETE_SCHEDULE at step 3)
        # Graph has a cycle (DEPENDENCY_CYCLE at step 2)
        items = {
            a: _make_scheduled(a, proj, start=None, target=None),
        }
        adj = _make_adjacency(nodes={a, x, y})
        graph = _make_load_result(adj, cycle=(x, y, x))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 4),
            original_target=date(2026, 5, 6),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 9),
        )
        result = propagate_move(graph, items, intent, _make_versions(a))

        assert not result.is_success
        # D-06 order: CYCLE (step 2) fires before INCOMPLETE on dragged (step 3)
        assert result.failure.code == PropagationErrorCode.DEPENDENCY_CYCLE
