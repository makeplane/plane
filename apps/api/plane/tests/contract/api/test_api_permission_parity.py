# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: v1 cycle, label and project-member writes follow the app API's rules.

- A cycle can be deleted by a project admin or its creator; an update never changes the owner
  unless one is sent.
- Label writes are project-admin-only. As in the app, a workspace admin who is a project member counts as admin.
- Only active workspace members can be added to a project or have their project role changed.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Cycle, Label, ProjectMember
from plane.db.models.api import APIToken
from plane.tests.factories import ProjectFactory, ProjectMemberFactory, UserFactory, WorkspaceMemberFactory

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture
def project(db, workspace, create_user):
    project = ProjectFactory(workspace=workspace, identifier="PP", cycle_view=True)
    ProjectMemberFactory(project=project, member=create_user, role=ADMIN)
    return project


@pytest.fixture
def member_user(workspace, project):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=MEMBER)
    ProjectMemberFactory(project=project, member=user, role=MEMBER)
    return user


@pytest.fixture
def member_client(member_user):
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=APIToken.objects.create(user=member_user).token)
    return client


def _client_for_workspace_admin(workspace, project, project_role):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=ADMIN)
    if project_role is not None:
        ProjectMemberFactory(project=project, member=user, role=project_role)
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=APIToken.objects.create(user=user).token)
    return client


def _project_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}"


def _cycle(project, owner, creator):
    cycle = Cycle(name="Sprint", project=project, owned_by=owner)
    cycle.save(created_by_id=creator.id)
    return cycle


@pytest.mark.contract
@pytest.mark.django_db
class TestCycleDeleteAndOwner:
    def test_update_without_owner_keeps_owner(self, member_client, workspace, project, create_user):
        cycle = _cycle(project, owner=create_user, creator=create_user)
        url = f"{_project_url(workspace, project)}/cycles/{cycle.id}/"

        response = member_client.patch(url, {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK, response.data
        cycle.refresh_from_db()
        assert (cycle.name, cycle.owned_by_id) == ("Renamed", create_user.id)

    def test_update_with_null_owner_assigns_requester(
        self, member_client, workspace, project, create_user, member_user
    ):
        cycle = _cycle(project, owner=create_user, creator=create_user)
        url = f"{_project_url(workspace, project)}/cycles/{cycle.id}/"

        response = member_client.patch(url, {"name": "Renamed", "owned_by": None}, format="json")

        assert response.status_code == status.HTTP_200_OK, response.data
        cycle.refresh_from_db()
        assert (cycle.name, cycle.owned_by_id) == ("Renamed", member_user.id)

    def test_cycle_delete_requires_admin_or_creator(self, member_client, workspace, project, create_user):
        cycle = _cycle(project, owner=create_user, creator=create_user)
        response = member_client.delete(f"{_project_url(workspace, project)}/cycles/{cycle.id}/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Cycle.objects.filter(id=cycle.id).exists()

    def test_owner_who_is_not_creator_cannot_delete(self, member_client, workspace, project, create_user, member_user):
        cycle = _cycle(project, owner=member_user, creator=create_user)
        response = member_client.delete(f"{_project_url(workspace, project)}/cycles/{cycle.id}/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Cycle.objects.filter(id=cycle.id).exists()

    def test_creator_can_delete(self, member_client, workspace, project, create_user, member_user):
        cycle = _cycle(project, owner=create_user, creator=member_user)
        response = member_client.delete(f"{_project_url(workspace, project)}/cycles/{cycle.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Cycle.objects.filter(id=cycle.id).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestLabelWritesAdminOnly:
    def test_member_can_read_but_not_write_labels(self, member_client, workspace, project):
        label = Label.objects.create(name="bug", color="#ff0000", project=project)
        list_url = f"{_project_url(workspace, project)}/labels/"
        detail_url = f"{list_url}{label.id}/"

        reads = [member_client.get(list_url), member_client.get(detail_url)]
        writes = [
            member_client.post(list_url, {"name": "feature", "color": "#00ff00"}, format="json"),
            member_client.patch(detail_url, {"name": "renamed"}, format="json"),
            member_client.delete(detail_url),
        ]

        assert [r.status_code for r in reads] == [status.HTTP_200_OK] * 2
        assert [r.status_code for r in writes] == [status.HTTP_403_FORBIDDEN] * 3
        label.refresh_from_db()
        assert label.name == "bug"
        assert Label.objects.filter(project=project).count() == 1


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceAdminCountsAsProjectAdmin:
    @pytest.mark.parametrize(
        "project_role, expected", [(MEMBER, status.HTTP_201_CREATED), (None, status.HTTP_403_FORBIDDEN)]
    )
    def test_label_create(self, workspace, project, project_role, expected):
        client = _client_for_workspace_admin(workspace, project, project_role)

        response = client.post(
            f"{_project_url(workspace, project)}/labels/", {"name": "feature", "color": "#00ff00"}, format="json"
        )

        assert response.status_code == expected, response.data
        assert Label.objects.filter(project=project, name="feature").exists() is (expected == status.HTTP_201_CREATED)

    def test_cycle_delete(self, workspace, project, create_user):
        client = _client_for_workspace_admin(workspace, project, MEMBER)
        cycle = _cycle(project, owner=create_user, creator=create_user)

        response = client.delete(f"{_project_url(workspace, project)}/cycles/{cycle.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Cycle.objects.filter(id=cycle.id).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectMemberWritesRequireActiveWorkspaceMember:
    @pytest.mark.parametrize(
        "is_active, expected", [(False, status.HTTP_400_BAD_REQUEST), (True, status.HTTP_201_CREATED)]
    )
    def test_add_member(self, api_key_client, workspace, project, is_active, expected):
        user = UserFactory()
        WorkspaceMemberFactory(workspace=workspace, member=user, role=MEMBER, is_active=is_active)

        response = api_key_client.post(
            f"{_project_url(workspace, project)}/members/", {"member": str(user.id), "role": MEMBER}, format="json"
        )

        assert response.status_code == expected, response.data
        assert ProjectMember.objects.filter(project=project, member=user).exists() is is_active

    @pytest.mark.parametrize("is_active, expected", [(False, status.HTTP_400_BAD_REQUEST), (True, status.HTTP_200_OK)])
    def test_role_only_update(self, api_key_client, workspace, project, is_active, expected):
        user = UserFactory()
        WorkspaceMemberFactory(workspace=workspace, member=user, role=MEMBER, is_active=is_active)
        project_member = ProjectMemberFactory(project=project, member=user, role=MEMBER)

        response = api_key_client.patch(
            f"{_project_url(workspace, project)}/members/{project_member.id}/", {"role": GUEST}, format="json"
        )

        assert response.status_code == expected, response.data
        project_member.refresh_from_db()
        assert project_member.role == (GUEST if is_active else MEMBER)
