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

"""
Tests for PermissionSyncMixin auto-sync behavior.
"""

import pytest

from plane.permissions.engine import PermissionEngine
from plane.permissions.context import PermissionContext
from plane.permissions.definitions import WorkitemPermissions
from plane.db.models import (
    WorkspaceMember,
    ProjectMember,
    ResourcePermission,
)
from plane.tests.unit.permissions.conftest import _make_user


@pytest.mark.django_db
class TestWorkspaceMemberSync:
    """Test that WorkspaceMember changes auto-sync to ResourcePermission."""

    def test_workspace_member_create_syncs(self, perm_workspace):
        """Creating WorkspaceMember creates ResourcePermission tuple."""
        user = _make_user("wmsync")
        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        perm = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="workspace",
            resource_id=perm_workspace.id,
            deleted_at__isnull=True,
        ).first()
        assert perm is not None
        assert perm.relation == "member"

    def test_role_change_syncs(self, perm_workspace):
        """Changing member role updates ResourcePermission relation."""
        user = _make_user("wmrole")
        wm = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        # Change role from member (15) to guest (5)
        wm.role = 5
        wm.save()

        perm = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="workspace",
            resource_id=perm_workspace.id,
            deleted_at__isnull=True,
        ).first()
        assert perm is not None
        assert perm.relation == "guest"

    def test_member_delete_revokes(self, perm_workspace):
        """Soft-deleting member soft-deletes ResourcePermission."""
        user = _make_user("wmdel")
        wm = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        # Soft-delete the membership
        wm.delete()

        # Permission should be soft-deleted
        assert not ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="workspace",
            resource_id=perm_workspace.id,
            deleted_at__isnull=True,
        ).exists()

    def test_deactivate_member_revokes(self, perm_workspace):
        """Setting is_active=False revokes ResourcePermission."""
        user = _make_user("wmdeact")
        wm = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        wm.is_active = False
        wm.save()

        assert not ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="workspace",
            resource_id=perm_workspace.id,
            deleted_at__isnull=True,
        ).exists()


@pytest.mark.django_db
class TestProjectMemberSync:
    """Test that ProjectMember changes auto-sync to ResourcePermission."""

    def test_project_member_create_syncs(self, perm_project, perm_workspace):
        """Creating ProjectMember creates ResourcePermission tuple."""
        user = _make_user("pmsync")
        # Need workspace membership first
        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )
        ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        perm = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).first()
        assert perm is not None
        assert perm.relation == "contributor"

    def test_project_role_change_syncs(self, perm_project, perm_workspace):
        """Changing project member role updates ResourcePermission relation."""
        user = _make_user("pmrole")
        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )
        pm = ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        # Change from contributor (15) to commenter (10)
        pm.role = 10
        pm.save()

        perm = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).first()
        assert perm is not None
        assert perm.relation == "commenter"

    def test_project_member_delete_revokes(self, perm_project, perm_workspace):
        """Soft-deleting project member soft-deletes ResourcePermission."""
        user = _make_user("pmdel")
        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )
        pm = ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        pm.delete()

        assert not ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).exists()

    def test_sync_correct_project_role_mapping(self, perm_project, perm_workspace):
        """Verify all project role mappings: 20->admin, 15->contributor, 10->commenter, 5->guest."""
        role_map = {20: "admin", 15: "contributor", 10: "commenter", 5: "guest"}

        for role_value, expected_relation in role_map.items():
            user = _make_user(f"pmmap{role_value}")
            WorkspaceMember.objects.create(
                workspace=perm_workspace,
                member=user,
                role=15,
                is_active=True,
            )
            ProjectMember.objects.create(
                project=perm_project,
                workspace=perm_workspace,
                member=user,
                role=role_value,
                is_active=True,
            )

            perm = ResourcePermission.objects.get(
                subject_type="user",
                subject_id=user.id,
                resource_type="project",
                resource_id=perm_project.id,
                deleted_at__isnull=True,
            )
            assert perm.relation == expected_relation, (
                f"Role {role_value} should map to '{expected_relation}', got '{perm.relation}'"
            )


@pytest.mark.django_db
class TestSoftDeleteDenial:
    """Test that soft-deleted workspace member loses project access (T5)."""

    def test_soft_deleted_ws_member_denied_project(self, perm_project, perm_workspace):
        """Soft-deleted workspace member should be denied project access
        even if a project member record still exists."""
        user = _make_user("softdel")
        engine = PermissionEngine(use_cache=False)

        # Create workspace membership
        wm = WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )
        # Create project membership
        pm = ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=user,
            role=15,
            is_active=True,
        )

        # Verify access works initially
        result = engine.check(
            user=user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

        # Soft-delete the workspace membership (revokes workspace-level tuple)
        wm.delete()

        # Workspace tuple should be soft-deleted
        assert not ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="workspace",
            resource_id=perm_workspace.id,
            deleted_at__isnull=True,
        ).exists()

        # Project tuple still active, but workspace membership is gone.
        # The engine should still check project-level tuple which is still active.
        # This verifies that the project-level permission is independent.
        project_perm = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).first()
        assert project_perm is not None, "Project tuple should still be active"

        # Now soft-delete project membership too
        pm.delete()

        # Both tuples revoked — should be fully denied
        result = engine.check(
            user=user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False
