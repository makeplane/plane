# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for DeployBoardViewSet object scoping.

``DeployBoardViewSet`` defines only
``list``/``create``; the routed ``retrieve``/``partial_update``/``destroy`` fall
through to DRF's ``ModelViewSet`` defaults, which resolve the object via
``get_object()`` -> ``get_queryset()``. The base ``get_queryset`` returns
``DeployBoard.objects.all()`` (every workspace), and ``ProjectMemberPermission``
only checks the URL slug/project_id. So any authenticated user could supply their
own workspace+project in the URL and a victim board's pk to read/modify/hard-delete
another workspace's published board.

The fix scopes ``get_queryset`` to the URL workspace + project, so a foreign pk
404s.
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import DeployBoard, Project, ProjectMember, User, Workspace, WorkspaceMember


def _board_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/project-deploy-boards/{pk}/"


def _board_for(workspace, project):
    return DeployBoard.objects.create(
        workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
    )


@pytest.fixture
def project_a(db, workspace, create_user):
    """The attacker's own project; create_user (session_client) is a member."""
    project = Project.objects.create(
        name="Attacker Project", identifier="ATK", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def own_board(db, workspace, project_a):
    return _board_for(workspace, project_a)


@pytest.fixture
def sibling_board(db, workspace, create_user):
    """A board for a DIFFERENT project in the SAME workspace as project_a.

    Guards the project predicate specifically: a workspace-slug-only scope would
    still expose this board through project_a's URL.
    """
    other = Project.objects.create(
        name="Sibling Project", identifier="SIB", workspace=workspace, created_by=create_user
    )
    return _board_for(workspace, other)


@pytest.fixture
def victim_board(db):
    """A published board in a DIFFERENT workspace the caller has no relation to."""
    unique = uuid4().hex[:8]
    owner = User.objects.create(email=f"victim-{unique}@plane.so", username=f"victim_{unique}")
    owner.set_password("test-password")
    owner.save()
    ws = Workspace.objects.create(name="Victim WS", slug=f"victim-{unique}", owner=owner)
    WorkspaceMember.objects.create(workspace=ws, member=owner, role=20, is_active=True)
    project = Project.objects.create(name="Victim Project", identifier="VIC", workspace=ws, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=ws, role=20, is_active=True)
    return _board_for(ws, project)


@pytest.mark.contract
@pytest.mark.django_db
class TestDeployBoardCrossWorkspaceScope:
    """A caller must not reach another workspace's board via their own URL scope."""

    def test_cannot_retrieve_foreign_board(self, session_client, workspace, project_a, victim_board):
        response = session_client.get(_board_url(workspace.slug, project_a.id, victim_board.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_cannot_destroy_foreign_board(self, session_client, workspace, project_a, victim_board):
        response = session_client.delete(_board_url(workspace.slug, project_a.id, victim_board.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert DeployBoard.objects.filter(pk=victim_board.id).exists(), "Foreign board was deleted"

    def test_cannot_patch_foreign_board(self, session_client, workspace, project_a, victim_board):
        response = session_client.patch(
            _board_url(workspace.slug, project_a.id, victim_board.id),
            {"is_comments_enabled": True},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        victim_board.refresh_from_db()
        assert victim_board.is_comments_enabled is False

    def test_cannot_retrieve_same_workspace_other_project_board(
        self, session_client, workspace, project_a, sibling_board
    ):
        """A board in the same workspace but a different project must 404 via project_a's URL."""
        response = session_client.get(_board_url(workspace.slug, project_a.id, sibling_board.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_can_retrieve_own_board(self, session_client, workspace, project_a, own_board):
        """Positive control: a project member may retrieve their own board."""
        response = session_client.get(_board_url(workspace.slug, project_a.id, own_board.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
