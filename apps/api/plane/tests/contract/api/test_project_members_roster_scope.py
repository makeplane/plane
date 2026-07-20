# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``ProjectMemberListCreateAPIEndpoint`` (v1) authorization.

Regression coverage for GHSA-w2vf-m9x9-mvmc (WEB-8075). The SAFE_METHODS branch
of ``ProjectMemberPermission`` only checked workspace membership, so a workspace
member who was NOT a member of a project could ``GET
/workspaces/<slug>/projects/<pid>/members/`` and read that project's full roster.

The fix scopes the SAFE_METHODS check to ``project_id=view.project_id`` so a
non-member is rejected with 403.
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, User


def members_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/members/"


@pytest.fixture
def attacker_membership(db, workspace, create_user):
    """Make the token holder (``create_user``) a member of an *unrelated* project.

    The vulnerable SAFE_METHODS check was ``ProjectMember`` filtered by workspace
    only (no project_id), so being a member of ANY project in the workspace let
    the user read a foreign project's roster. Without this the request is denied
    for the unrelated reason of having no project membership at all.
    """
    other = Project.objects.create(
        name="Attacker's Project",
        identifier="ATK",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=other, member=create_user, workspace=workspace, role=20
    )
    return other


@pytest.fixture
def foreign_project(db, workspace):
    """A project owned by someone else; the token holder is NOT a member."""
    unique_id = uuid4().hex[:8]
    owner = User.objects.create(
        email=f"owner-{unique_id}@plane.so",
        username=f"owner_{unique_id}",
    )
    owner.set_password("test-password")
    owner.save()
    project = Project.objects.create(
        name="Foreign Project",
        identifier="FOR",
        workspace=workspace,
        created_by=owner,
    )
    ProjectMember.objects.create(
        project=project, member=owner, workspace=workspace, role=20
    )
    return project


@pytest.mark.contract
class TestProjectMemberRosterScope:
    """The token holder (``create_user``) is a workspace member but not in the project."""

    @pytest.mark.django_db
    def test_non_project_member_cannot_list_roster(
        self, api_key_client, workspace, attacker_membership, foreign_project
    ):
        response = api_key_client.get(members_url(workspace.slug, foreign_project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_project_member_can_list_roster(self, api_key_client, workspace, create_user):
        """Positive control: an active project member still reads the roster."""
        project = Project.objects.create(
            name="Own Project",
            identifier="OWN",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            project=project, member=create_user, workspace=workspace, role=20
        )
        response = api_key_client.get(members_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        returned = {str(row["id"]) for row in response.data}
        assert str(create_user.id) in returned
