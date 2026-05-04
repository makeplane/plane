# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline Dependency Schedule Propagation — pure-Python service module.

Pure-Python service module — no DRF / no HTTP / no transactions. Owns the
precedence graph loader (Phase 1) and the date-range propagation algorithm
(Phase 2). The Phase 3 DRF view consumes both via the public re-exports below.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .errors import PropagationErrorCode, PropagationFailure
from .graph import load_precedence_graph
from .propagation import propagate_move
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
    WorkItemNode,
    WorkItemUpdate,
)

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "MoveIntent",
    "PropagationErrorCode",
    "PropagationFailure",
    "PropagationResult",
    "ScheduledWorkItem",
    "WorkItemNode",
    "WorkItemUpdate",
    "add_calendar_days",
    "boundary_violation",
    "is_valid_range",
    "load_precedence_graph",
    "next_valid_start",
    "previous_valid_target",
    "propagate_move",
    "range_duration",
]
