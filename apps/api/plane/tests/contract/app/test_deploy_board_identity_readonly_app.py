# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``DeployBoardViewSet`` partial_update.

A board's identity (``entity_identifier``, ``entity_name``, ``project``,
``workspace``, ``anchor``) is fixed at publish time from the URL project and is
read-only afterwards; only the publish settings are editable.
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import DeployBoard, Project, ProjectMember, Workspace


def _board_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/project-deploy-boards/{pk}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Board Project", identifier="BP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=15, is_active=True)
    return project


@pytest.fixture
def other_project(db, workspace):
    """A project in the same workspace that ``create_user`` is not a member of."""
    return Project.objects.create(name="Secret Project", identifier="SEC", workspace=workspace, network=0)


@pytest.fixture
def board(db, workspace, project):
    return DeployBoard.objects.create(
        workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestDeployBoardIdentityReadOnly:
    def test_partial_update_keeps_board_identity(
        self, session_client, create_user, workspace, project, other_project, board
    ):
        other_workspace = Workspace.objects.create(name="Other", slug=f"other-{uuid4().hex[:8]}", owner=create_user)
        anchor = board.anchor

        response = session_client.patch(
            _board_url(workspace.slug, project.id, board.id),
            {
                "entity_identifier": str(other_project.id),
                "entity_name": "page",
                "project": str(other_project.id),
                "workspace": str(other_workspace.id),
                "anchor": "changed-anchor",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        board.refresh_from_db()
        assert board.entity_identifier == project.id
        assert board.entity_name == "project"
        assert board.project_id == project.id
        assert board.workspace_id == workspace.id
        assert board.anchor == anchor

    def test_partial_update_applies_publish_settings(self, session_client, workspace, project, board):
        """Positive control: the publish settings the web client sends stay editable."""
        view_props = {"list": True, "kanban": False}

        response = session_client.patch(
            _board_url(workspace.slug, project.id, board.id),
            {
                "is_comments_enabled": True,
                "is_reactions_enabled": True,
                "is_votes_enabled": True,
                "view_props": view_props,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        board.refresh_from_db()
        assert board.is_comments_enabled is True
        assert board.is_reactions_enabled is True
        assert board.is_votes_enabled is True
        assert board.view_props == view_props
