# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    IssueType,
    ProjectIssueType,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)
from plane.db.models.api import APIToken
from plane.utils.issue_type import create_default_issue_types


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member"""
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
def member_key_client(db, workspace, project):
    """Return an API key client authenticated as a project member (role 15)"""
    member = User.objects.create(
        email=f"member-{uuid4().hex[:8]}@plane.so", username=f"member-{uuid4().hex[:12]}", first_name="Member"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
    ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
    token = APIToken.objects.create(user=member, label="Member Token", token=f"member-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def types_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-item-types/"


def type_detail_url(slug, project_id, type_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-item-types/{type_id}/"


@pytest.mark.contract
class TestWorkItemTypeListCreateAPIEndpoint:
    @pytest.mark.django_db
    def test_create_success(self, api_key_client, workspace, project):
        response = api_key_client.post(
            types_url(workspace.slug, project.id),
            {"name": "Bug"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Bug"
        assert ProjectIssueType.objects.filter(
            project=project, issue_type_id=response.data["id"]
        ).exists()

    @pytest.mark.django_db
    def test_create_member_forbidden(self, member_key_client, workspace, project):
        response = member_key_client.post(
            types_url(workspace.slug, project.id),
            {"name": "Bug"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_success(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        response = api_key_client.get(types_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 2

    @pytest.mark.django_db
    def test_resolve_by_name(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        response = api_key_client.get(types_url(workspace.slug, project.id) + "?name=Epic")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Epic"
        assert response.data["is_epic"] is True

    @pytest.mark.django_db
    def test_resolve_by_name_not_found(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        response = api_key_client.get(types_url(workspace.slug, project.id) + "?name=Nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestWorkItemTypeDetailAPIEndpoint:
    @pytest.mark.django_db
    def test_get_success(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        issue_type = IssueType.objects.get(project_issue_types__project=project, is_epic=True)
        response = api_key_client.get(type_detail_url(workspace.slug, project.id, issue_type.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == issue_type.id

    @pytest.mark.django_db
    def test_update_success(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        epic = IssueType.objects.get(project_issue_types__project=project, is_epic=True)
        response = api_key_client.patch(
            type_detail_url(workspace.slug, project.id, epic.id),
            {"description": "An epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        epic.refresh_from_db()
        assert epic.description == "An epic"

    @pytest.mark.django_db
    def test_cannot_delete_default(self, api_key_client, workspace, project):
        create_default_issue_types(project)
        default_type = IssueType.objects.get(project_issue_types__project=project, is_default=True)
        response = api_key_client.delete(type_detail_url(workspace.slug, project.id, default_type.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_success(self, api_key_client, workspace, project):
        epic = IssueType.objects.create(workspace=workspace, name="Epic", is_epic=True)
        ProjectIssueType.objects.create(project=project, issue_type=epic, is_default=False)
        response = api_key_client.delete(type_detail_url(workspace.slug, project.id, epic.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueType.objects.filter(id=epic.id).exists()
