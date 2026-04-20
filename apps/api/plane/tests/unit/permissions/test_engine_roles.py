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
Tests for role-specific permission boundaries (T4).
Verifies that guest role cannot perform create/edit/delete on key resource types.
"""

import pytest

from plane.permissions.context import PermissionContext
from plane.permissions.definitions import (
    WorkitemPermissions,
    ModulePermissions,
    CyclePermissions,
)


GUEST_DENIED_PERMISSIONS = [
    WorkitemPermissions.CREATE,
    WorkitemPermissions.EDIT,
    WorkitemPermissions.DELETE,
    ModulePermissions.CREATE,
    ModulePermissions.EDIT,
    ModulePermissions.DELETE,
    CyclePermissions.CREATE,
    CyclePermissions.EDIT,
    CyclePermissions.DELETE,
]


@pytest.mark.django_db
class TestGuestNegatives:
    """Verify that project guest (role=5) cannot create/edit/delete on workitems, modules, cycles."""

    @pytest.mark.parametrize(
        "permission",
        GUEST_DENIED_PERMISSIONS,
        ids=[str(p) for p in GUEST_DENIED_PERMISSIONS],
    )
    def test_guest_denied(
        self, engine, perm_project, perm_workspace, guest_user, project_guest, permission
    ):
        """Guest should be denied this permission."""
        result = engine.check(
            user=guest_user,
            permission=permission,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False, f"Guest should NOT have {permission}"
