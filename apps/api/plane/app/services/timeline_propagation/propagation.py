# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Date-range schedule propagation algorithm for Timeline Dependency.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

STUB: the actual `propagate_move(...)` implementation lands in Plan 02-02.
This file exists in Plan 02-01 so `__init__.py` re-exports work without import
errors and the test scaffolding (`test_propagation.py::TestPublicSurface`)
can assert the function is importable.

Module scope (PROP-18): move-only.
"""

# Python imports
from collections.abc import Mapping
from datetime import datetime
from uuid import UUID

# Module imports
from .types import LoadResult, MoveIntent, PropagationResult, ScheduledWorkItem


def propagate_move(
    graph: LoadResult,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    move_intent: MoveIntent,
    expected_versions: Mapping[UUID, datetime],
) -> PropagationResult:
    """Compute the minimum schedule propagation for a single Work Item move.

    See CONTEXT.md D-01..D-12 for the algorithm contract. Plan 02-02 implements
    the BFS frontier walk; Plan 02-01 ships only this stub so the public
    surface (`__init__.py` re-export) and the test scaffolding compile.
    """
    raise NotImplementedError("propagate_move lands in Plan 02-02")
