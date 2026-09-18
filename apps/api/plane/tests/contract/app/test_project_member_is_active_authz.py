# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for GHSA-hpgm-9r34-c4x5 / GHSA-25gg-cxm8-g7h9.

A project GUEST (or MEMBER) must not be able to (de)activate other project
members by PATCHing ``{"is_active": false}`` while omitting the ``role`` field.
Before the fix, every authorization guard in ``ProjectMemberViewSet.partial_update``
lived inside ``if "role" in request.data:`` and ``is_active`` was writable through
``ProjectMemberSerializer(fields="__all__")`` — so a guest could deactivate any
member, including admins, and take over the project.
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)


def _member_detail_url(slug: str, project_id: uuid.UUID, pk: uuid.UUID) -> str:
    return f"/api/workspaces/{slug}/projects/{project_id}/members/{pk}/"


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


def _add_member(workspace, project, user, *, ws_role: int, project_role: int) -> ProjectMember:
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    return ProjectMember.objects.create(
        workspace=workspace, project=project, member=user, role=project_role, is_active=True
    )


@pytest.fixture
def project(db, workspace, create_user):
    """A project owned by ``create_user`` (workspace owner / admin)."""
    project = Project.objects.create(
        name="Secure Project",
        identifier="SEC",
        workspace=workspace,
        created_by=create_user,
    )
    # create_user is the workspace owner (role=20 via the workspace fixture);
    # make them a project ADMIN too — this is the takeover victim.
    ProjectMember.objects.create(
        workspace=workspace, project=project, member=create_user, role=20, is_active=True
    )
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectMemberIsActiveAuthz:
    def test_guest_cannot_deactivate_admin(self, workspace, project, create_user):
        """A project GUEST must not deactivate a project ADMIN via is_active."""
        attacker = _make_user("guest-attacker@plane.so")
        # non-workspace-admin (role 15) so is_workspace_admin bypass does not apply,
        # project GUEST (role 5)
        _add_member(workspace, project, attacker, ws_role=15, project_role=5)
        victim = ProjectMember.objects.get(project=project, member=create_user)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(workspace.slug, project.id, victim.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        victim.refresh_from_db()
        assert victim.is_active is True

    def test_member_cannot_deactivate_admin(self, workspace, project, create_user):
        """A project MEMBER must not deactivate a project ADMIN via is_active."""
        attacker = _make_user("member-attacker@plane.so")
        _add_member(workspace, project, attacker, ws_role=15, project_role=15)
        victim = ProjectMember.objects.get(project=project, member=create_user)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(workspace.slug, project.id, victim.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        victim.refresh_from_db()
        assert victim.is_active is True

    def test_guest_cannot_deactivate_peer_guest(self, workspace, project):
        """A GUEST cannot deactivate another GUEST either (role check applies to all)."""
        attacker = _make_user("guest-a@plane.so")
        peer = _make_user("guest-b@plane.so")
        _add_member(workspace, project, attacker, ws_role=15, project_role=5)
        peer_member = _add_member(workspace, project, peer, ws_role=15, project_role=5)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(workspace.slug, project.id, peer_member.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        peer_member.refresh_from_db()
        assert peer_member.is_active is True

    def test_project_admin_can_deactivate_member(self, workspace, project):
        """Positive control: a project ADMIN (non-workspace-admin) may deactivate a MEMBER."""
        admin = _make_user("project-admin@plane.so")
        target = _make_user("plain-member@plane.so")
        # admin is a workspace MEMBER (15) but project ADMIN (20) — exercises the
        # role-comparison guard rather than the workspace-admin bypass.
        _add_member(workspace, project, admin, ws_role=15, project_role=20)
        target_member = _add_member(workspace, project, target, ws_role=15, project_role=15)

        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.patch(
            _member_detail_url(workspace.slug, project.id, target_member.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        target_member.refresh_from_db()
        assert target_member.is_active is False

    def test_workspace_admin_with_low_project_role_can_deactivate(self, workspace, project, create_user):
        """
        Positive control: the intended workspace-admin bypass is preserved.

        A workspace ADMIN (role 20) may deactivate any project member — even a
        project ADMIN — despite holding only a project GUEST role, because
        is_workspace_admin short-circuits the role-comparison guard. Locks in the
        bypass so future changes don't silently remove it.
        """
        ws_admin = _make_user("ws-admin@plane.so")
        # workspace ADMIN (20) but only a project GUEST (5)
        _add_member(workspace, project, ws_admin, ws_role=20, project_role=5)
        # victim is the project ADMIN (create_user) set up by the `project` fixture
        victim = ProjectMember.objects.get(project=project, member=create_user)

        client = APIClient()
        client.force_authenticate(user=ws_admin)
        response = client.patch(
            _member_detail_url(workspace.slug, project.id, victim.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        victim.refresh_from_db()
        assert victim.is_active is False
