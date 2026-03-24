# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as a member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def state(project):
    """Create a default state for issue creation."""
    return State.objects.create(
        name="Todo",
        project=project,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(workspace, project, state, create_user):
    """Create a test issue."""
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueCommentListCreateAPIEndpoint:
    def get_comments_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/"

    @pytest.mark.django_db
    @patch("plane.api.views.issue.issue_activity.delay")
    @patch("plane.api.views.issue.model_activity.delay")
    def test_create_issue_comment_triggers_model_activity(
        self,
        mock_model_activity_delay,
        mock_issue_activity_delay,
        api_key_client,
        workspace,
        project,
        issue,
    ):
        """Regression test: creating comment via API should trigger model_activity.delay()."""
        url = self.get_comments_url(workspace.slug, project.id, issue.id)
        payload = {
            "comment_html": "<p>Regression comment</p>",
            "comment_json": {"type": "doc", "content": [{"type": "paragraph", "text": "Regression comment"}]},
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        mock_issue_activity_delay.assert_called_once()
        mock_model_activity_delay.assert_called_once()
        _, kwargs = mock_model_activity_delay.call_args
        assert kwargs["model_name"] == "issue_comment"
        assert kwargs["model_id"] == response.data["id"]
        assert kwargs["slug"] == workspace.slug
