# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Precedence graph loader for Timeline Dependency Schedule Propagation.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

Direction translation (verified across every IssueRelation creation path in
this codebase, see RESEARCH.md "Existing Code Insights — Directionality
Verification"):

    For each row (issue=X, related_issue=Y, relation_type='blocked_by'):
        emit Edge(predecessor_id=Y (=row.related_issue_id),
                  successor_id=X   (=row.issue_id))

Filters applied (in order):
    1. relation_type == "blocked_by"            (PROP-02)
    2. deleted_at IS NULL                        (defensive, D-05)

Cross-project classification (PROP-16, D-03, RESEARCH.md "Pitfall 2"):
    - An edge is cross-project when EITHER endpoint's `project_id` differs
      from the loader's `project_id` argument — i.e. ANY foreign endpoint
      taints the edge ("paths reaching outside the project fail
      propagation"). Each endpoint's project_id is read via a precomputed
      annotation (`issue_project_id`, `related_project_id`) when present,
      falling back to `row.issue.project_id` / `row.related_issue.project_id`.
    - The cross-project signal is NEVER `row.project_id` (Pitfall 2: that
      field only records which project owns the row, not the endpoints).
    - Cross-project edges are kept in `Adjacency.cross_project_edges`
      with `cross_project=True`. They do NOT appear in `successors` /
      `predecessors`. The loader does NOT dereference foreign issue dates,
      names, descriptions, or any other field beyond `project_id`.

Cycle detection (D-02):
    - Iterative three-color DFS over `Adjacency.successors`.
    - On first back-edge, returns the closed cycle path tuple.
    - Self-edge classified as one-node cycle (a, a).
    - NEVER throws across the module boundary — Phase 2 inspects
      `result.cycle` to translate into DEPENDENCY_CYCLE typed failure.

Caller assumptions (D-05):
    - The caller (Phase 3 view) MUST pre-filter rows whose endpoint
      Work Items are archived / draft / soft-deleted. The loader
      defensively re-applies `deleted_at IS NULL` on the relation row
      itself but does NOT join Issue to check endpoint state.

Module scope (PROP-18): move-only. Resize is not a concept here.
"""

# Python imports
from collections.abc import Iterable, Iterator
from typing import Protocol
from uuid import UUID

# Module imports
from .types import Adjacency, Edge, LoadResult


class RelationLike(Protocol):
    """Structural subtype of `IssueRelation` consumable by the loader.

    Implemented automatically by `IssueRelation` ORM rows. Tests may pass
    plain dataclasses satisfying this Protocol when DB roundtrip is
    unnecessary. Optional fields accessed via `getattr` fallback:
      - related_project_id: UUID | None  (preferred, when annotated)
      - related_issue:      object       (with .project_id attribute)
      - deleted_at:         datetime | None
    """

    id: UUID
    issue_id: UUID
    related_issue_id: UUID
    relation_type: str
    project_id: UUID


# DFS color constants
_WHITE = 0
_GRAY = 1
_BLACK = 2


def load_precedence_graph(
    relations: Iterable[RelationLike],
    project_id: UUID,
) -> LoadResult:
    """Build a normalized precedence adjacency from IssueRelation rows.

    See module docstring for full semantics. Returns a `LoadResult` whose
    `cycle` is `None` for a DAG or a closed-path tuple on the first
    detected cycle (no exception ever crosses this module boundary).
    """
    successors_mut: dict[UUID, set[UUID]] = {}
    predecessors_mut: dict[UUID, set[UUID]] = {}
    nodes_mut: set[UUID] = set()
    cross_project_edges_mut: list[Edge] = []

    for row in relations:
        # Defensive soft-delete (D-05): callers using IssueRelation.all_objects
        # or hand-rolled rows can bypass SoftDeletionManager. Skip those rows.
        if getattr(row, "deleted_at", None) is not None:
            continue

        # Filter (PROP-02): only canonical `blocked_by` rows participate.
        # `blocking` is never stored — get_actual_relation maps it to
        # `blocked_by`. `relates_to`, `duplicate`, `start_before`,
        # `finish_before`, `implemented_by` are dropped here.
        if row.relation_type != "blocked_by":
            continue

        edge = _make_edge(row, project_id)

        if edge.cross_project:
            cross_project_edges_mut.append(edge)
            continue

        # IssueRelation row (issue=X, related=Y, blocked_by) means X is
        # blocked by Y → predecessor=Y, successor=X.  (RESEARCH.md "Pitfall 1")
        successors_mut.setdefault(edge.predecessor_id, set()).add(edge.successor_id)
        predecessors_mut.setdefault(edge.successor_id, set()).add(edge.predecessor_id)
        nodes_mut.add(edge.predecessor_id)
        nodes_mut.add(edge.successor_id)

    adjacency = Adjacency(
        successors={k: frozenset(v) for k, v in successors_mut.items()},
        predecessors={k: frozenset(v) for k, v in predecessors_mut.items()},
        nodes=frozenset(nodes_mut),
        cross_project_edges=tuple(cross_project_edges_mut),
    )

    cycle = _detect_cycle(adjacency)
    return LoadResult(adjacency=adjacency, cycle=cycle)


def _make_edge(row: RelationLike, project_id: UUID) -> Edge:
    """Translate a `blocked_by` row into a typed predecessor → successor Edge.

    For row (issue=X, related_issue=Y, relation_type='blocked_by'):
      - predecessor_id = Y (row.related_issue_id)
      - successor_id   = X (row.issue_id)
      - cross_project  = ANY endpoint's project_id != loader project_id

    PROP-16 semantics ("paths reaching outside the project fail propagation")
    require classifying an edge as cross-project when EITHER endpoint lives
    outside the loader's project — not just the predecessor side. A row may
    have `IssueRelation.project_id == loader project_id` (set by whichever
    project's view created the row) while one endpoint Issue has migrated /
    been created against a different project.

    For each endpoint we prefer a precomputed annotation
    (`issue_project_id`, `related_project_id`) and fall back to
    `row.issue.project_id` / `row.related_issue.project_id`. The
    cross-project signal is NEVER `row.project_id` (Pitfall 2: that field
    only records which project owns the row, not the endpoints).
    """
    issue_project_id = getattr(row, "issue_project_id", None)
    if issue_project_id is None:
        issue_project_id = row.issue.project_id
    related_project_id = getattr(row, "related_project_id", None)
    if related_project_id is None:
        related_project_id = row.related_issue.project_id
    cross_project = (
        issue_project_id != project_id
        or related_project_id != project_id
    )
    return Edge(
        predecessor_id=row.related_issue_id,
        successor_id=row.issue_id,
        source_relation_id=row.id,
        cross_project=cross_project,
    )


def _detect_cycle(adj: Adjacency) -> tuple[UUID, ...] | None:
    """Iterative three-color DFS (D-02). Returns a closed cycle path or None.

    Deterministic iteration order via `sorted(...)` on roots and successors
    so test assertions on the returned tuple are stable across runs
    (Pitfall 4 — frozenset iteration order is undefined).

    Self-edges (a -> a) return (a, a) before color tracking — defensive
    against direct-DB rows that bypass the unique_together API constraint
    (D-05).
    """
    color: dict[UUID, int] = {n: _WHITE for n in adj.nodes}
    parent: dict[UUID, UUID | None] = {n: None for n in adj.nodes}

    for root in sorted(adj.nodes):
        if color[root] != _WHITE:
            continue

        stack: list[tuple[UUID, Iterator[UUID]]] = [
            (root, iter(sorted(adj.successors_of(root))))
        ]
        color[root] = _GRAY

        while stack:
            node, succ_iter = stack[-1]
            try:
                child = next(succ_iter)
            except StopIteration:
                color[node] = _BLACK
                stack.pop()
                continue

            # Self-edge guard (D-05): node -> node is a 1-node cycle.
            if child == node:
                return (node, node)

            child_color = color.get(child, _WHITE)
            if child_color == _WHITE:
                color[child] = _GRAY
                parent[child] = node
                stack.append((child, iter(sorted(adj.successors_of(child)))))
            elif child_color == _GRAY:
                # Back-edge: reconstruct closed path from `node` back to `child`.
                cycle: list[UUID] = [child]
                cursor: UUID | None = node
                while cursor is not None and cursor != child:
                    cycle.append(cursor)
                    cursor = parent[cursor]
                cycle.append(child)  # close: (a, ..., b, a)
                cycle.reverse()
                return tuple(cycle)
            # _BLACK → cross-edge to a fully-explored subtree, ignored.

    return None
