# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueType,
    ProjectIssueType,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)


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
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def member_client(db, workspace, project):
    """Return a session client authenticated as a project member (role 15)"""
    member = User.objects.create(email=f"member-{uuid4().hex[:8]}@plane.so", first_name="Member")
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
    ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=member)
    return client


def issue_types_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issue-types/"


def issue_type_detail_url(slug, project_id, type_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issue-types/{type_id}/"


def enable_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issue-types/enable/"


@pytest.mark.contract
class TestIssueTypeActivation:
    @pytest.mark.django_db
    def test_enable_seeds_default_and_epic(self, session_client, workspace, project):
        response = session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        assert response.status_code == status.HTTP_200_OK

        project.refresh_from_db()
        assert project.is_issue_type_enabled is True

        # A default "Work Item" type and an "Epic" type must be seeded
        assert ProjectIssueType.objects.filter(project=project, is_default=True).count() == 1
        assert IssueType.objects.filter(
            project_issue_types__project=project, is_epic=True
        ).count() == 1
        assert IssueType.objects.filter(project_issue_types__project=project).count() == 2

    @pytest.mark.django_db
    def test_enable_is_idempotent(self, session_client, workspace, project):
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")

        # Seeding must not duplicate the default and epic types
        assert IssueType.objects.filter(project_issue_types__project=project).count() == 2

    @pytest.mark.django_db
    def test_enable_requires_admin(self, member_client, workspace, project):
        response = member_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestIssueTypeCRUD:
    @pytest.mark.django_db
    def test_create_type_admin_success(self, session_client, workspace, project):
        response = session_client.post(
            issue_types_url(workspace.slug, project.id),
            {"name": "Bug", "is_default": False},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Bug"
        # The link row must exist
        assert ProjectIssueType.objects.filter(
            project=project, issue_type_id=response.data["id"]
        ).exists()

    @pytest.mark.django_db
    def test_create_type_member_forbidden(self, member_client, workspace, project):
        response = member_client.post(
            issue_types_url(workspace.slug, project.id),
            {"name": "Bug"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_member_can_list(self, member_client, session_client, workspace, project):
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        response = member_client.get(issue_types_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    @pytest.mark.django_db
    def test_only_one_default_per_project(self, session_client, workspace, project):
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        # Create a new type and mark it default
        response = session_client.post(
            issue_types_url(workspace.slug, project.id),
            {"name": "Story", "is_default": True},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

        # Exactly one default must remain
        assert IssueType.objects.filter(
            project_issue_types__project=project, is_default=True
        ).count() == 1
        assert ProjectIssueType.objects.filter(project=project, is_default=True).count() == 1
        # The new type is the default
        default_type = IssueType.objects.get(project_issue_types__project=project, is_default=True)
        assert default_type.name == "Story"

    @pytest.mark.django_db
    def test_cannot_delete_default(self, session_client, workspace, project):
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        default_type = IssueType.objects.get(project_issue_types__project=project, is_default=True)

        response = session_client.delete(issue_type_detail_url(workspace.slug, project.id, default_type.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueType.objects.filter(id=default_type.id).exists()

    @pytest.mark.django_db
    def test_cannot_deactivate_default(self, session_client, workspace, project):
        session_client.post(enable_url(workspace.slug, project.id), {}, format="json")
        default_type = IssueType.objects.get(project_issue_types__project=project, is_default=True)

        response = session_client.patch(
            issue_type_detail_url(workspace.slug, project.id, default_type.id),
            {"is_active": False},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        default_type.refresh_from_db()
        assert default_type.is_active is True

    @pytest.mark.django_db
    def test_is_epic_immutable(self, session_client, workspace, project):
        response = session_client.post(
            issue_types_url(workspace.slug, project.id),
            {"name": "Task", "is_epic": False},
            format="json",
        )
        type_id = response.data["id"]

        # Attempting to flip is_epic must be ignored
        response = session_client.patch(
            issue_type_detail_url(workspace.slug, project.id, type_id),
            {"is_epic": True, "description": "changed"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        issue_type = IssueType.objects.get(id=type_id)
        assert issue_type.is_epic is False
        assert issue_type.description == "changed"

    @pytest.mark.django_db
    def test_issue_detail_exposes_type_id(self, session_client, workspace, project):
        issue_type = IssueType.objects.create(workspace=workspace, name="Work Item", is_default=True)
        ProjectIssueType.objects.create(project=project, issue_type=issue_type, is_default=True)
        issue = Issue.objects.create(name="Issue 1", project=project, type=issue_type)

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "type_id" in response.data
        assert str(response.data["type_id"]) == str(issue_type.id)

    @pytest.mark.django_db
    def test_delete_is_soft(self, session_client, workspace, project):
        response = session_client.post(
            issue_types_url(workspace.slug, project.id),
            {"name": "Temp"},
            format="json",
        )
        type_id = response.data["id"]

        response = session_client.delete(issue_type_detail_url(workspace.slug, project.id, type_id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Soft deleted: excluded from default manager, still present in all_objects
        assert not IssueType.objects.filter(id=type_id).exists()
        assert IssueType.all_objects.filter(id=type_id).exists()
