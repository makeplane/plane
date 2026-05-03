# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.propagate_move`.

Pure-Python tests — NO `@pytest.mark.django_db` (CONTEXT.md D-13). Hand-built
in-memory `Adjacency` / `LoadResult` / `ScheduledWorkItem` / `MoveIntent`
literals; no factory_boy.

Plan 02-01 lands the typed contract + STUB only. Plan 02-02 fills in:
  TestNoViolationMove          → TEST-01 (PROP-03)
  TestRightwardPropagation     → TEST-02 (PROP-04)
  TestLeftwardPropagation      → TEST-03 (PROP-05)
  TestTransitiveChain          → TEST-04 (PROP-06)
  TestSplitBranches            → TEST-05 (PROP-06)
  TestMergeBranches            → TEST-06 (PROP-06)
  TestGapPreservation          → TEST-07 (PROP-07)
  TestExactBoundaryAdjacency   → TEST-08 (PROP-10)
  TestIncompleteSchedule       → TEST-09 (PROP-17)
  TestPropagationLimit         → TEST-12 (PROP-13)
  TestInvalidDateRange         → TEST-14 (PROP-08)
  TestCycleFailFast            → D-07
  TestCrossProjectReachable    → D-10 (PROP-16 translated)
  TestStaleSchedule            → D-08 (API-07 algorithm-side)
  TestNoOpMove                 → D-01 delta=0
  TestValidationOrder          → D-06
"""

# Python imports
from collections.abc import Mapping
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    Adjacency,
    LoadResult,
    MoveIntent,
    PropagationErrorCode,
    PropagationFailure,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemUpdate,
    propagate_move,
)


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

    def test_propagate_move_stub_raises_not_implemented(self):
        """Plan 02-01 STUB raises; Plan 02-02 makes this test RED then GREEN with the algorithm."""
        # Build minimal valid inputs so we exercise the call path (not the validation).
        dragged_id = uuid4()
        project_id = uuid4()
        empty_adj = Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset({dragged_id}),
            cross_project_edges=(),
        )
        graph = LoadResult(adjacency=empty_adj, cycle=None)
        now = datetime.now(tz=timezone.utc)
        items: Mapping[UUID, ScheduledWorkItem] = {
            dragged_id: ScheduledWorkItem(
                id=dragged_id,
                project_id=project_id,
                start_date=None,  # any value; STUB raises before reading
                target_date=None,
                updated_at=now,
            )
        }
        intent = MoveIntent(
            work_item_id=dragged_id,
            original_start_date=date(2026, 5, 4),
            original_target_date=date(2026, 5, 6),
            requested_start_date=date(2026, 5, 4),
            requested_target_date=date(2026, 5, 6),
        )
        # Note: this STUB raise is REPLACED by Plan 02-02 with a TestNoViolationMove
        # test that asserts a successful PropagationResult (TEST-01).
        with pytest.raises(NotImplementedError):
            propagate_move(graph, items, intent, {dragged_id: now})
