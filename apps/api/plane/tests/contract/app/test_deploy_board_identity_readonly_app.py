# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``DeployBoardViewSet`` partial_update.

A board's identity (``entity_identifier``, ``entity_name``, ``project``,
``workspace``, ``anchor``) is fixed at publish time from the URL project and is
read-only afterwards; only the publish settings are editable. A board's intake
must belong to the board's own project. Public endpoints only serve a project
board that publishes its own project, and migration 0125 repairs existing rows.
"""

from importlib import import_module
from uuid import uuid4

import pytest
from django.apps import apps as django_apps
from django.utils import timezone
from rest_framework import status

from plane.db.models import DeployBoard, Intake, Project, ProjectMember, Workspace

reset_project_deploy_board_identity = import_module(
    "plane.db.migrations.0125_reset_project_deploy_board_identity"
).reset_project_deploy_board_identity


def _boards_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/project-deploy-boards/"


def _board_url(slug, project_id, pk):
    return f"{_boards_url(slug, project_id)}{pk}/"


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


@pytest.mark.contract
@pytest.mark.django_db
class TestDeployBoardIntakeProjectScope:
    def test_partial_update_rejects_intake_from_another_project(
        self, session_client, workspace, project, other_project, board
    ):
        own_intake = Intake.objects.create(name="Own", project=project, workspace=workspace)
        other_intake = Intake.objects.create(name="Other", project=other_project, workspace=workspace)
        board.intake = own_intake
        board.save()

        response = session_client.patch(
            _board_url(workspace.slug, project.id, board.id), {"intake": str(other_intake.id)}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        board.refresh_from_db()
        assert board.intake_id == own_intake.id

    def test_partial_update_accepts_own_project_intake_or_null(self, session_client, workspace, project, board):
        own_intake = Intake.objects.create(name="Own", project=project, workspace=workspace)
        url = _board_url(workspace.slug, project.id, board.id)

        response = session_client.patch(url, {"intake": str(own_intake.id)}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        board.refresh_from_db()
        assert board.intake_id == own_intake.id

        response = session_client.patch(url, {"intake": None}, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        board.refresh_from_db()
        assert board.intake_id is None

    def test_create_rejects_intake_from_another_project(self, session_client, workspace, project, other_project):
        other_intake = Intake.objects.create(name="Other", project=other_project, workspace=workspace)

        response = session_client.post(
            _boards_url(workspace.slug, project.id), {"intake": str(other_intake.id)}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert not DeployBoard.objects.filter(project=project).exists()

    def test_create_accepts_own_project_intake(self, session_client, workspace, project):
        own_intake = Intake.objects.create(name="Own", project=project, workspace=workspace)

        response = session_client.post(
            _boards_url(workspace.slug, project.id), {"intake": str(own_intake.id)}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert DeployBoard.objects.get(project=project).intake_id == own_intake.id


@pytest.mark.contract
@pytest.mark.django_db
class TestPublicBoardProjectScope:
    """Public endpoints only serve a project board that publishes its own project.

    Requests are authenticated so the anonymous rate limit does not apply.
    """

    @pytest.mark.parametrize("suffix", ["meta/", "settings/", "states/", "members/", f"issues/{uuid4()}/comments/"])
    def test_mismatched_board_is_not_found(self, session_client, other_project, board, suffix):
        DeployBoard.objects.filter(pk=board.pk).update(entity_identifier=other_project.id)

        response = session_client.get(f"/api/public/anchor/{board.anchor}/{suffix}")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.parametrize("suffix", ["meta/", "settings/", "states/", "members/"])
    def test_board_is_served(self, session_client, board, suffix):
        response = session_client.get(f"/api/public/anchor/{board.anchor}/{suffix}")

        assert response.status_code == status.HTTP_200_OK

    def test_project_anchor_lookup_skips_mismatched_board(
        self, session_client, workspace, project, other_project, board
    ):
        url = f"/api/public/workspaces/{workspace.slug}/projects/{project.id}/anchor/"
        assert session_client.get(url).status_code == status.HTTP_200_OK

        DeployBoard.objects.filter(pk=board.pk).update(entity_identifier=other_project.id)

        assert session_client.get(url).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
@pytest.mark.django_db
class TestDeployBoardIdentityMigration:
    def test_points_project_boards_at_their_own_project(self, workspace, project, other_project, board):
        third = Project.objects.create(name="Third", identifier="THD", workspace=workspace)
        mismatched = DeployBoard.objects.create(
            workspace=workspace, project=other_project, entity_name="project", entity_identifier=third.id
        )
        deleted = DeployBoard.objects.create(
            workspace=workspace,
            project=third,
            entity_name="project",
            entity_identifier=project.id,
            deleted_at=timezone.now(),
        )
        page_id = uuid4()
        page_board = DeployBoard.objects.create(
            workspace=workspace, project=project, entity_name="page", entity_identifier=page_id
        )

        reset_project_deploy_board_identity(django_apps, None)
        reset_project_deploy_board_identity(django_apps, None)

        for item in (board, mismatched, deleted, page_board):
            item.refresh_from_db()
        assert board.entity_identifier == project.id
        assert mismatched.entity_identifier == other_project.id
        assert mismatched.deleted_at is None
        assert deleted.entity_identifier == third.id
        assert page_board.entity_identifier == page_id

    def test_unpublishes_extra_board_when_project_already_has_one(self, workspace, project, other_project, board):
        third = Project.objects.create(name="Third", identifier="THD", workspace=workspace)
        extra = DeployBoard.objects.create(
            workspace=workspace, project=project, entity_name="project", entity_identifier=other_project.id
        )
        # Newest, so it is processed before ``extra`` is retired.
        own = DeployBoard.objects.create(
            workspace=workspace, project=other_project, entity_name="project", entity_identifier=third.id
        )

        reset_project_deploy_board_identity(django_apps, None)

        for item in (board, extra, own):
            item.refresh_from_db()
        assert board.entity_identifier == project.id
        assert board.deleted_at is None
        assert extra.deleted_at is not None
        assert own.entity_identifier == other_project.id
        assert own.deleted_at is None
