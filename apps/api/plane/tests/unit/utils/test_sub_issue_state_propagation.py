# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest

from plane.db.models import Issue, Project, ProjectMember, State, Workspace
from plane.utils.sub_issue_state_propagation import (
    propagate_state_to_sub_issues,
    resolve_target_state,
    user_can_edit_issue,
)


@pytest.fixture
def project(workspace, create_user):
    return Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def todo_state(project):
    return State.objects.create(
        name="Todo",
        project=project,
        group="unstarted",
        color="#60646C",
    )


@pytest.fixture
def done_state(project):
    return State.objects.create(
        name="Done",
        project=project,
        group="completed",
        color="#46A758",
    )


@pytest.fixture
def parent_issue(workspace, project, todo_state, create_user):
    return Issue.objects.create(
        name="Parent Issue",
        workspace=workspace,
        project=project,
        state=todo_state,
        created_by=create_user,
    )


@pytest.fixture
def sub_issue(workspace, project, todo_state, create_user, parent_issue):
    return Issue.objects.create(
        name="Sub Issue",
        workspace=workspace,
        project=project,
        state=todo_state,
        parent=parent_issue,
        created_by=create_user,
    )


@pytest.mark.unit
class TestResolveTargetState:
    @pytest.mark.django_db
    def test_returns_same_state_for_same_project(self, project, todo_state):
        assert resolve_target_state(todo_state, project.id) == todo_state

    @pytest.mark.django_db
    def test_resolves_state_by_group_and_name(self, workspace, create_user, todo_state):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        other_todo = State.objects.create(
            name="Todo",
            project=other_project,
            group="unstarted",
            color="#60646C",
        )
        assert resolve_target_state(todo_state, other_project.id) == other_todo

    @pytest.mark.django_db
    def test_falls_back_to_group_state(self, workspace, create_user, todo_state):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        fallback_state = State.objects.create(
            name="Backlog",
            project=other_project,
            group="unstarted",
            color="#60646C",
            sequence=1000,
        )
        assert resolve_target_state(todo_state, other_project.id) == fallback_state


@pytest.mark.unit
class TestPropagateStateToSubIssues:
    @pytest.mark.django_db
    @patch("plane.utils.sub_issue_state_propagation.issue_activity.delay")
    def test_propagates_state_to_direct_sub_issues(
        self, mock_issue_activity, workspace, create_user, parent_issue, sub_issue, done_state
    ):
        ProjectMember.objects.create(
            workspace=workspace,
            project=parent_issue.project,
            member=create_user,
            role=20,
        )

        updated_ids = propagate_state_to_sub_issues(
            parent=parent_issue,
            new_state=done_state,
            actor=create_user,
            workspace_slug=workspace.slug,
            origin="http://localhost",
        )

        sub_issue.refresh_from_db()
        assert updated_ids == [str(sub_issue.id)]
        assert sub_issue.state_id == done_state.id
        assert sub_issue.completed_at is not None
        mock_issue_activity.assert_called_once()

    @pytest.mark.django_db
    @patch("plane.utils.sub_issue_state_propagation.issue_activity.delay")
    def test_skips_sub_issues_user_cannot_edit(
        self, mock_issue_activity, workspace, create_user, parent_issue, sub_issue, done_state, user_data
    ):
        from plane.db.models import User

        other_user = User.objects.create(
            email="other@plane.so",
            first_name="Other",
            last_name="User",
        )
        sub_issue.created_by = other_user
        sub_issue.save()

        updated_ids = propagate_state_to_sub_issues(
            parent=parent_issue,
            new_state=done_state,
            actor=create_user,
            workspace_slug=workspace.slug,
            origin="http://localhost",
        )

        sub_issue.refresh_from_db()
        assert updated_ids == []
        assert sub_issue.state_id != done_state.id
        mock_issue_activity.assert_not_called()

    @pytest.mark.django_db
    def test_user_can_edit_issue_for_creator(self, workspace, create_user, sub_issue):
        assert user_can_edit_issue(create_user, workspace.slug, sub_issue) is True
