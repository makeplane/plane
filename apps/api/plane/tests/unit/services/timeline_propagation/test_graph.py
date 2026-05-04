# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.graph.load_precedence_graph`.

Test pattern: per-test ORM fixture chain workspace → project → state → issue
(matches `apps/api/plane/tests/unit/models/test_issue_comment_modal.py`).
Uses `@pytest.mark.unit` at the class level + `@pytest.mark.django_db` at the
method level. The global `create_user` fixture from `tests/conftest.py:37-46`
is the entry point.

Coverage map (Phase 1 / 01-VALIDATION.md):
  TestLoadPrecedenceGraphFilters      → PROP-02 (relates_to / duplicate dropped)
                                      → PROP-01 alias (blocking → blocked_by mirror)
  TestLoadPrecedenceGraphDirection    → D-04 (predecessor=related_issue, successor=issue)
  TestLoadPrecedenceGraphCycle        → PROP-15 / TEST-11 + D-05 (self-edge)
  TestLoadPrecedenceGraphCrossProject → PROP-16 / D-03
  TestLoadPrecedenceGraphEmpty        → regression guard for default construction
  TestLoadPrecedenceGraphAdjacencyShape → D-06 (successors+predecessors symmetry)
  TestAdjacencyConvenienceMethods     → D-06 (no-KeyError invariant)
  test_no_drf_or_http_imports_in_module → D-08 / PROP-18 lint-grep
