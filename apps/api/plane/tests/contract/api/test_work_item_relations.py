# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State


def _make_project(workspace, create_user, name, identifier):
    """Create a project with the requesting user as an active admin member."""
    project = Project.objects.create(
        name=name,
        identifier=identifier,
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    # A default state is required for work items created in the project
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
def project(db, workspace, create_user):
    return _make_project(workspace, create_user, "Test Project", "TP")


@pytest.fixture
def other_project(db, workspace, create_user):
    """A second project in the same workspace, so relations can cross projects."""
    return _make_project(workspace, create_user, "Other Project", "OP")


@pytest.fixture
def issue(db, workspace, project, create_user):
    return Issue.objects.create(
        name="Blocked Issue",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def related_issue(db, workspace, project, create_user):
    return Issue.objects.create(
        name="Blocking Issue",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.mark.contract
class TestWorkItemRelationRemoveContract:
    """
    Contract: the documented relation removal endpoint

    ``POST /api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/relations/remove/``

    exists on the external REST API, so relations created through the API can
    also be removed through it. See makeplane/plane#9584.
    """

    def get_remove_url(self, workspace_slug, project_id, issue_id):
        """Helper to build the relation removal endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/relations/remove/"

    def get_list_url(self, workspace_slug, project_id, issue_id):
        """Helper to build the relation list/create endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/relations/"

    @pytest.mark.django_db
    def test_remove_relation_returns_204_and_deletes_the_relation(
        self, api_key_client, workspace, project, issue, related_issue
    ):
        """The relation stored from the work item in the path is removed."""
        IssueRelation.objects.create(
            issue=issue,
            related_issue=related_issue,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {"related_issue": str(related_issue.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        assert not IssueRelation.objects.filter(issue=issue, related_issue=related_issue).exists()

    @pytest.mark.django_db
    def test_remove_relation_matches_the_reverse_direction(
        self, api_key_client, workspace, project, issue, related_issue
    ):
        """A relation stored the other way round is removable from either side.

        ``blocked_by`` is stored once, so the work item on the ``blocking`` side
        has to match on ``related_issue_id`` instead of ``issue_id``.
        """
        IssueRelation.objects.create(
            issue=related_issue,
            related_issue=issue,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {"related_issue": str(related_issue.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        assert not IssueRelation.objects.filter(issue=related_issue, related_issue=issue).exists()

    @pytest.mark.django_db
    def test_remove_relation_across_projects(
        self, api_key_client, workspace, project, other_project, issue, create_user
    ):
        """Relations may cross projects, so removal is scoped to the workspace."""
        cross_project_issue = Issue.objects.create(
            name="Cross Project Issue",
            project=other_project,
            workspace=workspace,
            created_by=create_user,
        )
        IssueRelation.objects.create(
            issue=issue,
            related_issue=cross_project_issue,
            relation_type="relates_to",
            project=project,
            workspace=workspace,
        )
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {"related_issue": str(cross_project_issue.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        assert not IssueRelation.objects.filter(issue=issue, related_issue=cross_project_issue).exists()

    @pytest.mark.django_db
    def test_remove_missing_relation_returns_404(self, api_key_client, workspace, project, issue, related_issue):
        """No matching relation is a 404, not an unhandled AttributeError → 500."""
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {"related_issue": str(related_issue.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_remove_relation_for_work_item_outside_the_project_returns_404(
        self, api_key_client, workspace, project, other_project, related_issue, create_user
    ):
        """The work item in the path has to belong to the project in the path.

        Otherwise membership of the path project would authorize removing
        relations of work items in projects the caller cannot see.
        """
        foreign_issue = Issue.objects.create(
            name="Foreign Issue",
            project=other_project,
            workspace=workspace,
            created_by=create_user,
        )
        IssueRelation.objects.create(
            issue=foreign_issue,
            related_issue=related_issue,
            relation_type="blocked_by",
            project=other_project,
            workspace=workspace,
        )
        url = self.get_remove_url(workspace.slug, project.id, foreign_issue.id)

        response = api_key_client.post(url, {"related_issue": str(related_issue.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"
        assert IssueRelation.objects.filter(issue=foreign_issue, related_issue=related_issue).exists()

    @pytest.mark.django_db
    def test_remove_relation_without_related_issue_returns_400(self, api_key_client, workspace, project, issue):
        """``related_issue`` is required."""
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, f"Got {response.status_code}: {response.data!r}"
        assert "related_issue" in response.data

    @pytest.mark.django_db
    def test_remove_relation_with_malformed_related_issue_returns_400(self, api_key_client, workspace, project, issue):
        """A non-UUID ``related_issue`` is rejected before the database is touched."""
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        response = api_key_client.post(url, {"related_issue": "not-a-uuid"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_remove_relation_dispatches_deletion_activity(
        self, api_key_client, workspace, project, issue, related_issue
    ):
        """Removal records activity for both work items, like the web app does."""
        IssueRelation.objects.create(
            issue=related_issue,
            related_issue=issue,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
        )
        url = self.get_remove_url(workspace.slug, project.id, issue.id)

        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            response = api_key_client.post(url, {"related_issue": str(related_issue.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"

        mock_issue_activity.delay.assert_called_once()
        kwargs = mock_issue_activity.delay.call_args.kwargs
        assert kwargs["type"] == "issue_relation.activity.deleted"
        assert kwargs["notification"] is True
        # The activity feed needs the relation type as seen from the work item
        # in the path, which is the inverse of how this one is stored.
        assert '"relation_type": "blocking"' in kwargs["requested_data"]

    @pytest.mark.django_db
    def test_relation_round_trip_through_the_public_api(self, api_key_client, workspace, project, issue, related_issue):
        """Create, read and remove a relation using only documented endpoints."""
        list_url = self.get_list_url(workspace.slug, project.id, issue.id)

        create_response = api_key_client.post(
            list_url,
            {"relation_type": "blocked_by", "issues": [str(related_issue.id)]},
            format="json",
        )
        assert create_response.status_code == status.HTTP_201_CREATED

        read_response = api_key_client.get(list_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert [ref["issue_id"] for ref in read_response.data["blocked_by"]] == [str(related_issue.id)]

        remove_response = api_key_client.post(
            self.get_remove_url(workspace.slug, project.id, issue.id),
            {"related_issue": str(related_issue.id)},
            format="json",
        )
        assert remove_response.status_code == status.HTTP_204_NO_CONTENT

        read_response = api_key_client.get(list_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data["blocked_by"] == []
