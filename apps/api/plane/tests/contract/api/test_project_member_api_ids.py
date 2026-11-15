# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project member API identifiers."""

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember


def members_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/members/"


def project_members_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/project-members/"


def project_members_lite_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/project-members-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Project Member IDs",
        identifier="PMI",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.mark.contract
class TestProjectMemberIdentifiers:
    @pytest.mark.django_db
    def test_project_member_list_exposes_membership_id(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(members_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

        member = response.data[0]
        project_member = ProjectMember.objects.get(
            project=project,
            member=create_user,
        )

        assert str(member["id"]) == str(create_user.id)
        assert str(member["project_member_id"]) == str(project_member.id)

    @pytest.mark.django_db
    def test_project_members_alias_exposes_membership_id(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(project_members_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

        member = response.data[0]
        project_member = ProjectMember.objects.get(
            project=project,
            member=create_user,
        )

        assert str(member["id"]) == str(create_user.id)
        assert str(member["project_member_id"]) == str(project_member.id)

    @pytest.mark.django_db
    def test_project_member_id_from_list_can_retrieve_member(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(members_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        project_member_id = response.data[0]["project_member_id"]

        detail_response = api_key_client.get(f"{members_url(workspace.slug, project.id)}{project_member_id}/")

        assert detail_response.status_code == status.HTTP_200_OK
        assert str(detail_response.data["id"]) == str(create_user.id)
        assert str(detail_response.data["project_member_id"]) == str(project_member_id)

    @pytest.mark.django_db
    def test_project_member_id_from_list_can_update_member(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(members_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        project_member_id = response.data[0]["project_member_id"]

        update_response = api_key_client.patch(
            f"{members_url(workspace.slug, project.id)}{project_member_id}/",
            {"role": 15},
            format="json",
        )

        assert update_response.status_code == status.HTTP_200_OK
        assert str(update_response.data["id"]) == str(project_member_id)
        assert update_response.data["role"] == 15

        project_member = ProjectMember.objects.get(id=project_member_id)
        assert project_member.role == 15

    @pytest.mark.django_db
    def test_project_member_id_from_list_can_delete_member(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(members_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        project_member_id = response.data[0]["project_member_id"]

        delete_response = api_key_client.delete(f"{members_url(workspace.slug, project.id)}{project_member_id}/")

        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        project_member = ProjectMember.objects.get(id=project_member_id)
        assert project_member.is_active is False

    @pytest.mark.django_db
    def test_project_member_lite_exposes_membership_id(self, api_key_client, workspace, project, create_user):
        response = api_key_client.get(project_members_lite_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 1

        member = response.data["results"][0]
        project_member = ProjectMember.objects.get(
            project=project,
            member=create_user,
        )

        assert str(member["id"]) == str(create_user.id)
        assert str(member["project_member_id"]) == str(project_member.id)
