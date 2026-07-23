# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for GHSA-f739-39g5-jj49 (WEB-8332).

``WorkSpaceMemberViewSet.partial_update`` is only meant to update a member's
``role``. Before the fix it passed ``request.data`` verbatim to
``WorkSpaceMemberSerializer`` (declared ``fields = "__all__"`` with only the
nested ``member`` read-only). ``DynamicBaseSerializer`` ignores the ``fields=``
kwarg for writes, so ``workspace`` (FK), ``is_active`` and other columns were
mass-assignable.

An admin of an attacker-owned workspace could therefore PATCH a controlled
member row setting ``workspace`` = victim-workspace UUID and ``role`` = 20,
relocating a controlled account into the victim workspace as an admin with no
invitation — a full cross-tenant takeover. The ``@allow_permission(level=
"WORKSPACE")`` decorator authorizes against the URL slug and does NOT prevent
the write from moving the row to a different workspace.

The fix restricts the writable payload to ``role`` only.
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember


def _member_detail_url(slug: str, pk: uuid.UUID) -> str:
    return f"/api/workspaces/{slug}/members/{pk}/"


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


def _make_workspace(name: str, slug: str, owner: User) -> Workspace:
    workspace = Workspace.objects.create(name=name, slug=slug, owner=owner)
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20, is_active=True)
    return workspace


def _add_member(workspace: Workspace, user: User, *, role: int) -> WorkspaceMember:
    return WorkspaceMember.objects.create(
        workspace=workspace, member=user, role=role, is_active=True
    )


@pytest.fixture
def attacker_workspace(db):
    """A workspace fully controlled by the attacker (they are the admin/owner)."""
    attacker = _make_user("ws-attacker@plane.so")
    workspace = _make_workspace("Attacker Workspace", "attacker-ws", attacker)
    return workspace, attacker


@pytest.fixture
def victim_workspace(db):
    """An unrelated workspace the attacker has no membership in."""
    victim_owner = _make_user("ws-victim-owner@plane.so")
    workspace = _make_workspace("Victim Workspace", "victim-ws", victim_owner)
    return workspace, victim_owner


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceMemberMassAssignment:
    def test_admin_cannot_move_member_to_another_workspace(self, attacker_workspace, victim_workspace):
        """
        Core takeover vector: a workspace admin must not be able to relocate a
        member row into another workspace via the ``workspace`` FK.
        """
        attacker_ws, attacker = attacker_workspace
        victim_ws, _ = victim_workspace

        # A puppet account the attacker controls, sitting in the attacker workspace.
        puppet = _make_user("puppet@plane.so")
        puppet_member = _add_member(attacker_ws, puppet, role=15)

        victim_members_before = WorkspaceMember.objects.filter(workspace=victim_ws).count()

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(attacker_ws.slug, puppet_member.id),
            {"workspace": str(victim_ws.id), "role": 20},
            format="json",
        )

        # The request itself succeeds (admin updating a role is legitimate) ...
        assert response.status_code == status.HTTP_200_OK
        # ... but the member row must NOT have moved to the victim workspace.
        puppet_member.refresh_from_db()
        assert puppet_member.workspace_id == attacker_ws.id
        assert puppet_member.workspace_id != victim_ws.id
        # ... and the allowed field in the same payload (role) WAS applied, proving
        # the fix filters the payload rather than rejecting it wholesale.
        assert puppet_member.role == 20
        # And no new member appeared in the victim workspace.
        assert WorkspaceMember.objects.filter(workspace=victim_ws).count() == victim_members_before
        assert not WorkspaceMember.objects.filter(workspace=victim_ws, member=puppet).exists()

    def test_patch_is_active_false_does_not_deactivate(self, attacker_workspace):
        """``is_active`` must not be assignable through this endpoint."""
        attacker_ws, attacker = attacker_workspace
        target = _make_user("active-target@plane.so")
        target_member = _add_member(attacker_ws, target, role=15)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(attacker_ws.slug, target_member.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        target_member.refresh_from_db()
        assert target_member.is_active is True

    def test_legitimate_role_update_still_works(self, attacker_workspace):
        """Positive control: the intended ``role`` update still functions."""
        attacker_ws, attacker = attacker_workspace
        target = _make_user("role-target@plane.so")
        target_member = _add_member(attacker_ws, target, role=15)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(attacker_ws.slug, target_member.id),
            {"role": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        target_member.refresh_from_db()
        assert target_member.role == 5

    def test_self_role_update_still_forbidden(self, attacker_workspace):
        """Positive control: the self-role-update guard is preserved."""
        attacker_ws, attacker = attacker_workspace
        own_member = WorkspaceMember.objects.get(workspace=attacker_ws, member=attacker)

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(attacker_ws.slug, own_member.id),
            {"role": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        own_member.refresh_from_db()
        assert own_member.role == 20

    def test_non_integer_role_is_400_not_500(self, attacker_workspace):
        """A non-integer role must be a validation error (400), not a 500 — and
        the guest project-role cascade must not run when the update is invalid."""
        attacker_ws, attacker = attacker_workspace
        target = _make_user("bad-role-target@plane.so")
        target_member = _add_member(attacker_ws, target, role=15)

        # Seed a non-guest project-role for the same member. The guest cascade
        # (role == 5 -> downgrade every ProjectMember to guest) must not run when
        # the workspace-member update fails validation, so this must stay at 15.
        project = Project.objects.create(
            name="Cascade Project", identifier="CP", workspace=attacker_ws, created_by=attacker
        )
        project_member = ProjectMember.objects.create(
            workspace=attacker_ws, project=project, member=target, role=15, is_active=True
        )

        client = APIClient()
        client.force_authenticate(user=attacker)
        response = client.patch(
            _member_detail_url(attacker_ws.slug, target_member.id),
            {"role": "not-a-number"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        target_member.refresh_from_db()
        assert target_member.role == 15
        project_member.refresh_from_db()
        assert project_member.role == 15, "Guest cascade ran despite the invalid update"
