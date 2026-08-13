# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``DeployBoardViewSet`` authorization.

Regression coverage for the app-side sibling of GHSA-w2vf-m9x9-mvmc (WEB-8075).
``DeployBoardViewSet`` uses ``ProjectMemberPermission`` whose SAFE_METHODS branch
previously checked only workspace membership, so a workspace member who was NOT
a member of a project could ``GET .../project-deploy-boards/`` and read that
project's publish configuration.

The fix scopes the SAFE_METHODS check to ``project_id=view.project_id`` so a
non-member is rejected with 403.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, Project, ProjectMember, User, Workspace, WorkspaceMember


def deploy_board_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/project-deploy-boards/"


@pytest.fixture
def project(db, workspace, create_user):
    """A project; ``create_user`` (session_client) is an active member."""
    project = Project.objects.create(
        name="Board Project",
        identifier="BP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def outsider_client(db, workspace, create_user):
    """Session client for a workspace member who is NOT in ``project``.

    The outsider is made a member of an *unrelated* project so the vulnerable
    SAFE_METHODS check (ProjectMember filtered by workspace only, no project_id)
    would pass; without that the request is denied for simply having no project
    membership, not for the cross-project scoping being fixed here.
    """
    unique_id = uuid4().hex[:8]
    outsider = User.objects.create(
        email=f"outsider-{unique_id}@plane.so",
        username=f"outsider_{unique_id}",
    )
    outsider.set_password("test-password")
    outsider.save()
    WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)
    other_project = Project.objects.create(
        name="Outsider's Project",
        identifier="OP",
        workspace=workspace,
        created_by=outsider,
    )
    ProjectMember.objects.create(
        project=other_project, member=outsider, workspace=workspace, role=15
    )
    client = APIClient()
    client.force_authenticate(user=outsider)
    return client


@pytest.mark.contract
class TestDeployBoardProjectScope:
    @pytest.mark.django_db
    def test_non_project_member_cannot_read_deploy_board(self, outsider_client, workspace, project):
        response = outsider_client.get(deploy_board_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_project_member_can_read_deploy_board(self, session_client, workspace, project):
        """Positive control: an active project member is not blocked."""
        response = session_client.get(deploy_board_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


@pytest.fixture
def secret_project(db, workspace, create_user):
    """A Secret (network=0) project that ``create_user`` administers."""
    project = Project.objects.create(
        name="Secret Project",
        identifier="SEC",
        workspace=workspace,
        network=0,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def foreign_project(db, create_user):
    """A project in a DIFFERENT workspace that nobody here belongs to."""
    unique_id = uuid4().hex[:8]
    owner = User.objects.create(
        email=f"victim-{unique_id}@plane.so", username=f"victim_{unique_id}"
    )
    other_ws = Workspace.objects.create(
        name="Victim Workspace", slug=f"victim-{unique_id}", owner=owner
    )
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=20)
    return Project.objects.create(
        name="Victim Project",
        identifier="VIC",
        workspace=other_ws,
        network=0,
        created_by=owner,
    )


@pytest.mark.contract
class TestDeployBoardCreateProjectScope:
    """POST is the publish action: it returns the public anchor.

    ``ProjectMemberPermission``'s POST branch previously checked workspace
    membership only, so a workspace member who was not in the project could
    publish it and receive the anchor — which Space serves to anonymous callers.
    """

    @pytest.mark.django_db
    def test_non_project_member_cannot_publish(self, outsider_client, workspace, secret_project):
        response = outsider_client.post(
            deploy_board_url(workspace.slug, secret_project.id), {}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_denied_publish_leaks_no_anchor_and_creates_no_board(
        self, outsider_client, workspace, secret_project
    ):
        """The response must not carry an anchor, and no board may be created.

        A 403 that still created the DeployBoard would leave the project
        published even though the API refused the caller.
        """
        response = outsider_client.post(
            deploy_board_url(workspace.slug, secret_project.id), {}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "anchor" not in str(getattr(response, "data", "")).lower()
        assert not DeployBoard.objects.filter(
            entity_name="project", entity_identifier=secret_project.id
        ).exists(), "a denied publish must not create a DeployBoard"

    @pytest.mark.django_db
    def test_project_member_can_publish(self, session_client, workspace, secret_project):
        """Positive control: scoping POST must not break the legitimate publish."""
        response = session_client.post(
            deploy_board_url(workspace.slug, secret_project.id), {}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert DeployBoard.objects.filter(
            entity_name="project", entity_identifier=secret_project.id
        ).exists()

    @pytest.mark.django_db
    def test_cannot_publish_another_workspaces_project(
        self, session_client, workspace, foreign_project
    ):
        """Own slug + a foreign project id must not publish the victim's project."""
        response = session_client.post(
            deploy_board_url(workspace.slug, foreign_project.id), {}, format="json"
        )
        assert response.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ), f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        assert not DeployBoard.objects.filter(
            entity_name="project", entity_identifier=foreign_project.id
        ).exists(), "a cross-workspace publish must not create a DeployBoard"
