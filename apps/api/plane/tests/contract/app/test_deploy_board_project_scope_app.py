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

from plane.db.models import Project, ProjectMember, User, WorkspaceMember


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
