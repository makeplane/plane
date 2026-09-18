# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract coverage for app issue-comment deletion."""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueComment, Project, ProjectMember, State, User, WorkspaceMember


def comment_url(workspace, project, issue, comment):
    return (
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"
        f"{issue.id}/comments/{comment.id}/"
    )


@pytest.fixture(autouse=True)
def _no_comment_activity():
    with mock.patch("plane.app.views.issue.comment.issue_activity.delay"):
        yield


@pytest.fixture
def issue_with_comment(db, workspace, create_user):
    project = Project.objects.create(
        name="Comment Project", identifier="CMT", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=15, is_active=True
    )
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(
        name="Comment issue", workspace=workspace, project=project, state=state, created_by=create_user
    )
    comment = IssueComment.objects.create(
        issue=issue,
        project=project,
        workspace=workspace,
        comment_html="<p>Delete me</p>",
        created_by=create_user,
        actor=create_user,
    )
    return project, issue, comment


def _create_project_member(workspace, project, *, role):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"comment-member-{uid}@plane.so", username=f"comment_member_{uid}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role, is_active=True)
    return user


@pytest.mark.django_db
def test_author_delete_soft_deletes_comment_and_hides_it_from_list(
    session_client, workspace, create_user, issue_with_comment
):
    project, issue, comment = issue_with_comment

    response = session_client.delete(comment_url(workspace, project, issue, comment))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    deleted_comment = IssueComment.all_objects.get(id=comment.id)
    assert deleted_comment.deleted_at is not None
    assert not IssueComment.objects.filter(id=comment.id).exists()
    list_response = session_client.get(
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/"
    )
    assert list_response.status_code == status.HTTP_200_OK
    assert str(comment.id) not in str(list_response.data)


@pytest.mark.django_db
def test_non_author_member_cannot_delete_comment(workspace, issue_with_comment):
    project, issue, comment = issue_with_comment
    member = _create_project_member(workspace, project, role=15)
    client = APIClient()
    client.force_authenticate(user=member)

    response = client.delete(comment_url(workspace, project, issue, comment))

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert IssueComment.objects.filter(id=comment.id).exists()


@pytest.mark.django_db
def test_project_admin_can_delete_another_users_comment(workspace, issue_with_comment):
    project, issue, comment = issue_with_comment
    admin = _create_project_member(workspace, project, role=20)
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.delete(comment_url(workspace, project, issue, comment))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert IssueComment.all_objects.get(id=comment.id).deleted_at is not None
