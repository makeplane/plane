# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the v1 state endpoints' write authorization and default handling.

State writes are project-admin-only, matching the app API and the settings UI. The v1
endpoints used ``ProjectEntityPermission``, which also let project members write.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import State
from plane.db.models.api import APIToken
from plane.tests.factories import ProjectFactory, ProjectMemberFactory, UserFactory, WorkspaceMemberFactory

ADMIN, MEMBER = 20, 15


def _states_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/states/"


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
    return State.objects.create(
        name="Backlog", color="#60646C", group="backlog", project=project, external_source="gh", external_id="1"
    )


@pytest.fixture
def member_client(workspace, project):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=MEMBER)
    ProjectMemberFactory(project=project, member=user, role=MEMBER)
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=APIToken.objects.create(user=user).token)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestStateV1AdminScope:
    def test_member_can_read_but_not_write_states(self, member_client, workspace, project, state):
        list_url = _states_url(workspace.slug, project.id)
        detail_url = f"{list_url}{state.id}/"

        reads = [member_client.get(list_url), member_client.get(detail_url)]
        writes = [
            member_client.post(list_url, {"name": "New", "color": "#ffffff", "group": "started"}, format="json"),
            member_client.patch(detail_url, {"name": "Renamed", "default": True}, format="json"),
            member_client.delete(detail_url),
        ]

        assert [r.status_code for r in reads] == [status.HTTP_200_OK] * 2
        assert [r.status_code for r in writes] == [status.HTTP_403_FORBIDDEN] * 3

        state.refresh_from_db()
        assert (state.name, state.default) == ("Backlog", False)
        assert State.objects.filter(project=project).count() == 1

    def test_admin_patch_default_keeps_one_default(self, api_key_client, workspace, project, default_state, state):
        response = api_key_client.patch(
            f"{_states_url(workspace.slug, project.id)}{state.id}/", {"default": True}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert list(State.objects.filter(project=project, default=True)) == [state]

    def test_admin_create_conflict_keeps_default(self, api_key_client, workspace, project, default_state, state):
        payload = {
            "name": "New",
            "color": "#ffffff",
            "group": "started",
            "default": True,
            "external_source": "gh",
            "external_id": "1",
        }
        response = api_key_client.post(_states_url(workspace.slug, project.id), payload, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT, response.data
        assert list(State.objects.filter(project=project, default=True)) == [default_state]
