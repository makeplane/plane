# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Self-joining a public project (``UserProjectInvitationsViewset.create``) grants
the joiner's workspace role. A previously deactivated membership row is
reactivated at that same role, not at the role it held before.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, WorkspaceMember

ADMIN = 20
MEMBER = 15


def _join_url(slug: str) -> str:
    return f"/api/users/me/workspaces/{slug}/projects/invitations/"


@pytest.fixture
def project(db, workspace):
    return Project.objects.create(name="Public Project", identifier="PUB", workspace=workspace, network=2)


@pytest.fixture
def joiner(db, workspace):
    user = User.objects.create(email="joiner@plane.so", username="joiner", first_name="joiner")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=MEMBER, is_active=True)
    return user


def _join(user, workspace, project):
    client = APIClient()
    client.force_authenticate(user=user)
    return client.post(_join_url(workspace.slug), {"project_ids": [str(project.id)]}, format="json")


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectSelfJoinRole:
    def test_rejoin_resets_role_to_workspace_role(self, workspace, project, joiner):
        """A deactivated ADMIN row is reactivated at the joiner's workspace role."""
        removed = ProjectMember.objects.create(
            workspace=workspace, project=project, member=joiner, role=ADMIN, is_active=False
        )

        response = _join(joiner, workspace, project)

        assert response.status_code == status.HTTP_201_CREATED
        removed.refresh_from_db()
        assert removed.is_active is True
        assert removed.role == MEMBER
        assert removed.updated_by_id == joiner.id

    def test_new_joiner_gets_workspace_role(self, workspace, project, joiner):
        response = _join(joiner, workspace, project)

        assert response.status_code == status.HTTP_201_CREATED
        membership = ProjectMember.objects.get(project=project, member=joiner)
        assert membership.is_active is True
        assert membership.role == MEMBER

    def test_active_member_role_is_unchanged(self, workspace, project, joiner):
        """Calling join while already an active member leaves the role as is."""
        active = ProjectMember.objects.create(
            workspace=workspace, project=project, member=joiner, role=ADMIN, is_active=True
        )

        response = _join(joiner, workspace, project)

        assert response.status_code == status.HTTP_201_CREATED
        active.refresh_from_db()
        assert active.is_active is True
        assert active.role == ADMIN
