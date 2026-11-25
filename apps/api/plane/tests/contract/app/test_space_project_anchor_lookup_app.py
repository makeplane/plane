# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for looking up a published project's anchor by project id.

``/api/public/workspaces/<slug>/projects/<project_id>/anchor/`` turns a project id
into the board's share link, so only active project members may use it. Anyone
else is refused, and a signed-in non-member gets the same 404 as for a project
that was never published.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, Project, ProjectMember, User, WorkspaceMember


def _anchor_url(slug, project_id):
    return f"/api/public/workspaces/{slug}/projects/{project_id}/anchor/"


@pytest.fixture
def project(db, workspace):
    return Project.objects.create(name="Secret Project", identifier="SEC", workspace=workspace, network=0)


@pytest.fixture
def board(db, workspace, project):
    return DeployBoard.objects.create(
        workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
    )


def _workspace_member_client(workspace, project=None, is_active=True):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    if project:
        ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=15, is_active=is_active)
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectAnchorLookup:
    def test_project_member_gets_anchor(self, workspace, project, board):
        client, _ = _workspace_member_client(workspace, project)

        response = client.get(_anchor_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["anchor"] == board.anchor

    def test_anonymous_user_is_refused(self, workspace, project, board):
        response = APIClient().get(_anchor_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "anchor" not in response.data

    def test_non_member_gets_unpublished_response(self, workspace, project, board):
        client, user = _workspace_member_client(workspace)
        unpublished = Project.objects.create(name="Unpublished", identifier="UNP", workspace=workspace)
        ProjectMember.objects.create(project=unpublished, member=user, workspace=workspace)

        published_response = client.get(_anchor_url(workspace.slug, project.id))
        unpublished_response = client.get(_anchor_url(workspace.slug, unpublished.id))

        assert published_response.status_code == status.HTTP_404_NOT_FOUND
        assert published_response.data == unpublished_response.data

    def test_inactive_member_is_refused(self, workspace, project, board):
        client, _ = _workspace_member_client(workspace, project, is_active=False)

        response = client.get(_anchor_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND
