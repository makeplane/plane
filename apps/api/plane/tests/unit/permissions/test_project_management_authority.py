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
from plane.db.models import ProjectMember, User
from plane.db.models.permission import Role
from plane.permissions.system_roles import (
    can_manage_role, can_assign_role, PROJECT_PROTECTED_ROLE_SLUGS,
)


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


@pytest.mark.unit
class TestProjectManagementAuthority:
    """Test project-level tier protection: only admins can manage admins."""

    def test_admin_can_manage_admin(self):
        allowed, _ = can_manage_role("admin", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_admin_can_manage_contributor(self):
        allowed, _ = can_manage_role("admin", "contributor", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_admin_can_manage_commenter(self):
        allowed, _ = can_manage_role("admin", "commenter", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_admin_can_manage_guest(self):
        allowed, _ = can_manage_role("admin", "guest", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_contributor_cannot_manage_admin(self):
        allowed, error = can_manage_role("contributor", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is False
        assert "admin" in error

    def test_contributor_can_manage_contributor(self):
        allowed, _ = can_manage_role("contributor", "contributor", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_contributor_can_manage_commenter(self):
        allowed, _ = can_manage_role("contributor", "commenter", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_commenter_cannot_manage_admin(self):
        allowed, _ = can_manage_role("commenter", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is False

    def test_commenter_can_manage_commenter(self):
        allowed, _ = can_manage_role("commenter", "commenter", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_guest_cannot_manage_admin(self):
        allowed, _ = can_manage_role("guest", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is False

    def test_custom_role_cannot_manage_admin(self):
        allowed, _ = can_manage_role("qa-lead", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is False

    def test_custom_role_can_manage_custom_role(self):
        allowed, _ = can_manage_role("qa-lead", "tech-lead", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    # Assignment checks
    def test_admin_can_assign_admin(self):
        allowed, _ = can_assign_role("admin", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True

    def test_contributor_cannot_assign_admin(self):
        allowed, _ = can_assign_role("contributor", "admin", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is False

    def test_contributor_can_assign_contributor(self):
        allowed, _ = can_assign_role("contributor", "contributor", PROJECT_PROTECTED_ROLE_SLUGS)
        assert allowed is True


@pytest.mark.django_db
class TestProjectManagementAuthorityGrantGuard:
    """Test Layer 2: sync guard blocks project tier-violating grants."""

    def test_contributor_promoting_to_admin_is_blocked(self, perm_project, perm_workspace, project_contributor):
        """A contributor setting another member to admin via save() should raise."""
        target_user = _make_user("proj_target")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=5, role_ref=guest_role, is_active=True,
        )

        target_pm.updated_by_id = project_contributor.member_id
        target_pm.role_ref = admin_role
        target_pm.role = 20

        with pytest.raises(PermissionDenied):
            target_pm.save()

    def test_admin_promoting_to_admin_is_allowed(self, perm_project, perm_workspace, project_admin):
        """An admin changing a contributor to admin should work."""
        target_user = _make_user("proj_target2")
        contributor_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="contributor", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=15, role_ref=contributor_role, is_active=True,
        )

        target_pm.updated_by_id = project_admin.member_id
        target_pm.role_ref = admin_role
        target_pm.role = 20
        target_pm.save()  # Should not raise

    def test_commenter_promoting_to_admin_is_blocked(self, perm_project, perm_workspace, project_commenter):
        """A commenter cannot promote a guest to admin."""
        target_user = _make_user("proj_comm")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=5, role_ref=guest_role, is_active=True,
        )

        target_pm.updated_by_id = project_commenter.member_id
        target_pm.role_ref = admin_role
        target_pm.role = 20

        with pytest.raises(PermissionDenied):
            target_pm.save()

    def test_contributor_demoting_admin_is_blocked(self, perm_project, perm_workspace, project_contributor):
        """A contributor demoting an admin to guest should be blocked (old role protected)."""
        target_user = _make_user("proj_dem")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=20, role_ref=admin_role, is_active=True,
        )

        target_pm.updated_by_id = project_contributor.member_id
        target_pm.role_ref = guest_role
        target_pm.role = 5

        with pytest.raises(PermissionDenied):
            target_pm.save()

    def test_admin_demoting_admin_is_allowed(self, perm_project, perm_workspace, project_admin):
        """An admin demoting another admin to contributor should be allowed (same tier)."""
        target_user = _make_user("proj_adm")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()
        contributor_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="contributor", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=20, role_ref=admin_role, is_active=True,
        )

        target_pm.updated_by_id = project_admin.member_id
        target_pm.role_ref = contributor_role
        target_pm.role = 15
        target_pm.save()  # Should not raise

    def test_null_actor_promoting_to_admin_is_blocked(self, perm_project, perm_workspace):
        """If updated_by_id is NULL, deny for protected role changes."""
        target_user = _make_user("proj_null")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=5, role_ref=guest_role, is_active=True,
        )

        target_pm.updated_by_id = None
        target_pm.role_ref = admin_role
        target_pm.role = 20

        with pytest.raises(PermissionDenied):
            target_pm.save()

    def test_unprotected_role_change_always_allowed(self, perm_project, perm_workspace, project_contributor):
        """Changing from contributor to guest (both unprotected) should always work."""
        target_user = _make_user("proj_unp")
        contributor_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="contributor", is_system=True, deleted_at__isnull=True,
        ).first()
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=15, role_ref=contributor_role, is_active=True,
        )

        target_pm.updated_by_id = project_contributor.member_id
        target_pm.role_ref = guest_role
        target_pm.role = 5
        target_pm.save()  # Should not raise

    def test_workspace_admin_fallback_allows_admin_grant(self, perm_project, perm_workspace, ws_admin_member):
        """A workspace admin (not a project member) should be able to promote to project admin via the fallback."""
        target_user = _make_user("proj_wsa")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=5, role_ref=guest_role, is_active=True,
        )

        # ws_admin_member is NOT a project member — the fallback should kick in
        # First ensure they're not a project member
        ProjectMember.objects.filter(project=perm_project, member=ws_admin_member.member).delete()

        target_pm.updated_by_id = ws_admin_member.member_id
        target_pm.role_ref = admin_role
        target_pm.role = 20
        target_pm.save()  # Should not raise — workspace admin fallback gives "admin"

    def test_workspace_member_fallback_blocks_admin_grant(self, perm_project, perm_workspace, ws_member):
        """A workspace member (non-admin, not a project member) should NOT be able to promote to project admin."""
        target_user = _make_user("proj_wsm")
        guest_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="guest", is_system=True, deleted_at__isnull=True,
        ).first()
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=5, role_ref=guest_role, is_active=True,
        )

        # ws_member is NOT a project member and NOT a workspace admin
        ProjectMember.objects.filter(project=perm_project, member=ws_member.member).delete()

        target_pm.updated_by_id = ws_member.member_id
        target_pm.role_ref = admin_role
        target_pm.role = 20

        with pytest.raises(PermissionDenied):
            target_pm.save()

    def test_deactivation_does_not_trigger_guard(self, perm_project, perm_workspace, project_contributor):
        """Deactivating a project member (destroy path) should not trigger the guard."""
        target_user = _make_user("proj_deact")
        admin_role = Role.objects.filter(
            workspace=perm_workspace, namespace="project", slug="admin", is_system=True, deleted_at__isnull=True,
        ).first()

        target_pm = ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace, member=target_user,
            role=20, role_ref=admin_role, is_active=True,
        )

        # Contributor deactivating an admin — takes revoke path, no guard
        target_pm.updated_by_id = project_contributor.member_id
        target_pm.is_active = False
        target_pm.save()  # Should not raise
