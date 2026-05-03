# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Value types for the Timeline Dependency precedence graph.

Identity-and-classification types only — schedule dates, durations, and
move intent live in Phase 2's `scheduling.py` / `propagation.py`.

Design invariants (CONTEXT.md D-06, D-07):
  * All public types are frozen dataclasses with `slots=True`.
  * `Adjacency.successors_of` / `.predecessors_of` return `frozenset()` for
    unknown ids — they MUST NOT raise `KeyError` to callers (Phase 2 walks
    the graph from arbitrary moved nodes and relies on this contract).
  * `LoadResult.cycle` is `None` when the graph is a DAG; otherwise it is a
    closed path tuple (e.g., `(a, b, c, a)`) for diagnostics. The loader
    NEVER throws across the module boundary — Phase 2 just checks
    `result.cycle is not None` and translates that into a typed failure.

Module scope (PROP-18): move-only. Resize is not a concept here.
"""

# Python imports
from collections.abc import Mapping
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class WorkItemNode:
    """Identity of a Work Item participating in the precedence graph.

    Schedule (start_date, target_date, updated_at) is intentionally NOT held
    here — Phase 2 introduces a separate `ScheduledWorkItem` for date math.
    """

    id: UUID
    project_id: UUID


@dataclass(frozen=True, slots=True)
class Edge:
    """A normalized predecessor → successor precedence edge.

    `cross_project=True` means the successor (or predecessor) belongs to a
    project different from the loaded project. The loader never dereferences
    the foreign issue's dates or fields — only its `project_id` is consulted.
    `source_relation_id` is preserved for diagnostics and audit logging.
    """

    predecessor_id: UUID
    successor_id: UUID
    source_relation_id: UUID
    cross_project: bool


@dataclass(frozen=True, slots=True)
class Adjacency:
    """Same-project precedence adjacency, both directions pre-computed.

    `successors` and `predecessors` contain ONLY same-project edges
    (cross-project edges live in `cross_project_edges`). Both directions are
    pre-built at load time so Phase 2's forward (rightward move) and
    backward (leftward move) walks are O(1) lookups.
    """

    successors: Mapping[UUID, frozenset[UUID]]
    predecessors: Mapping[UUID, frozenset[UUID]]
    nodes: frozenset[UUID]
    cross_project_edges: tuple[Edge, ...]

    def successors_of(self, node_id: UUID) -> frozenset[UUID]:
        """Return successors of `node_id`; empty frozenset for unknown ids."""
        return self.successors.get(node_id, frozenset())

    def predecessors_of(self, node_id: UUID) -> frozenset[UUID]:
        """Return predecessors of `node_id`; empty frozenset for unknown ids."""
        return self.predecessors.get(node_id, frozenset())


@dataclass(frozen=True, slots=True)
class LoadResult:
    """Public result of `load_precedence_graph`.

    `cycle` is `None` when the graph is a DAG; otherwise it is a closed path
    (last element equals first) for diagnostics. Phase 2 translates the
    presence of `cycle` into a `DEPENDENCY_CYCLE` typed failure without
    re-throwing across the module boundary.
    """

    adjacency: Adjacency
    cycle: tuple[UUID, ...] | None
