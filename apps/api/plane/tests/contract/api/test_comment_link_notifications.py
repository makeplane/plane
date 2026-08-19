# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Notification parity for the remaining external REST API write paths.

makeplane/plane#9307 fixed this for work item create/update, but the same
omission was left on comments, links, and work item deletion: those endpoints
dispatched ``issue_activity`` without ``notification=True``, so the activity was
recorded and webhooks fired while subscribers were never notified. The web app
(``plane.app.views.issue``) passes the flag on every one of these paths, so the
external API was silently the odd one out.

These assert the dispatch contract rather than the delivered notification.
``notification=True`` is what gates ``notifications.delay(...)`` in
``issue_activities_task``; the fan-out itself is already covered downstream, and
mocking at the dispatch boundary keeps these tests from depending on Celery.
"""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueComment, IssueLink, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """A project with the user as admin and a default state."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project


@pytest.fixture
def create_issue(db, project, workspace, create_user):
    return Issue.objects.create(
        name="Existing Issue",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def create_comment(db, project, workspace, create_issue, create_user):
    return IssueComment.objects.create(
        comment_html="<p>Existing comment</p>",
        issue=create_issue,
        project=project,
        workspace=workspace,
        actor=create_user,
        created_by=create_user,
    )


@pytest.fixture
def create_link(db, project, workspace, create_issue, create_user):
    return IssueLink.objects.create(
        url="https://example.com/original",
        issue=create_issue,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


def _dispatched(mock):
    """The single ``issue_activity.delay`` kwargs dict for this request."""
    mock.delay.assert_called_once()
    return mock.delay.call_args.kwargs


@pytest.mark.contract
class TestCommentNotificationContract:
    """Comment writes through ``/api/v1/...`` must notify, as the web app does."""

    def url(self, workspace, project, issue, pk=None):
        base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/"
        return f"{base}{pk}/" if pk else base

    @pytest.mark.django_db
    def test_create_comment_notifies(self, api_key_client, workspace, project, create_issue):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.post(
                self.url(workspace, project, create_issue),
                {"comment_html": "<p>New comment</p>"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "comment.activity.created"
        assert kwargs["notification"] is True
        assert kwargs["origin"]

    @pytest.mark.django_db
    def test_update_comment_notifies(self, api_key_client, workspace, project, create_issue, create_comment):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.patch(
                self.url(workspace, project, create_issue, create_comment.id),
                {"comment_html": "<p>Edited comment</p>"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "comment.activity.updated"
        assert kwargs["notification"] is True
        assert kwargs["origin"]

    @pytest.mark.django_db
    def test_delete_comment_notifies(self, api_key_client, workspace, project, create_issue, create_comment):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.delete(self.url(workspace, project, create_issue, create_comment.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "comment.activity.deleted"
        assert kwargs["notification"] is True
        assert kwargs["origin"]


@pytest.mark.contract
class TestLinkNotificationContract:
    """Link writes through ``/api/v1/...`` must notify, as the web app does."""

    def url(self, workspace, project, issue, pk=None):
        base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/links/"
        return f"{base}{pk}/" if pk else base

    @pytest.mark.django_db
    def test_create_link_notifies(self, api_key_client, workspace, project, create_issue):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.post(
                self.url(workspace, project, create_issue),
                {"url": "https://example.com/spec"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "link.activity.created"
        assert kwargs["notification"] is True
        assert kwargs["origin"]

    @pytest.mark.django_db
    def test_update_link_notifies(self, api_key_client, workspace, project, create_issue, create_link):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.patch(
                self.url(workspace, project, create_issue, create_link.id),
                {"url": "https://example.com/updated"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "link.activity.updated"
        assert kwargs["notification"] is True
        assert kwargs["origin"]

    @pytest.mark.django_db
    def test_delete_link_notifies(self, api_key_client, workspace, project, create_issue, create_link):
        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.delete(self.url(workspace, project, create_issue, create_link.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "link.activity.deleted"
        assert kwargs["notification"] is True
        assert kwargs["origin"]


@pytest.mark.contract
class TestIssueDeleteNotificationContract:
    """#9307 covered create and update; deletion was left behind."""

    @pytest.mark.django_db
    def test_delete_issue_notifies(self, api_key_client, workspace, project, create_issue):
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{create_issue.id}/"

        with patch("plane.api.views.issue.issue_activity") as activity:
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        kwargs = _dispatched(activity)
        assert kwargs["type"] == "issue.activity.deleted"
        assert kwargs["notification"] is True
        assert kwargs["origin"]
