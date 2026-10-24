# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for StateViewSet write authorization and default-state handling.

State configuration (create, edit, delete, set default) is project-admin-only, matching
the project settings UI. ``partial_update`` used to allow [ADMIN, MEMBER, GUEST], and
because ``default`` was writable it also let them switch the project's default state.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import State
from plane.tests.factories import ProjectFactory, ProjectMemberFactory, UserFactory, WorkspaceMemberFactory

ADMIN, MEMBER, GUEST = 20, 15, 5


def _state_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/states/{pk}/"


def _client_for(workspace, project, *, workspace_role, project_role):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=workspace_role)
    ProjectMemberFactory(project=project, member=user, role=project_role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    project = ProjectFactory(workspace=workspace, identifier="ST")
    ProjectMemberFactory(project=project, member=create_user, role=ADMIN)
    return project


@pytest.fixture
def default_state(project):
    return State.objects.create(name="Todo", color="#000000", group="unstarted", default=True, project=project)


@pytest.fixture
def state(project):
    return State.objects.create(name="Backlog", color="#60646C", group="backlog", project=project)


@pytest.mark.contract
@pytest.mark.django_db
class TestStateWriteAdminScope:
    @pytest.mark.parametrize("role", [GUEST, MEMBER])
    def test_non_admin_cannot_patch_state(self, workspace, project, state, role):
        client = _client_for(workspace, project, workspace_role=role, project_role=role)
        response = client.patch(
            _state_url(workspace.slug, project.id, state.id), {"name": "Renamed", "default": True}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
        state.refresh_from_db()
        assert (state.name, state.default) == ("Backlog", False)

    def test_project_admin_can_patch_state(self, workspace, project, state):
        client = _client_for(workspace, project, workspace_role=MEMBER, project_role=ADMIN)
        response = client.patch(_state_url(workspace.slug, project.id, state.id), {"name": "Renamed"}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        state.refresh_from_db()
        assert state.name == "Renamed"

    def test_workspace_admin_in_project_can_patch_state(self, workspace, project, state):
        client = _client_for(workspace, project, workspace_role=ADMIN, project_role=MEMBER)
        response = client.patch(_state_url(workspace.slug, project.id, state.id), {"name": "Renamed"}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data

    def test_patch_cannot_set_default(self, session_client, workspace, project, default_state, state):
        response = session_client.patch(
            _state_url(workspace.slug, project.id, state.id), {"default": True}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert list(State.objects.filter(project=project, default=True)) == [default_state]

    def test_mark_as_default_moves_the_default(self, session_client, workspace, project, default_state, state):
        response = session_client.post(f"{_state_url(workspace.slug, project.id, state.id)}mark-default/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert list(State.objects.filter(project=project, default=True)) == [state]

    def test_mark_as_default_unknown_state_404s(self, session_client, workspace, project, default_state):
        response = session_client.post(f"{_state_url(workspace.slug, project.id, uuid4())}mark-default/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert list(State.objects.filter(project=project, default=True)) == [default_state]
