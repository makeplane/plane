# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.graph.load_precedence_graph`.

Test pattern: per-test ORM fixture chain workspace → project → state → issue
(matches `apps/api/plane/tests/unit/models/test_issue_comment_modal.py`).
Uses `@pytest.mark.unit` at the class level + `@pytest.mark.django_db` at the
method level. The global `create_user` fixture from `tests/conftest.py:37-46`
is the entry point.

Phase 1 first-minimum-task: a single failing PROP-02 case for `relates_to`.
Plan 02 will add the remaining 9 test cases (filter / direction / cycle /
cross-project / empty / self-edge / adjacency shape / convenience / lint).
"""

# Python imports
import pytest

# Module imports
from plane.app.services.timeline_propagation import load_precedence_graph
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
