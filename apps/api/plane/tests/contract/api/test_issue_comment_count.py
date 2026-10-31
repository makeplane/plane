# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for comment_count exposure on work item list and detail endpoints.
"""

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueComment, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
    return project


@pytest.fixture
def state(db, workspace, project):
    """Create a default backlog state for the project."""
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(db, workspace, project, state, create_user):
    """Create a test issue within the project."""
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueCommentCount:
    """Test suite verifying comment_count calculation and serialization."""

    def get_list_url(self, workspace_slug, project_id):
        """Construct the work-items list endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/"

    def get_detail_url(self, workspace_slug, project_id, issue_id):
        """Construct the work-item detail endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/"

    @pytest.mark.django_db
    def test_issue_list_exposes_comment_count_zero(self, api_key_client, workspace, project, issue):
        """A work item with no comments returns comment_count = 0."""
        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        assert len(results) == 1
        assert results[0]["comment_count"] == 0

    @pytest.mark.django_db
    def test_issue_list_exposes_comment_count_with_comments(
        self, api_key_client, workspace, project, issue, create_user
    ):
        """A work item with comments returns the exact comment_count."""
        IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>First comment</p>",
            comment_stripped="First comment",
            created_by=create_user,
        )
        IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Second comment</p>",
            comment_stripped="Second comment",
            created_by=create_user,
        )

        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        assert len(results) == 1
        assert results[0]["comment_count"] == 2

    @pytest.mark.django_db
    def test_issue_list_excludes_deleted_comments_from_count(
        self, api_key_client, workspace, project, issue, create_user
    ):
        """Soft-deleted comments are excluded from comment_count."""
        comment1 = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Active comment</p>",
            created_by=create_user,
        )
        comment2 = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Deleted comment</p>",
            created_by=create_user,
        )
        comment2.delete()

        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        assert len(results) == 1
        assert results[0]["comment_count"] == 1

    @pytest.mark.django_db
    def test_issue_list_fields_filter_with_comment_count(
        self, api_key_client, workspace, project, issue, create_user
    ):
        """Requesting fields=id,name,comment_count returns only those fields."""
        IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Comment</p>",
            created_by=create_user,
        )

        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"fields": "id,name,comment_count"})

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        assert len(results) == 1
        assert set(results[0].keys()) == {"id", "name", "comment_count"}
        assert results[0]["comment_count"] == 1

    @pytest.mark.django_db
    def test_issue_detail_exposes_comment_count(
        self, api_key_client, workspace, project, issue, create_user
    ):
        """Work item detail endpoint also exposes comment_count."""
        IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Comment</p>",
            created_by=create_user,
        )

        url = self.get_detail_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("comment_count") == 1
