# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for who may change a project's publish settings.

Publishing a project (create), editing its publish settings (partial_update)
and unpublishing it (destroy) are project-admin actions, matching the web app,
which offers "Publish project" to project admins only. Project members keep
read access to the publish settings.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, Project, ProjectMember, User, WorkspaceMember


def _boards_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/project-deploy-boards/"


def _board_url(slug, project_id, pk):
    return f"{_boards_url(slug, project_id)}{pk}/"


@pytest.fixture
def project(db, workspace):
    return Project.objects.create(name="Board Project", identifier="BP", workspace=workspace)


def _client_with_project_role(workspace, project, role):
    """Session client for a workspace MEMBER holding ``role`` on ``project``."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestDeployBoardAdminOnly:
    def test_project_member_cannot_change_publish_settings(self, workspace, project):
        client = _client_with_project_role(workspace, project, role=15)

        response = client.post(_boards_url(workspace.slug, project.id), {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
        assert not DeployBoard.objects.filter(project=project).exists()

        board = DeployBoard.objects.create(
            workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
        )

        response = client.patch(
            _board_url(workspace.slug, project.id, board.id), {"is_comments_enabled": True}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
        board.refresh_from_db()
        assert board.is_comments_enabled is False

        response = client.delete(_board_url(workspace.slug, project.id, board.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
        assert DeployBoard.objects.filter(pk=board.id).exists()

        # Reads are unchanged for project members.
        response = client.get(_boards_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK, response.data

    def test_project_admin_can_change_publish_settings(self, workspace, project):
        client = _client_with_project_role(workspace, project, role=20)

        response = client.post(_boards_url(workspace.slug, project.id), {}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        board = DeployBoard.objects.get(project=project)

        response = client.patch(
            _board_url(workspace.slug, project.id, board.id), {"is_comments_enabled": True}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        board.refresh_from_db()
        assert board.is_comments_enabled is True

        response = client.delete(_board_url(workspace.slug, project.id, board.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, response.data
        assert not DeployBoard.objects.filter(pk=board.id).exists()
