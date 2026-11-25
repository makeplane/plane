# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: rich text written through the page and public-board comment
endpoints is stored sanitised, like work item descriptions and comments.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import DeployBoard, Issue, IssueComment, Page, Project, ProjectMember, ProjectPage, State

RICH_TEXT = '<p>hello</p><script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)">'


def _assert_sanitised(html):
    assert "<p>hello</p>" in html
    assert "<img" in html
    assert "script" not in html
    assert "onerror" not in html


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Docs", identifier="DOC", workspace=workspace)
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=20, is_active=True)
    return project


def _pages_url(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/"


@pytest.mark.contract
@pytest.mark.usefixtures("mock_celery")
class TestPageDescriptionSanitised:
    @pytest.mark.django_db
    def test_create_stores_sanitised_description(self, session_client, workspace, project):
        response = session_client.post(
            _pages_url(workspace, project), {"name": "Doc", "description_html": RICH_TEXT}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        _assert_sanitised(response.data["description_html"])
        _assert_sanitised(Page.objects.get(pk=response.data["id"]).description_html)

    @pytest.mark.django_db
    def test_update_stores_sanitised_description(self, session_client, workspace, project, create_user):
        page = Page.objects.create(workspace=workspace, owned_by=create_user, access=Page.PUBLIC_ACCESS, name="Doc")
        ProjectPage.objects.create(workspace=workspace, project=project, page=page)

        response = session_client.patch(
            f"{_pages_url(workspace, project)}{page.id}/", {"description_html": RICH_TEXT}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        _assert_sanitised(response.data["description_html"])
        page.refresh_from_db()
        _assert_sanitised(page.description_html)


@pytest.mark.contract
class TestPublicBoardCommentSanitised:
    @pytest.mark.django_db
    def test_comment_is_stored_sanitised(self, session_client, workspace, project):
        state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
        issue = Issue.objects.create(name="Board Issue", workspace=workspace, project=project, state=state)
        board = DeployBoard.objects.create(
            entity_name="project",
            entity_identifier=project.id,
            project=project,
            workspace=workspace,
            is_comments_enabled=True,
        )

        with mock.patch("plane.space.views.issue.issue_activity"):
            response = session_client.post(
                f"/api/public/anchor/{board.anchor}/issues/{issue.id}/comments/",
                {"comment_html": RICH_TEXT},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        _assert_sanitised(response.data["comment_html"])
        _assert_sanitised(IssueComment.objects.get(pk=response.data["id"]).comment_html)
