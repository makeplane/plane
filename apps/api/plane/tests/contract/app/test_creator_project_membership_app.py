# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The ``allow_permission(creator=True)`` shortcut on project routes applies only
while the creator is still an active member of the URL project."""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueComment, Project, ProjectMember, User, WorkspaceMember


@pytest.fixture(autouse=True)
def _no_activity(db):
    """Stub the deferred tasks (broker) and base_host (needs APP_BASE_URL / WEB_URL)."""
    with (
        mock.patch("plane.app.views.issue.comment.issue_activity"),
        mock.patch("plane.app.views.issue.comment.model_activity"),
        mock.patch("plane.app.views.issue.comment.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.base.issue_activity"),
        mock.patch("plane.app.views.issue.base.base_host", return_value="http://testserver"),
    ):
        yield


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Creator Project", identifier="CRP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=20)
    return project


@pytest.fixture
def creator(db, workspace, project):
    """A workspace MEMBER who is a project GUEST and created an issue and a comment."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"creator-{unique_id}@plane.so", username=f"creator_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=5)
    return user


@pytest.fixture
def issue(db, workspace, project, creator):
    issue = Issue.objects.create(name="Creator issue", project=project, workspace=workspace)
    Issue.objects.filter(pk=issue.pk).update(created_by=creator)
    return issue


@pytest.fixture
def comment(db, workspace, project, issue, creator):
    comment = IssueComment.objects.create(
        issue=issue, project=project, workspace=workspace, comment_html="<p>original</p>", actor=creator
    )
    IssueComment.objects.filter(pk=comment.pk).update(created_by=creator)
    return comment


@pytest.fixture
def client(creator):
    client = APIClient()
    client.force_authenticate(user=creator)
    return client


def _comment_url(workspace, project, issue, comment):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/{comment.id}/"


def _issue_url(workspace, project, issue):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"


def _deactivate(project, user):
    ProjectMember.objects.filter(project=project, member=user).update(is_active=False)


@pytest.mark.contract
@pytest.mark.django_db
class TestCreatorRequiresActiveProjectMembership:
    def test_inactive_member_cannot_edit_own_comment(self, client, workspace, project, issue, comment, creator):
        _deactivate(project, creator)

        response = client.patch(
            _comment_url(workspace, project, issue, comment), {"comment_html": "<p>changed</p>"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        comment.refresh_from_db()
        assert comment.comment_html == "<p>original</p>"

    def test_inactive_member_cannot_delete_own_comment(self, client, workspace, project, issue, comment, creator):
        _deactivate(project, creator)

        response = client.delete(_comment_url(workspace, project, issue, comment))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueComment.objects.filter(pk=comment.pk).exists()

    def test_inactive_member_cannot_delete_own_issue(self, client, workspace, project, issue, creator):
        _deactivate(project, creator)

        response = client.delete(_issue_url(workspace, project, issue))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Issue.objects.filter(pk=issue.pk).exists()

    def test_active_guest_creator_can_edit_own_comment(self, client, workspace, project, issue, comment):
        response = client.patch(
            _comment_url(workspace, project, issue, comment), {"comment_html": "<p>changed</p>"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        comment.refresh_from_db()
        assert comment.comment_html == "<p>changed</p>"

    def test_active_guest_creator_can_delete_own_issue(self, client, workspace, project, issue):
        response = client.delete(_issue_url(workspace, project, issue))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Issue.objects.filter(pk=issue.pk).exists()
