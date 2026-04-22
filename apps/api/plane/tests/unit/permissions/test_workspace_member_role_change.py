# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial

"""Regression: admin can change guest role to admin/owner via the view.

Bug: the workspace member partial_update view didn't set
workspace_member.updated_by_id, so PermissionSyncMixin's management-authority
guard saw actor_id=None and denied any role change where the new (or old) role
was protected (admin/owner). Manifested most visibly as "admin cannot promote
a guest to admin".
"""

import pytest
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied
from plane.db.models import WorkspaceMember, User
from plane.db.models.permission import Role


def _make_user(prefix="user"):
    from uuid import uuid4
    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{uid}@test.plane.so",
        username=f"{prefix}_{uid}",
        first_name=prefix.title(),
        last_name="Test",
    )
    user.set_password("testpass123")
    user.save(update_fields=["password"])
    return user


def _get_role(workspace, slug):
    return Role.objects.filter(
        workspace=workspace, namespace="workspace", slug=slug, is_system=True, deleted_at__isnull=True,
    ).first()


@pytest.mark.django_db
class TestGuardFiresWithoutActor:
    """Direct-save tests proving the management-authority guard requires an actor."""

    def test_unprotected_change_succeeds_without_actor(self, perm_workspace, ws_admin_member):
        """guest → member skips the guard because neither role is protected."""
        target = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=_make_user("g"),
            role=5,
            role_ref=_get_role(perm_workspace, "guest"),
            is_active=True,
        )
        target.role_ref = _get_role(perm_workspace, "member")
        target.role = 15
        target.save()

    def test_protected_change_fails_without_actor(self, perm_workspace, ws_admin_member):
        """guest → admin trips the guard when updated_by_id is unset."""
        target = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=_make_user("g"),
            role=5,
            role_ref=_get_role(perm_workspace, "guest"),
            is_active=True,
        )
        target.role_ref = _get_role(perm_workspace, "admin")
        target.role = 20
        with pytest.raises(PermissionDenied):
            target.save()

    def test_protected_change_succeeds_with_actor(self, perm_workspace, ws_admin_member):
        """guest → admin is allowed when updated_by_id identifies the admin actor."""
        target = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=_make_user("g"),
            role=5,
            role_ref=_get_role(perm_workspace, "guest"),
            is_active=True,
        )
        target.updated_by_id = ws_admin_member.member_id
        target.role_ref = _get_role(perm_workspace, "admin")
        target.role = 20
        target.save()


@pytest.mark.django_db
class TestGuestRoleChangeViaView:
    """End-to-end: admin PATCHes a guest's role via the workspace member endpoint."""

    def _client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_admin_can_promote_guest_to_member(self, perm_workspace, ws_admin_member, admin_user):
        guest = _make_user("guest")
        target = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=guest,
            role=5,
            role_ref=_get_role(perm_workspace, "guest"),
            is_active=True,
        )
        response = self._client_for(admin_user).patch(
            f"/api/workspaces/{perm_workspace.slug}/members/{target.pk}/",
            {"role_slug": "member"},
            format="json",
        )
        assert response.status_code == 200, response.data
        target.refresh_from_db()
        assert target.role_ref.slug == "member"

    def test_admin_can_promote_guest_to_admin(self, perm_workspace, ws_admin_member, admin_user):
        """Regression: previously failed with 'no actor identified for a protected role grant'."""
        guest = _make_user("guest")
        target = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=guest,
            role=5,
            role_ref=_get_role(perm_workspace, "guest"),
            is_active=True,
        )
        response = self._client_for(admin_user).patch(
            f"/api/workspaces/{perm_workspace.slug}/members/{target.pk}/",
            {"role_slug": "admin"},
            format="json",
        )
        assert response.status_code == 200, response.data
        target.refresh_from_db()
        assert target.role_ref.slug == "admin"
