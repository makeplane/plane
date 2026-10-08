# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    IssueActivity,
    IssueComment,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


@pytest.fixture
def project(workspace, create_user):
    proj = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(workspace=workspace, project=proj, member=create_user, role=20)
    return proj


@pytest.fixture
def state(project):
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=project.workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(project, state, create_user):
    return Issue.objects.create(
        name="Issue in project",
        workspace=project.workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueActivityCrossProjectLeak:
    """
    Regression tests: activity/comment endpoints must not return rows from a
    different project even when the caller supplies a valid project_id they
    belong to together with an issue_id that belongs to another project.
    """

    @pytest.mark.django_db
    def test_comment_endpoint_does_not_leak_across_projects(
        self, session_client, workspace, project, issue, create_user
    ):
        other_user = User.objects.create_user(email="other@plane.so", username="otheruser")
        WorkspaceMember.objects.create(workspace=workspace, member=other_user, role=10)

        other_project = Project.objects.create(
            name="Other Project",
            identifier="OT",
            workspace=workspace,
            created_by=other_user,
        )
        other_state = State.objects.create(
            name="Todo",
            project=other_project,
            workspace=workspace,
            group="backlog",
            default=True,
        )
        # create_user is NOT a member of other_project
        other_issue = Issue.objects.create(
            name="Issue in other project",
            workspace=workspace,
            project=other_project,
            state=other_state,
            created_by=other_user,
        )
        IssueComment.objects.create(
            workspace=workspace,
            project=other_project,
            issue=other_issue,
            comment_html="<p>secret comment</p>",
            actor=other_user,
        )

        # Call activity endpoint scoped to `project` but passing `other_issue.id`
        url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/"
            f"issues/{other_issue.id}/history/?activity_type=issue-comment"
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data == [], (
            "Comments from a different project must not be returned "
            "when project_id in URL does not match the comment's project"
        )

    @pytest.mark.django_db
    def test_activity_endpoint_does_not_leak_across_projects(
        self, session_client, workspace, project, issue, create_user
    ):
        other_user = User.objects.create_user(email="other2@plane.so", username="otheruser2")
        WorkspaceMember.objects.create(workspace=workspace, member=other_user, role=10)

        other_project = Project.objects.create(
            name="Other Project 2",
            identifier="OT2",
            workspace=workspace,
            created_by=other_user,
        )
        other_state = State.objects.create(
            name="Todo",
            project=other_project,
            workspace=workspace,
            group="backlog",
            default=True,
        )
        other_issue = Issue.objects.create(
            name="Issue in other project 2",
            workspace=workspace,
            project=other_project,
            state=other_state,
            created_by=other_user,
        )
        IssueActivity.objects.create(
            workspace=workspace,
            project=other_project,
            issue=other_issue,
            actor=other_user,
            verb="created",
            field="title",
            old_value="",
            new_value="secret",
        )

        url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/"
            f"issues/{other_issue.id}/history/?activity_type=issue-property"
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data == [], (
            "Activities from a different project must not be returned "
            "when project_id in URL does not match the activity's project"
        )
