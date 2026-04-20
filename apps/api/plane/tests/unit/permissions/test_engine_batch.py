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
Tests for grant(), revoke(), bulk_grant(), check_batch(), bulk_check(), get_permissions() operations.
"""

import pytest
from uuid import uuid4

from plane.permissions.grants import Grant
from plane.permissions.context import PermissionContext
from plane.permissions.definitions import (
    WorkitemPermissions,
    ProjectPermissions,
    ResourceType,
)
from plane.db.models import ResourcePermission, PermissionAuditLog, Issue, State
from plane.tests.unit.permissions.conftest import _make_user


@pytest.mark.django_db
class TestGrantOperation:
    """Test grant() method."""

    def test_grant_creates_permission(self, engine, perm_workspace, owner_user):
        """grant() creates a new ResourcePermission row."""
        new_user = _make_user("grantee")
        resource_id = uuid4()

        perm = engine.grant(
            granter=owner_user,
            grant=Grant(
                subject_type="user",
                subject_id=new_user.id,
                relation="admin",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        )

        assert perm is not None
        assert perm.relation == "admin"
        assert perm.subject_id == new_user.id
        assert perm.resource_id == resource_id

    def test_grant_updates_existing(self, engine, perm_workspace, perm_project, admin_user, project_admin):
        """grant() with different relation updates existing row."""
        engine.grant(
            granter=admin_user,
            grant=Grant(
                subject_type="user",
                subject_id=admin_user.id,
                relation="contributor",
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )

        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        assert perm.relation == "contributor"

    def test_grant_restores_soft_deleted(self, engine, perm_workspace, owner_user):
        """grant() on soft-deleted row restores it."""
        new_user = _make_user("restore")
        resource_id = uuid4()

        # Create and soft-delete
        engine.grant(
            granter=owner_user,
            grant=Grant(
                subject_type="user",
                subject_id=new_user.id,
                relation="admin",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        )
        engine.revoke(
            revoker=owner_user,
            subject_type="user",
            subject_id=new_user.id,
            resource_type="project",
            resource_id=resource_id,
            workspace_id=perm_workspace.id,
        )

        # Verify soft-deleted
        assert not ResourcePermission.objects.filter(
            subject_id=new_user.id, resource_id=resource_id, deleted_at__isnull=True
        ).exists()

        # Re-grant should restore
        restored = engine.grant(
            granter=owner_user,
            grant=Grant(
                subject_type="user",
                subject_id=new_user.id,
                relation="contributor",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        )
        assert restored.deleted_at is None
        assert restored.relation == "contributor"

    def test_grant_creates_audit_log(self, engine, perm_workspace, owner_user):
        """grant() creates a PermissionAuditLog entry."""
        new_user = _make_user("auditgrant")
        resource_id = uuid4()

        engine.grant(
            granter=owner_user,
            grant=Grant(
                subject_type="user",
                subject_id=new_user.id,
                relation="admin",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        )

        log = PermissionAuditLog.objects.filter(
            subject_id=new_user.id,
            resource_id=resource_id,
            action="grant",
        ).first()
        assert log is not None
        assert log.relation_after == "admin"


@pytest.mark.django_db
class TestRevokeOperation:
    """Test revoke() method."""

    def test_revoke_soft_deletes(self, engine, perm_workspace, perm_project, admin_user, project_admin):
        """revoke() sets deleted_at on the ResourcePermission."""
        result = engine.revoke(
            revoker=admin_user,
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )
        assert result is True

        # Should not be visible via default manager
        assert not ResourcePermission.objects.filter(
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).exists()

        # Should be visible via all_objects
        assert ResourcePermission.all_objects.filter(
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
        ).exists()

    def test_revoke_nonexistent_returns_false(self, engine, perm_workspace, owner_user):
        """revoke() on non-existent tuple returns False."""
        result = engine.revoke(
            revoker=owner_user,
            subject_type="user",
            subject_id=uuid4(),
            resource_type="project",
            resource_id=uuid4(),
            workspace_id=perm_workspace.id,
        )
        assert result is False

    def test_revoke_creates_audit_log(self, engine, perm_workspace, perm_project, admin_user, project_admin):
        """revoke() creates a PermissionAuditLog entry with relation_before."""
        engine.revoke(
            revoker=admin_user,
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )

        log = PermissionAuditLog.objects.filter(
            subject_id=admin_user.id,
            resource_id=perm_project.id,
            action="revoke",
        ).first()
        assert log is not None
        assert log.relation_before == "admin"


@pytest.mark.django_db
class TestBulkGrant:
    """Test bulk_grant() method."""

    def test_bulk_grant_creates_multiple(self, engine, perm_workspace, owner_user):
        """bulk_grant() creates multiple ResourcePermission rows efficiently."""
        users = [_make_user(f"bulk{i}") for i in range(3)]
        resource_id = uuid4()

        grants = [
            Grant(
                subject_type="user",
                subject_id=u.id,
                relation="contributor",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            )
            for u in users
        ]

        results = engine.bulk_grant(granter=owner_user, grants=grants)
        assert len(results) == 3

        for u in users:
            assert ResourcePermission.objects.filter(
                subject_id=u.id,
                resource_type="project",
                resource_id=resource_id,
                deleted_at__isnull=True,
            ).exists()

    def test_bulk_grant_updates_existing(
        self, engine, perm_workspace, perm_project, admin_user, project_admin
    ):
        """bulk_grant() updates existing rows in batch."""
        results = engine.bulk_grant(
            granter=admin_user,
            grants=[
                Grant(
                    subject_type="user",
                    subject_id=admin_user.id,
                    relation="contributor",
                    resource_type="project",
                    resource_id=perm_project.id,
                    workspace_id=perm_workspace.id,
                )
            ],
        )
        assert len(results) == 1

        perm = ResourcePermission.objects.get(
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        assert perm.relation == "contributor"


@pytest.mark.django_db
class TestGetPermissions:
    """Test get_permissions() method."""

    def test_get_permissions_returns_all(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """get_permissions() returns dict of all permissions for a resource type."""
        perms = engine.get_permissions(
            user=admin_user,
            resource_type=ResourceType.PROJECT,
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )
        assert isinstance(perms, dict)
        # Admin should have can_view, can_edit, can_manage
        assert perms.get("can_view") is True
        assert perms.get("can_edit") is True
        assert perms.get("can_manage") is True


@pytest.mark.django_db
class TestCheckBatch:
    """Test check_batch() method for batched permission checks."""

    def test_batch_mixed_allow_deny(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Contributor gets VIEW and CREATE but not MANAGE via check_batch."""
        results = engine.check_batch(
            user=member_user,
            permissions=[
                WorkitemPermissions.VIEW,
                WorkitemPermissions.CREATE,
                ProjectPermissions.MANAGE,
            ],
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert len(results) == 3
        assert results[str(WorkitemPermissions.VIEW)].allowed is True
        assert results[str(WorkitemPermissions.CREATE)].allowed is True
        assert results[str(ProjectPermissions.MANAGE)].allowed is False

    def test_batch_shared_hierarchy_admin(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Admin gets all permissions in a batch check."""
        results = engine.check_batch(
            user=admin_user,
            permissions=[
                WorkitemPermissions.VIEW,
                WorkitemPermissions.CREATE,
                WorkitemPermissions.EDIT,
                WorkitemPermissions.DELETE,
                ProjectPermissions.MANAGE,
            ],
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        for perm_str, result in results.items():
            assert result.allowed is True, f"Admin should have {perm_str}"

    def test_batch_with_cache(
        self, cached_engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Second call hits cache, returns same results."""
        perms = [WorkitemPermissions.VIEW, WorkitemPermissions.CREATE]

        results1 = cached_engine.check_batch(
            user=admin_user,
            permissions=perms,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        results2 = cached_engine.check_batch(
            user=admin_user,
            permissions=perms,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        for perm_str in results1:
            assert results1[perm_str].allowed == results2[perm_str].allowed

    def test_batch_defer_conditions(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Contributor DELETE with defer_conditions returns conditional result."""
        results = engine.check_batch(
            user=member_user,
            permissions=[WorkitemPermissions.DELETE],
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
            defer_conditions=True,
        )
        result = results[str(WorkitemPermissions.DELETE)]
        # Contributor has workitem:delete+creator, so should be conditionally allowed
        assert result.allowed is True
        assert "creator" in result.conditions

    def test_batch_empty_list(self, engine, perm_project, perm_workspace, admin_user, project_admin):
        """Empty permissions list returns empty dict."""
        results = engine.check_batch(
            user=admin_user,
            permissions=[],
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )
        assert results == {}


@pytest.mark.django_db
class TestBulkCheck:
    """Test bulk_check() method — one permission, many resources."""

    def test_bulk_check_returns_results_for_all_resources(
        self, engine, perm_project, perm_workspace, member_user, project_contributor, default_state,
    ):
        """All issues in the same project should return True for VIEW."""
        from crum import impersonate

        with impersonate(member_user):
            issues = [
                Issue.objects.create(
                    project=perm_project,
                    workspace=perm_workspace,
                    name=f"Bulk issue {i}",
                    state=default_state,
                )
                for i in range(3)
            ]

        results = engine.bulk_check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            resource_ids=[issue.id for issue in issues],
            workspace_id=perm_workspace.id,
        )

        assert len(results) == 3
        for issue in issues:
            assert results[issue.id] is True, f"Expected True for issue {issue.id}"

    def test_bulk_check_mixed_access(
        self,
        engine,
        perm_project,
        perm_workspace,
        other_workspace,
        other_project,
        member_user,
        project_contributor,
        default_state,
    ):
        """User has access to project A but not project B — mixed results."""
        from crum import impersonate

        with impersonate(member_user):
            issue_a = Issue.objects.create(
                project=perm_project,
                workspace=perm_workspace,
                name="Issue in accessible project",
                state=default_state,
            )

        # Create a state + issue in the other project (member_user has no membership)
        owner = perm_workspace.owner
        with impersonate(owner):
            other_state = State.objects.create(
                project=other_project,
                workspace=other_workspace,
                name="Backlog",
                group="backlog",
                default=True,
            )
            issue_b = Issue.objects.create(
                project=other_project,
                workspace=other_workspace,
                name="Issue in inaccessible project",
                state=other_state,
            )

        # bulk_check with workspace_id=None to skip workspace ownership validation
        # (these issues are in different workspaces)
        results = engine.bulk_check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            resource_ids=[issue_a.id, issue_b.id],
        )

        assert len(results) == 2
        assert results[issue_a.id] is True
        assert results[issue_b.id] is False

    def test_bulk_check_empty_list(self, engine):
        """Empty resource_ids returns empty dict."""
        user = _make_user("empty")
        results = engine.bulk_check(
            user=user,
            permission=WorkitemPermissions.VIEW,
            resource_ids=[],
        )
        assert results == {}

    def test_bulk_check_no_permission(
        self, engine, perm_project, perm_workspace, outsider_user, default_state, owner_user,
    ):
        """User with no membership gets False for all resources."""
        from crum import impersonate

        with impersonate(owner_user):
            issues = [
                Issue.objects.create(
                    project=perm_project,
                    workspace=perm_workspace,
                    name=f"Outsider issue {i}",
                    state=default_state,
                )
                for i in range(2)
            ]

        results = engine.bulk_check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            resource_ids=[issue.id for issue in issues],
            workspace_id=perm_workspace.id,
        )

        assert len(results) == 2
        for issue in issues:
            assert results[issue.id] is False

    def test_bulk_check_uses_cache(
        self,
        cached_engine,
        perm_project,
        perm_workspace,
        member_user,
        project_contributor,
        default_state,
    ):
        """Second call returns cached results without DB queries."""
        from crum import impersonate
        from unittest.mock import patch as mock_patch

        with impersonate(member_user):
            issue = Issue.objects.create(
                project=perm_project,
                workspace=perm_workspace,
                name="Cache test issue",
                state=default_state,
            )

        resource_ids = [issue.id]

        # First call — populates cache
        results1 = cached_engine.bulk_check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            resource_ids=resource_ids,
            workspace_id=perm_workspace.id,
        )

        # Second call — should hit cache, no hierarchy building needed
        with mock_patch.object(
            cached_engine, "_batch_build_hierarchy_chains"
        ) as mock_hierarchy:
            results2 = cached_engine.bulk_check(
                user=member_user,
                permission=WorkitemPermissions.VIEW,
                resource_ids=resource_ids,
                workspace_id=perm_workspace.id,
            )
            # Should not be called because all results came from cache
            mock_hierarchy.assert_not_called()

        assert results1 == results2
