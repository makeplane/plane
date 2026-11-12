# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``ProjectInvitationsViewset`` authorization (WEB-8291).

Listing, retrieving and deleting project invitations requires the project
admin role, the same as creating them.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, ProjectMemberInvite, User, WorkspaceMember


def _invites_url(slug, project_id, pk=None):
    base = f"/api/workspaces/{slug}/projects/{project_id}/invitations/"
    return f"{base}{pk}/" if pk else base


@pytest.fixture
def project(db, workspace, create_user):
    """A project where ``create_user`` (session_client) is an active admin."""
    project = Project.objects.create(
        name="Invite Project", identifier="INV", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
    return project


@pytest.fixture
def invite(db, workspace, project):
    """A pending project invitation carrying an email + raw token."""
    return ProjectMemberInvite.objects.create(
        project=project,
        workspace=workspace,
        email="invitee@plane.so",
        token="super-secret-token",
        role=15,
    )


@pytest.fixture
def outsider_client(db, workspace):
    """A workspace member who belongs to a *different* project, not ``project``."""
    uid = uuid4().hex[:8]
    outsider = User.objects.create(email=f"outsider-{uid}@plane.so", username=f"outsider_{uid}")
    outsider.set_password("test-password")
    outsider.save()
    WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)
    other = Project.objects.create(
        name="Other Project", identifier="OTH", workspace=workspace, created_by=outsider
    )
    ProjectMember.objects.create(
        project=other, member=outsider, workspace=workspace, role=20, is_active=True
    )
    client = APIClient()
    client.force_authenticate(user=outsider)
    return client


@pytest.fixture
def member_client(db, workspace, project):
    """An active, non-admin member of ``project``."""
    uid = uuid4().hex[:8]
    member = User.objects.create(email=f"member-{uid}@plane.so", username=f"member_{uid}")
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=member)
    return client


@pytest.mark.contract
class TestProjectInviteListScope:
    @pytest.mark.django_db
    def test_non_project_member_cannot_list_invitations(self, outsider_client, workspace, project, invite):
        response = outsider_client.get(_invites_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_non_project_member_cannot_retrieve_invitation(self, outsider_client, workspace, project, invite):
        response = outsider_client.get(_invites_url(workspace.slug, project.id, pk=invite.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_non_project_member_cannot_delete_invitation(self, outsider_client, workspace, project, invite):
        response = outsider_client.delete(_invites_url(workspace.slug, project.id, pk=invite.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert ProjectMemberInvite.objects.filter(pk=invite.id).exists()

    @pytest.mark.django_db
    def test_project_member_without_admin_role_is_forbidden(self, member_client, workspace, project, invite):
        list_url = _invites_url(workspace.slug, project.id)
        detail_url = _invites_url(workspace.slug, project.id, pk=invite.id)
        for response in (
            member_client.get(list_url),
            member_client.get(detail_url),
            member_client.delete(detail_url),
        ):
            assert response.status_code == status.HTTP_403_FORBIDDEN, (
                f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
            )
        assert ProjectMemberInvite.objects.filter(pk=invite.id).exists()

    @pytest.mark.django_db
    def test_project_admin_can_list_invitations(self, session_client, workspace, project, invite):
        """Positive control: an active project admin can still list invitations."""
        response = session_client.get(_invites_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        ids = {str(item["id"]) for item in response.json()}
        assert str(invite.id) in ids
