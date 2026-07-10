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
from datetime import date, datetime
from uuid import UUID

# Module imports
from .errors import PropagationFailure


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


@dataclass(frozen=True, slots=True)
class ScheduledWorkItem:
    """Schedule snapshot of a Work Item that the propagation algorithm reads (D-04).

    Mirrors `Issue` model fields the algorithm consumes (apps/api/plane/db/models/issue.py:145-146
    are `DateField(null=True)`; `updated_at` is `DateTimeField(auto_now=True)` from
    `TimeAuditModel`). `start_date` / `target_date` may be `None` to model PROP-17
    (incomplete schedule); `updated_at` is always present (Django guarantees).
    """

    id: UUID
    project_id: UUID
    start_date: date | None
    target_date: date | None
    updated_at: datetime
    planned_duration_working_days: int | None = None


@dataclass(frozen=True, slots=True)
class MoveIntent:
    """A user's drag intent for a single Work Item (D-04, US-35, API-02).

    All five fields required — by definition the dragged item must be a complete
    schedule. PROP-08 duration preservation is NOT enforced on construction;
    `propagate_move` rejects mismatched durations as `INVALID_DATE_RANGE` (D-06
    step 1) so the failure surfaces as a typed result, not an exception.
    """

    work_item_id: UUID
    original_start_date: date
    original_target_date: date
    requested_start_date: date
    requested_target_date: date


@dataclass(frozen=True, slots=True)
class WorkItemUpdate:
    """One entry in `PropagationResult.updates` (D-04).

    `updated_at` carries the INPUT value (Phase 3 sets the post-write value
    after `bulk_update`). This keeps Phase 2 free of clock dependence.
    """

    id: UUID
    start_date: date
    target_date: date
    updated_at: datetime
    planned_duration_working_days: int | None = None


@dataclass(frozen=True, slots=True)
class PropagationResult:
    """Public result of `propagate_move` (D-04, Result-pattern mirror of `LoadResult`).

    `failure is None` iff success. On success, `updates` ALWAYS includes the
    dragged item itself (PROP-03 / TEST-01 — even no-violation moves return
    one update). On failure, `updates == ()` (all-or-nothing — PROP-12).
    """

    requested_work_item_id: UUID
    failure: PropagationFailure | None
    updates: tuple[WorkItemUpdate, ...]
    total_updated_count: int

    @property
    def is_success(self) -> bool:
        """True iff `failure is None` (convenience accessor)."""
        return self.failure is None
