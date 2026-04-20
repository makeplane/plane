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
Tests for grant operations (grant_permission, bulk_grant_permissions).

Verifies that soft-deleted records are treated as tombstones — grant operations
always work through the active-only manager and never restore deleted rows.
"""

import pytest
from uuid import uuid4

from django.utils import timezone

from plane.db.models import ResourcePermission
from plane.permissions.grants import (
    Grant,
    grant_permission,
    bulk_grant_permissions,
    revoke_permission,
)
from plane.tests.unit.permissions.conftest import _make_user


@pytest.mark.django_db
class TestGrantPermission:
    """Tests for grant_permission()."""

    def test_grant_creates_new_when_soft_deleted_exists(self, perm_workspace, owner_user):
        """Granting when a soft-deleted record exists creates a new active row."""
        user = _make_user("grantsd")
        resource_id = uuid4()

        # Create a soft-deleted record directly
        ResourcePermission.all_objects.create(
            workspace=perm_workspace,
            subject_type="user",
            subject_id=user.id,
            relation="member",
            resource_type="project",
            resource_id=resource_id,
            deleted_at=timezone.now(),
        )

        # Grant should create a NEW active record (not restore the deleted one)
        grant_obj = Grant(
            subject_type="user",
            subject_id=user.id,
            relation="admin",
            resource_type="project",
            resource_id=resource_id,
            workspace_id=perm_workspace.id,
        )
        perm = grant_permission(owner_user, grant_obj)

        assert perm.relation == "admin"
        assert perm.deleted_at is None

        # Should now have 2 rows total: 1 soft-deleted + 1 active
        total = ResourcePermission.all_objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert total == 2

        # Only 1 active
        active = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert active == 1

    def test_grant_updates_existing_active_record(self, perm_workspace, owner_user):
        """Granting when an active record exists updates it in-place."""
        user = _make_user("grantup")
        resource_id = uuid4()

        # First grant
        grant_obj = Grant(
            subject_type="user",
            subject_id=user.id,
            relation="member",
            resource_type="project",
            resource_id=resource_id,
            workspace_id=perm_workspace.id,
        )
        perm1 = grant_permission(owner_user, grant_obj)
        original_id = perm1.id

        # Second grant with different relation — should update same record
        grant_obj.relation = "admin"
        perm2 = grant_permission(owner_user, grant_obj)

        assert perm2.id == original_id
        assert perm2.relation == "admin"

        # Still only 1 row total
        total = ResourcePermission.all_objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert total == 1

    def test_grant_revoke_grant_cycle(self, perm_workspace, owner_user):
        """grant -> revoke -> re-grant leaves 1 active + 1 tombstone."""
        user = _make_user("grantcycle")
        resource_id = uuid4()

        # Grant
        grant_obj = Grant(
            subject_type="user",
            subject_id=user.id,
            relation="member",
            resource_type="project",
            resource_id=resource_id,
            workspace_id=perm_workspace.id,
        )
        grant_permission(owner_user, grant_obj)

        # Revoke
        revoke_permission(
            owner_user,
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
            workspace_id=perm_workspace.id,
        )

        # Re-grant
        grant_obj.relation = "admin"
        perm = grant_permission(owner_user, grant_obj)

        assert perm.relation == "admin"
        assert perm.deleted_at is None

        # 1 tombstone + 1 active = 2 total
        total = ResourcePermission.all_objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert total == 2

        active = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert active == 1


@pytest.mark.django_db
class TestBulkGrantPermissions:
    """Tests for bulk_grant_permissions()."""

    def test_bulk_grant_ignores_soft_deleted(self, perm_workspace, owner_user):
        """Bulk grant creates new active records, leaving soft-deleted ones untouched."""
        user = _make_user("bulksd")
        resource_id = uuid4()

        # Pre-create a soft-deleted record
        ResourcePermission.all_objects.create(
            workspace=perm_workspace,
            subject_type="user",
            subject_id=user.id,
            relation="guest",
            resource_type="project",
            resource_id=resource_id,
            deleted_at=timezone.now(),
        )

        grants = [
            Grant(
                subject_type="user",
                subject_id=user.id,
                relation="contributor",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        ]
        result = bulk_grant_permissions(owner_user, grants)

        assert len(result) == 1
        assert result[0].relation == "contributor"
        assert result[0].deleted_at is None

        # 1 tombstone + 1 active = 2 total
        total = ResourcePermission.all_objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert total == 2

    def test_bulk_grant_updates_active_records(self, perm_workspace, owner_user):
        """Bulk grant updates existing active records in-place."""
        user = _make_user("bulkup")
        resource_id = uuid4()

        # Pre-create an active record
        existing = ResourcePermission.objects.create(
            workspace=perm_workspace,
            subject_type="user",
            subject_id=user.id,
            relation="member",
            resource_type="project",
            resource_id=resource_id,
        )

        grants = [
            Grant(
                subject_type="user",
                subject_id=user.id,
                relation="admin",
                resource_type="project",
                resource_id=resource_id,
                workspace_id=perm_workspace.id,
            ),
        ]
        result = bulk_grant_permissions(owner_user, grants)

        assert len(result) == 1
        assert result[0].id == existing.id
        assert result[0].relation == "admin"

        # Still only 1 row total
        total = ResourcePermission.all_objects.filter(
            subject_type="user",
            subject_id=user.id,
            resource_type="project",
            resource_id=resource_id,
        ).count()
        assert total == 1
