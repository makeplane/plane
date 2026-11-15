# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The project member endpoints give workspace guests no member email addresses,
matching the web app's workspace member list, and the project member list only
returns active members."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Project, ProjectMember, User, WorkspaceMember

LIST_ROUTES = ["members", "project-members", "project-members-lite"]


def _url(project, route):
    return f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/{route}/"


def _members(response):
    assert response.status_code == status.HTTP_200_OK, response.data
    return response.data["results"] if isinstance(response.data, dict) else response.data


def _project_user(project, role, is_active=True):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=project.workspace, member=user, role=role)
    ProjectMember.objects.create(
        project=project, member=user, workspace=project.workspace, role=role, is_active=is_active
    )
    return user


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Members Project", identifier="MP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def guest_client(project):
    guest = _project_user(project, role=5)
    token = APIToken.objects.create(user=guest, label="Guest token", token=f"guest-token-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberEmailGuestScope:
    @pytest.mark.parametrize("route", LIST_ROUTES)
    def test_guest_gets_no_member_emails(self, guest_client, project, route):
        members = _members(guest_client.get(_url(project, route)))

        assert len(members) == 2
        for member in members:
            assert "email" not in member
            assert "display_name" in member

    def test_guest_gets_no_email_on_member_detail(self, guest_client, project, create_user):
        membership = ProjectMember.objects.get(project=project, member=create_user)

        response = guest_client.get(_url(project, f"members/{membership.id}"))

        assert response.status_code == status.HTTP_200_OK, response.data
        assert "email" not in response.data
        assert response.data["id"] == create_user.id

    @pytest.mark.parametrize("route", LIST_ROUTES)
    def test_admin_still_gets_member_emails(self, api_key_client, project, create_user, route):
        members = _members(api_key_client.get(_url(project, route)))

        assert [member["email"] for member in members] == [create_user.email]

    @pytest.mark.parametrize("route", ["members", "project-members"])
    def test_deactivated_member_is_not_listed(self, api_key_client, project, create_user, route):
        _project_user(project, role=15, is_active=False)

        members = _members(api_key_client.get(_url(project, route)))

        assert [member["id"] for member in members] == [create_user.id]
