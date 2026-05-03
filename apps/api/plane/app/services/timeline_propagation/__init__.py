# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Precedence graph loader & normalization for Timeline Dependency Schedule Propagation.

Pure-Python service module — no DRF / no HTTP / no transactions.
Consumed by `propagate_move` (Phase 2) and the Phase 3 DRF view.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .graph import load_precedence_graph
from .types import Adjacency, Edge, LoadResult, WorkItemNode

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "WorkItemNode",
    "load_precedence_graph",
]
