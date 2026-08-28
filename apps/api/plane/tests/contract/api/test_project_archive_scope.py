# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression test for project-archive authorization bypass on the external API.

Root cause: ProjectArchiveUnarchiveAPIEndpoint used ProjectBasePermission,
whose POST branch is written for project creation — it checks only
workspace-level role (ADMIN/MEMBER) with no project_id binding at all. Since
archive is POST but is not creation, any active workspace member could
archive (and delete every UserFavorite row on) any project in the workspace,
including a fully private one they have no ProjectMember row on and cannot
otherwise read.

DELETE (unarchive) was never affected — it falls through to
ProjectBasePermission's non-POST branch, which does check project membership.
So this was specifically an asymmetry between the two verbs of the same
endpoint.

Fixed by giving the endpoint its own ProjectArchiveUnarchivePermission,
scoped to project_id, mirroring the app-layer twin's gate (active
ProjectMember with role ADMIN or MEMBER, or any active ProjectMember plus a
workspace ADMIN role) — applied to both post and delete.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Project, ProjectMember, User, WorkspaceMember

pytestmark = pytest.mark.contract


def _make_user(prefix):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{unique}@plane.so", username=f"{prefix}_{unique}")
    user.set_password("test-password")
    user.save()
    return user


def _client_for(user):
    token = APIToken.objects.create(user=user, label="Test Token", token=f"token-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def private_project(db, workspace, create_user):
    """A fully private (network=0) project owned by create_user, the
    workspace admin (via the `workspace` fixture)."""
    project = Project.objects.create(
        name="Confidential",
        identifier="CONF",
        workspace=workspace,
        created_by=create_user,
        network=0,
    )
    ProjectMember.objects.create(project=project, workspace=workspace, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def attacker_member(db, workspace):
    """An active workspace MEMBER (role 15) with no ProjectMember row on
    private_project — the attacker in this advisory."""
    user = _make_user("attacker")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    return user


def _archive_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/archive/"


@pytest.mark.django_db
class TestProjectArchiveScope:
    def test_workspace_member_without_project_membership_cannot_archive(
        self, workspace, private_project, attacker_member
    ):
        client = _client_for(attacker_member)

        response = client.post(_archive_url(workspace.slug, private_project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"got {response.status_code}: {response.data!r}"
        private_project.refresh_from_db()
        assert private_project.archived_at is None, "the project must not have been archived"

    def test_workspace_member_without_project_membership_cannot_unarchive(
        self, workspace, private_project, attacker_member
    ):
        """Symmetry check: unarchive was already correctly gated before this
        fix — must still be, now that archive shares the same permission
        class."""
        client = _client_for(attacker_member)

        response = client.delete(_archive_url(workspace.slug, private_project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"got {response.status_code}: {response.data!r}"

    def test_project_member_can_archive_and_unarchive_their_own_project(self, workspace, private_project):
        """Positive control: an active project MEMBER (not just admin) must
        still be able to archive/unarchive — the fix must not overtighten
        beyond the app-layer twin's ADMIN-or-MEMBER gate."""
        member_user = _make_user("member")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        ProjectMember.objects.create(
            project=private_project, workspace=workspace, member=member_user, role=15, is_active=True
        )
        client = _client_for(member_user)
        url = _archive_url(workspace.slug, private_project.id)

        response = client.post(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"got {response.status_code}: {response.data!r}"
        private_project.refresh_from_db()
        assert private_project.archived_at is not None

        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"got {response.status_code}: {response.data!r}"
        private_project.refresh_from_db()
        assert private_project.archived_at is None
