# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
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


@pytest.mark.django_db
class TestManagementAuthorityGrantGuard:
    """Test Layer 2: PermissionSyncMixin blocks tier-violating grants."""

    def test_admin_promoting_to_owner_is_blocked(self, perm_workspace, ws_admin_member):
        """An admin updating a member to owner via save() should raise."""
        target_user = _make_user("target")
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()
        owner_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="owner", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=15, role_ref=member_role, is_active=True,
        )

        target_member.updated_by_id = ws_admin_member.member_id
        target_member.role_ref = owner_role
        target_member.role = 25

        with pytest.raises(PermissionDenied):
            target_member.save()

    def test_owner_promoting_to_admin_is_allowed(self, perm_workspace, ws_owner_member):
        """An owner updating a member to admin should work fine."""
        target_user = _make_user("target")
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=15, role_ref=member_role, is_active=True,
        )

        target_member.updated_by_id = ws_owner_member.member_id
        target_member.role_ref = admin_role
        target_member.role = 20
        target_member.save()

    def test_null_actor_is_denied(self, perm_workspace):
        """If updated_by_id is NULL, deny by default."""
        target_user = _make_user("target")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()
        owner_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="owner", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=20, role_ref=admin_role, is_active=True,
        )

        target_member.updated_by_id = None
        target_member.role_ref = owner_role
        target_member.role = 25

        with pytest.raises(PermissionDenied):
            target_member.save()

    def test_unprotected_role_change_always_allowed(self, perm_workspace, ws_admin_member):
        """Changing from member to guest (both unprotected) should always work."""
        target_user = _make_user("target")
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=15, role_ref=member_role, is_active=True,
        )

        target_member.updated_by_id = ws_admin_member.member_id
        target_member.role_ref = guest_role
        target_member.role = 5
        target_member.save()

    def test_member_demoting_admin_is_blocked(self, perm_workspace, ws_member):
        """A member demoting an admin to guest should be blocked (old role is protected)."""
        target_user = _make_user("target")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=20, role_ref=admin_role, is_active=True,
        )

        target_member.updated_by_id = ws_member.member_id
        target_member.role_ref = guest_role
        target_member.role = 5

        with pytest.raises(PermissionDenied):
            target_member.save()

    def test_admin_demoting_admin_is_allowed(self, perm_workspace, ws_admin_member):
        """An admin demoting another admin to member should be allowed (same tier)."""
        target_user = _make_user("target")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=20, role_ref=admin_role, is_active=True,
        )

        target_member.updated_by_id = ws_admin_member.member_id
        target_member.role_ref = member_role
        target_member.role = 15
        target_member.save()

    def test_admin_demoting_owner_is_blocked(self, perm_workspace, ws_admin_member, ws_owner_member):
        """An admin demoting an owner to member should be blocked (old role is owner)."""
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()

        ws_owner_member.updated_by_id = ws_admin_member.member_id
        ws_owner_member.role_ref = member_role
        ws_owner_member.role = 15

        with pytest.raises(PermissionDenied):
            ws_owner_member.save()

    def test_member_promoting_to_admin_is_blocked(self, perm_workspace, ws_member):
        """A member escalating another member to admin should be blocked (new role protected)."""
        target_user = _make_user("target_esc")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=5, role_ref=guest_role, is_active=True,
        )

        target_member.updated_by_id = ws_member.member_id
        target_member.role_ref = admin_role
        target_member.role = 20

        with pytest.raises(PermissionDenied):
            target_member.save()

    def test_owner_demoting_owner_is_allowed(self, perm_workspace, ws_owner_member):
        """An owner demoting another owner to member should be allowed."""
        target_user = _make_user("target_own")
        owner_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="owner", is_system=True, deleted_at__isnull=True,
        ).first()
        member_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="member", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=25, role_ref=owner_role, is_active=True,
        )

        target_member.updated_by_id = ws_owner_member.member_id
        target_member.role_ref = member_role
        target_member.role = 15
        target_member.save()  # Should not raise

    def test_deactivation_does_not_trigger_guard(self, perm_workspace, ws_member):
        """Deactivating a member (destroy path) should NOT trigger the management authority guard.
        The guard only fires on grants (active=True), not revocations."""
        target_user = _make_user("target_deact")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="workspace", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_member = WorkspaceMember.objects.create(
            workspace=perm_workspace, member=target_user, role=20, role_ref=admin_role, is_active=True,
        )

        # A member deactivating an admin — normally blocked for role changes,
        # but deactivation takes the revoke path, skipping the guard.
        target_member.updated_by_id = ws_member.member_id
        target_member.is_active = False
        target_member.save()  # Should not raise — revoke path, no guard