"""

# Python imports
import pathlib
import pytest

# Module imports
from plane.app.services.timeline_propagation import load_precedence_graph
from plane.app.services.timeline_propagation.types import Adjacency
from plane.db.models import (
    IssueRelation,
    Issue,
    Project,
    State,
    Workspace,
)


# ---------------------------------------------------------------------------
# Per-test ORM fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def workspace(create_user):
    """Per-test workspace (locally defined to match the model-test analog)."""
    return Workspace.objects.create(
        name="Test Workspace",
        slug="test-graph-ws",
        owner=create_user,
    )


@pytest.fixture
def project(workspace, create_user):
    return Project.objects.create(
        name="Test Project",
        identifier="TPG",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def state(project):
    """Default state — Issue.save() resolves state from the default flag."""
    return State.objects.create(
        name="Todo",
        project=project,
        group="backlog",
        default=True,
    )


@pytest.fixture
def other_project(workspace, create_user):
    """A second project in the same workspace, used for cross-project tests (PROP-16)."""
    return Project.objects.create(
        name="Other Project",
        identifier="OPG",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def other_state(other_project):
    return State.objects.create(
        name="Todo",
        project=other_project,
        group="backlog",
        default=True,
    )


# ---------------------------------------------------------------------------
# Helpers (test-local, not factory_boy — D-10 / RESEARCH.md A6)
# ---------------------------------------------------------------------------


def _make_issue(workspace, project, state, name):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
    )


def _make_blocked_by(workspace, project, predecessor, successor):
    """Create a canonical `blocked_by` row.

    Per CONTEXT.md D-04 / RESEARCH.md "Existing Code Insights — Directionality
    Verification": for `predecessor=Y blocks successor=X`, the row stores
    `IssueRelation(issue=X, related_issue=Y, relation_type='blocked_by')`.
    """
    return IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=project,
        workspace=workspace,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestLoadPrecedenceGraphFilters:
    """The loader retains only `blocked_by` rows (PROP-02)."""

    @pytest.mark.django_db
    def test_relates_to_is_dropped(self, workspace, project, state):
        """`relates_to` rows MUST NOT produce edges (PROP-02 / US-17)."""
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        IssueRelation.objects.create(
            issue=a,
            related_issue=b,
            relation_type="relates_to",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.adjacency.successors == {}
        assert result.adjacency.predecessors == {}
        assert result.adjacency.nodes == frozenset()
        assert result.adjacency.cross_project_edges == ()
        assert result.cycle is None

    @pytest.mark.django_db
    def test_duplicate_is_dropped(self, workspace, project, state):
        """`duplicate` rows MUST NOT produce edges (PROP-02 / US-18)."""
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        IssueRelation.objects.create(
            issue=a,
            related_issue=b,
            relation_type="duplicate",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.adjacency.nodes == frozenset()
        assert result.cycle is None

    @pytest.mark.django_db
    def test_blocking_via_get_actual_relation_normalizes_to_one_edge(
        self, workspace, project, state,
    ):
        """A user-facing 'blocking' relation is stored canonically as one
        `blocked_by` row (per `get_actual_relation`); it must produce exactly
        one edge — not two — and must be in the predecessor→successor direction
        (PROP-01).

        Per RESEARCH.md "Existing Code Insights — Directionality Verification":
        when the frontend POSTs `relation_type='blocking'` with `source=A`,
        `targets=[B]`, the row is stored as
        `IssueRelation(issue=B, related_issue=A, relation_type='blocked_by')`.
        So A blocks B → predecessor=A, successor=B → exactly one edge.
        """
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        # Mirror the canonical storage from app/views/issue/relation.py:220-237
        IssueRelation.objects.create(
            issue=b,
            related_issue=a,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.adjacency.successors_of(a.id) == frozenset({b.id})
        assert result.adjacency.predecessors_of(b.id) == frozenset({a.id})
        # Exactly one edge total — no double-counting from a "blocking" mirror
        total_edges = sum(len(v) for v in result.adjacency.successors.values())
        assert total_edges == 1


@pytest.mark.unit
class TestLoadPrecedenceGraphDirection:
    """Direction translation per CONTEXT.md D-04 / Pitfall 1."""

    @pytest.mark.django_db
    def test_predecessor_is_related_issue_successor_is_issue(
        self, workspace, project, state,
    ):
        """row(issue=X, related_issue=Y, blocked_by) → predecessor=Y, successor=X."""
        predecessor = _make_issue(workspace, project, state, "Pre")
        successor = _make_issue(workspace, project, state, "Suc")
        _make_blocked_by(workspace, project, predecessor=predecessor, successor=successor)

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        # Predecessor's successors set contains the successor
        assert result.adjacency.successors_of(predecessor.id) == frozenset({successor.id})
        # Successor's predecessors set contains the predecessor (D-06 symmetry)
        assert result.adjacency.predecessors_of(successor.id) == frozenset({predecessor.id})
        # The reverse direction MUST be empty — proves we did not mirror
        assert result.adjacency.successors_of(successor.id) == frozenset()
        assert result.adjacency.predecessors_of(predecessor.id) == frozenset()


@pytest.mark.unit
class TestLoadPrecedenceGraphCycle:
    """Cycle on the precedence subgraph surfaces in LoadResult.cycle (TEST-11 / PROP-15)."""

    @pytest.mark.django_db
    def test_three_node_cycle_is_detected(self, workspace, project, state):
        """A → B → C → A produces a closed cycle path with all three members."""
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        c = _make_issue(workspace, project, state, "C")
        # A blocks B, B blocks C, C blocks A (precedence cycle)
        _make_blocked_by(workspace, project, predecessor=a, successor=b)
        _make_blocked_by(workspace, project, predecessor=b, successor=c)
        _make_blocked_by(workspace, project, predecessor=c, successor=a)

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.cycle is not None
        # Closed: last element equals first
        assert result.cycle[0] == result.cycle[-1]
        # All three nodes appear in some rotation
        assert set(result.cycle) == {a.id, b.id, c.id}

    @pytest.mark.django_db
    def test_self_edge_is_one_node_cycle(self, workspace, project, state):
        """Direct-DB self-edge (a → a) is classified as cycle (a, a) (D-05)."""
        a = _make_issue(workspace, project, state, "A")
        # Self-edge: defensive guard against direct-DB rows. The unique_together
        # constraint in IssueRelation.Meta would prevent a normal API path from
        # creating this row, but the loader still must not infinite-loop.
        IssueRelation.objects.create(
            issue=a,
            related_issue=a,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        assert result.cycle == (a.id, a.id)


@pytest.mark.unit
class TestLoadPrecedenceGraphCrossProject:
    """Foreign-project endpoint lands in cross_project_edges (PROP-16 / D-03)."""

    @pytest.mark.django_db
    def test_cross_project_successor_marked(
        self, workspace, project, state, other_project, other_state,
    ):
        """Successor belonging to a different project → cross_project_edges only."""
        local = _make_issue(workspace, project, state, "Local")
        foreign = _make_issue(workspace, other_project, other_state, "Foreign")
        # Relation row lives in `project`, but successor is in `other_project`
        IssueRelation.objects.create(
            issue=foreign,
            related_issue=local,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project).select_related("related_issue"),
            project_id=project.id,
        )

        # Same-project adjacency must be empty
        assert result.adjacency.successors_of(local.id) == frozenset()
        assert result.adjacency.nodes == frozenset()
        # Cross-project edge preserved with the flag
        assert len(result.adjacency.cross_project_edges) == 1
        edge = result.adjacency.cross_project_edges[0]
        assert edge.predecessor_id == local.id
        assert edge.successor_id == foreign.id
        assert edge.cross_project is True
        assert result.cycle is None


@pytest.mark.unit
class TestLoadPrecedenceGraphEmpty:
    """Empty input must produce an empty Adjacency with cycle=None (regression guard)."""

    def test_empty_input_yields_empty_adjacency_no_cycle(self):
        """No DB needed — pure-list input."""
        from uuid import uuid4

        result = load_precedence_graph([], project_id=uuid4())

        assert result.adjacency.successors == {}
        assert result.adjacency.predecessors == {}
        assert result.adjacency.nodes == frozenset()
        assert result.adjacency.cross_project_edges == ()
        assert result.cycle is None


@pytest.mark.unit
class TestLoadPrecedenceGraphAdjacencyShape:
    """successors + predecessors are symmetric and complete (D-06)."""

    @pytest.mark.django_db
    def test_chain_split_merge_adjacency_contents(self, workspace, project, state):
        """Build A→B→C (chain), B→D (split from B), and E→C (merge into C);
        verify successors/predecessors symmetry and node membership."""
        a = _make_issue(workspace, project, state, "A")
        b = _make_issue(workspace, project, state, "B")
        c = _make_issue(workspace, project, state, "C")
        d = _make_issue(workspace, project, state, "D")
        e = _make_issue(workspace, project, state, "E")
        _make_blocked_by(workspace, project, predecessor=a, successor=b)
        _make_blocked_by(workspace, project, predecessor=b, successor=c)
        _make_blocked_by(workspace, project, predecessor=b, successor=d)
        _make_blocked_by(workspace, project, predecessor=e, successor=c)

        result = load_precedence_graph(
            IssueRelation.objects.filter(project=project),
            project_id=project.id,
        )

        # Forward direction
        assert result.adjacency.successors_of(a.id) == frozenset({b.id})
        assert result.adjacency.successors_of(b.id) == frozenset({c.id, d.id})
        assert result.adjacency.successors_of(c.id) == frozenset()
        assert result.adjacency.successors_of(d.id) == frozenset()
        assert result.adjacency.successors_of(e.id) == frozenset({c.id})
        # Backward direction (D-06 symmetry)
        assert result.adjacency.predecessors_of(a.id) == frozenset()
        assert result.adjacency.predecessors_of(b.id) == frozenset({a.id})
        assert result.adjacency.predecessors_of(c.id) == frozenset({b.id, e.id})
        assert result.adjacency.predecessors_of(d.id) == frozenset({b.id})
        assert result.adjacency.predecessors_of(e.id) == frozenset()
        # Node membership
        assert result.adjacency.nodes == frozenset({a.id, b.id, c.id, d.id, e.id})
        # No cycle
        assert result.cycle is None


@pytest.mark.unit
class TestAdjacencyConvenienceMethods:
    """Adjacency.successors_of / predecessors_of return empty for unknown ids (D-06)."""

    def test_successors_of_unknown_id_returns_empty_frozenset(self):
        """No KeyError — empty frozenset for unknown nodes (Phase 2 contract)."""
        from uuid import uuid4

        adj = Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset(),
            cross_project_edges=(),
        )
        unknown = uuid4()
        assert adj.successors_of(unknown) == frozenset()
        assert adj.predecessors_of(unknown) == frozenset()


@pytest.mark.unit
def test_no_drf_or_http_imports_in_module():
    """D-08 / PROP-18: timeline_propagation must not import DRF / Django HTTP / views.

    Verifiable by static grep — keeps the deep-module isolation honest as the
    package grows in Phase 2 (scheduling.py, propagation.py, errors.py).
    """
    pkg_root = (
        pathlib.Path(__file__).resolve().parents[4]
        / "app" / "services" / "timeline_propagation"
    )
    forbidden = (
        "rest_framework",
        "django.http",
        "plane.app.views",
        "plane.app.serializers",
    )

    py_files = list(pkg_root.rglob("*.py"))
    assert py_files, f"no .py files found under {pkg_root}"
    for py in py_files:
        text = py.read_text(encoding="utf-8")
        for needle in forbidden:
            assert needle not in text, (
                f"{py.name} imports forbidden module: {needle}"
            )
