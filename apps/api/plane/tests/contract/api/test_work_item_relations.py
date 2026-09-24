# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State


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
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue1(db, workspace, project, state, create_user):
    return Issue.objects.create(
        name="Issue One",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.fixture
def issue2(db, workspace, project, state, create_user):
    return Issue.objects.create(
        name="Issue Two",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestWorkItemRelationRemove:
    """Tests for work-item relation remove endpoint:
    POST /api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/relations/remove/
    """

    def get_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/relations/remove/"

    @pytest.mark.django_db
    def test_remove_relation_success(self, api_key_client, workspace, project, issue1, issue2, create_user):
        relation = IssueRelation.objects.create(
            issue=issue1,
            related_issue=issue2,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            url = self.get_url(workspace.slug, project.id, issue1.id)
            response = api_key_client.post(url, {"related_issue": str(issue2.id)}, format="json")

            assert response.status_code == status.HTTP_204_NO_CONTENT
            assert not IssueRelation.objects.filter(id=relation.id).exists()
            mock_issue_activity.delay.assert_called_once()
            kwargs = mock_issue_activity.delay.call_args.kwargs
            payload = json.loads(kwargs["requested_data"])
            assert payload["related_issue"] == str(issue2.id)
            assert payload["relation_type"] == "blocked_by"

    @pytest.mark.django_db
    def test_remove_relation_reverse(self, api_key_client, workspace, project, issue1, issue2, create_user):
        relation = IssueRelation.objects.create(
            issue=issue1,
            related_issue=issue2,
            relation_type="blocked_by",
            project=project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        # Remove from the other issue's perspective
        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            url = self.get_url(workspace.slug, project.id, issue2.id)
            response = api_key_client.post(url, {"related_issue": str(issue1.id)}, format="json")

            assert response.status_code == status.HTTP_204_NO_CONTENT
            assert not IssueRelation.objects.filter(id=relation.id).exists()
            mock_issue_activity.delay.assert_called_once()
            kwargs = mock_issue_activity.delay.call_args.kwargs
            payload = json.loads(kwargs["requested_data"])
            assert payload["related_issue"] == str(issue1.id)
            assert payload["relation_type"] == "blocking"

    @pytest.mark.django_db
    def test_remove_relation_not_found(self, api_key_client, workspace, project, issue1, issue2):
        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.post(url, {"related_issue": str(issue2.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_remove_relation_missing_related_issue(self, api_key_client, workspace, project, issue1):
        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_remove_relation_delete_method(self, api_key_client, workspace, project, issue1, issue2, create_user):
        relation = IssueRelation.objects.create(
            issue=issue1,
            related_issue=issue2,
            relation_type="relates_to",
            project=project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.delete(url, {"related_issue": str(issue2.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueRelation.objects.filter(id=relation.id).exists()

    @pytest.mark.django_db
    def test_remove_relation_list_body_returns_400(self, api_key_client, workspace, project, issue1):
        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.post(url, [{"related_issue": "550e8400-e29b-41d4-a716-446655440000"}], format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_remove_relation_invalid_uuid_returns_400(self, api_key_client, workspace, project, issue1):
        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.post(url, {"related_issue": "invalid-uuid"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_remove_relation_cross_project_scoped_to_route_project(
        self, api_key_client, workspace, project, issue1, issue2, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        relation = IssueRelation.objects.create(
            issue=issue1,
            related_issue=issue2,
            relation_type="relates_to",
            project=other_project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        # Attempt to delete relation owned by other_project through project URL
        url = self.get_url(workspace.slug, project.id, issue1.id)
        response = api_key_client.post(url, {"related_issue": str(issue2.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueRelation.objects.filter(id=relation.id).exists()

