# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for WEB-8332.

``WorkSpaceMemberViewSet.partial_update`` is only meant to update a member's
``role``. Before the fix it passed ``request.data`` verbatim to
``WorkSpaceMemberSerializer`` (declared ``fields = "__all__"`` with only the
nested ``member`` read-only), so ``workspace`` (FK), ``is_active`` and other
columns were mass-assignable.

An admin of an attacker-owned workspace could therefore PATCH a controlled
member row setting ``workspace`` = victim-workspace UUID and ``role`` = 20,
relocating a controlled account into the victim workspace as an admin with no
invitation — a full cross-tenant takeover. The ``@allow_permission(level=
"WORKSPACE")`` decorator authorizes against the URL slug and does NOT prevent
the write from moving the row to a different workspace.

The fix rejects any payload other than ``{"role": ...}`` and makes the
tenancy/state columns read-only on the serializers.
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, WorkspaceMember
from plane.tests.factories import UserFactory, WorkspaceFactory


def _member_detail_url(slug: str, pk: uuid.UUID) -> str:
    return f"/api/workspaces/{slug}/members/{pk}/"


def _add_member(workspace, username: str, *, role: int) -> WorkspaceMember:
    return WorkspaceMember.objects.create(
        workspace=workspace, member=UserFactory(username=username), role=role, is_active=True
    )


def _add_project(workspace, owner, identifier: str, *members) -> Project:
    """Create a project whose only members are ``(user, role)`` pairs in ``members``."""
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    for user, role in members:
        ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=role, is_active=True)
    return project


@pytest.fixture
def admin_client(create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceMemberMassAssignment:
    def test_admin_cannot_move_member_to_another_workspace(self, admin_client, workspace):
        """
        Core takeover vector: a workspace admin must not be able to relocate a
        member row into another workspace via the ``workspace`` FK.
        """
        victim_ws = WorkspaceFactory(owner=UserFactory(username="victim-owner"))
        puppet_member = _add_member(workspace, "puppet", role=15)

        response = admin_client.patch(
            _member_detail_url(workspace.slug, puppet_member.id),
            {"workspace": str(victim_ws.id), "role": 20},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        puppet_member.refresh_from_db()
        assert puppet_member.workspace_id == workspace.id
        # The whole payload is rejected, including the otherwise-allowed role.
        assert puppet_member.role == 15
        assert not WorkspaceMember.objects.filter(workspace=victim_ws).exists()

    def test_patch_is_active_false_is_rejected(self, admin_client, workspace):
        """``is_active`` must not be assignable, and a rejected payload must not write."""
        target_member = _add_member(workspace, "active-target", role=15)
        original_updated_at = target_member.updated_at

        response = admin_client.patch(
            _member_detail_url(workspace.slug, target_member.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.is_active is True
        assert target_member.updated_at == original_updated_at

    @pytest.mark.parametrize("body", ["xroley", 5, ["role"]])
    def test_non_object_body_is_400_not_500(self, admin_client, workspace, body):
        target_member = _add_member(workspace, "body-target", role=15)

        response = admin_client.patch(_member_detail_url(workspace.slug, target_member.id), body, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.role == 15

    def test_legitimate_role_update_still_works(self, admin_client, workspace):
        """Positive control: the intended ``role`` update still functions."""
        target_member = _add_member(workspace, "role-target", role=15)

        response = admin_client.patch(_member_detail_url(workspace.slug, target_member.id), {"role": 20}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["role"] == 20
        target_member.refresh_from_db()
        assert target_member.role == 20

    def test_demote_to_guest_downgrades_project_roles(self, admin_client, workspace, create_user):
        target_member = _add_member(workspace, "demote-target", role=15)
        project = _add_project(workspace, create_user, "DT", (target_member.member, 20), (create_user, 20))
        project_member = ProjectMember.objects.get(project=project, member=target_member.member)
        original_updated_at = project_member.updated_at

        response = admin_client.patch(_member_detail_url(workspace.slug, target_member.id), {"role": 5}, format="json")

        assert response.status_code == status.HTTP_200_OK
        target_member.refresh_from_db()
        assert target_member.role == 5
        project_member.refresh_from_db()
        assert project_member.role == 5
        assert project_member.updated_at > original_updated_at

    def test_demote_sole_project_admin_is_rejected(self, admin_client, workspace, create_user):
        """Demoting to guest must not leave a project with no admin, matching leave()/destroy()."""
        target_member = _add_member(workspace, "sole-admin", role=15)
        project = _add_project(workspace, create_user, "SA", (target_member.member, 20))

        response = admin_client.patch(_member_detail_url(workspace.slug, target_member.id), {"role": 5}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.role == 15
        assert ProjectMember.objects.get(project=project, member=target_member.member).role == 20

    def test_self_role_update_still_forbidden(self, admin_client, workspace, create_user):
        """Positive control: the self-role-update guard is preserved."""
        own_member = WorkspaceMember.objects.get(workspace=workspace, member=create_user)

        response = admin_client.patch(_member_detail_url(workspace.slug, own_member.id), {"role": 5}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        own_member.refresh_from_db()
        assert own_member.role == 20

    # 5.0 passed the old ``int(role) == 5`` check, so the old code downgraded project
    # roles before the serializer rejected the value.
    @pytest.mark.parametrize("role", ["not-a-number", 5.0])
    def test_invalid_role_is_400_and_skips_guest_downgrade(self, admin_client, workspace, create_user, role):
        target_member = _add_member(workspace, "bad-role-target", role=15)
        project = _add_project(workspace, create_user, "CP", (target_member.member, 15), (create_user, 20))

        response = admin_client.patch(
            _member_detail_url(workspace.slug, target_member.id), {"role": role}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.role == 15
        assert ProjectMember.objects.get(project=project, member=target_member.member).role == 15

    def test_remove_sole_project_admin_is_rejected(self, admin_client, workspace, create_user):
        """destroy() must refuse to remove the only member/admin of a project."""
        target_member = _add_member(workspace, "remove-target", role=15)
        _add_project(workspace, create_user, "RT", (target_member.member, 20))

        response = admin_client.delete(_member_detail_url(workspace.slug, target_member.id))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.is_active is True
