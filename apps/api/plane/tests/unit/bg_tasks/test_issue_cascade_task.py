# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from django.utils import timezone

from plane.bgtasks.issue_cascade_task import cascade_state_to_sub_issues
from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """A project owned by the workspace owner."""
    project = Project.objects.create(
        name="Cascade Project",
        identifier="CAS",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def states(project, workspace):
    """One state per relevant group (plus a second completed state)."""
    return {
        "backlog": State.objects.create(
            name="Backlog", project=project, workspace=workspace, group="backlog", default=True
        ),
        "started": State.objects.create(name="In Progress", project=project, workspace=workspace, group="started"),
        "completed": State.objects.create(name="Done", project=project, workspace=workspace, group="completed"),
        "completed_alt": State.objects.create(name="Shipped", project=project, workspace=workspace, group="completed"),
        "cancelled": State.objects.create(name="Cancelled", project=project, workspace=workspace, group="cancelled"),
    }


def _make_issue(name, workspace, project, state, user, parent=None):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        parent=parent,
        created_by=user,
    )


def _run(parent, new_state, project, user):
    cascade_state_to_sub_issues(
        parent_issue_id=str(parent.id),
        new_state_id=str(new_state.id),
        actor_id=str(user.id),
        project_id=str(project.id),
        epoch=int(timezone.now().timestamp()),
    )


@pytest.mark.unit
@patch("plane.bgtasks.issue_cascade_task.issue_activity.delay")
class TestCascadeStateToSubIssues:
    """Unit tests for the recursive close-cascade background task."""

    @pytest.mark.django_db
    def test_mirror_to_completed(self, mock_activity, workspace, project, states, create_user):
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        child = _make_issue("Child", workspace, project, states["started"], create_user, parent=parent)

        _run(parent, states["completed"], project, create_user)

        child.refresh_from_db()
        assert child.state_id == states["completed"].id
        assert child.completed_at is not None
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    def test_mirror_to_cancelled_clears_completed_at(self, mock_activity, workspace, project, states, create_user):
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        child = _make_issue("Child", workspace, project, states["started"], create_user, parent=parent)

        _run(parent, states["cancelled"], project, create_user)

        child.refresh_from_db()
        assert child.state_id == states["cancelled"].id
        assert child.completed_at is None
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    def test_already_terminal_child_is_skipped(self, mock_activity, workspace, project, states, create_user):
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        # Child is already in a (different) completed state; it must not be touched.
        child = _make_issue("Child", workspace, project, states["completed_alt"], create_user, parent=parent)

        _run(parent, states["completed"], project, create_user)

        child.refresh_from_db()
        assert child.state_id == states["completed_alt"].id
        mock_activity.assert_not_called()

    @pytest.mark.django_db
    def test_recurses_into_grandchildren(self, mock_activity, workspace, project, states, create_user):
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        child = _make_issue("Child", workspace, project, states["started"], create_user, parent=parent)
        grandchild = _make_issue("Grandchild", workspace, project, states["started"], create_user, parent=child)

        _run(parent, states["completed"], project, create_user)

        child.refresh_from_db()
        grandchild.refresh_from_db()
        assert child.state_id == states["completed"].id
        assert grandchild.state_id == states["completed"].id
        assert mock_activity.call_count == 2

    @pytest.mark.django_db
    def test_open_grandchild_under_closed_child_is_reached(
        self, mock_activity, workspace, project, states, create_user
    ):
        # Middle child already closed -> skipped, but its open grandchild must still be mirrored.
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        child = _make_issue("Child", workspace, project, states["completed_alt"], create_user, parent=parent)
        grandchild = _make_issue("Grandchild", workspace, project, states["started"], create_user, parent=child)

        _run(parent, states["completed"], project, create_user)

        child.refresh_from_db()
        grandchild.refresh_from_db()
        assert child.state_id == states["completed_alt"].id  # unchanged (already terminal)
        assert grandchild.state_id == states["completed"].id  # reached through the closed child
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    def test_cycle_is_safe(self, mock_activity, workspace, project, states, create_user):
        parent = _make_issue("Parent", workspace, project, states["started"], create_user)
        child = _make_issue("Child", workspace, project, states["started"], create_user, parent=parent)
        # Introduce a cycle: parent.parent = child (bypass save side effects).
        Issue.objects.filter(id=parent.id).update(parent=child)

        # Must terminate (visited-set) and mirror the child exactly once.
        _run(parent, states["completed"], project, create_user)

        child.refresh_from_db()
        assert child.state_id == states["completed"].id
        mock_activity.assert_called_once()

    @pytest.mark.django_db
    def test_non_terminal_target_is_noop(self, mock_activity, workspace, project, states, create_user):
        # Defensive: the task only fires for terminal target states.
        parent = _make_issue("Parent", workspace, project, states["backlog"], create_user)
        child = _make_issue("Child", workspace, project, states["started"], create_user, parent=parent)

        _run(parent, states["started"], project, create_user)

        child.refresh_from_db()
        assert child.state_id == states["started"].id
        mock_activity.assert_not_called()
