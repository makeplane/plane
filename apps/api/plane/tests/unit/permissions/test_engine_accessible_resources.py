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
Tests for get_accessible_resources().
"""

import pytest

from plane.permissions.definitions import (
    WorkitemPermissions,
)
from plane.db.models import (
    ResourcePermission,
)


@pytest.mark.django_db
class TestGetAccessibleResources:
    """Test get_accessible_resources() method."""

    def test_returns_project_ids_user_can_access(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Returns list of project UUIDs user has direct tuples for."""
        result = engine.get_accessible_resources(
            user=admin_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
        )
        assert perm_project.id in result

    def test_respects_permission_filter(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Only returns resources where user has the specified permission."""
        # Contributor has workitem:view
        result_view = engine.get_accessible_resources(
            user=member_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
        )
        assert perm_project.id in result_view

    def test_excludes_denied_resources(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Resources with explicit deny are excluded."""
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        perm.permissions_deny = ["workitem:view"]
        perm.save()

        result = engine.get_accessible_resources(
            user=admin_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
        )
        assert perm_project.id not in result

    def test_includes_link_relation_resources(
        self,
        engine,
        perm_project,
        perm_workspace,
        member_user,
        ws_member,
        perm_teamspace,
        teamspace_member_fixture,
        teamspace_project_link,
    ):
        """Projects accessible via teamspace link are included."""
        result = engine.get_accessible_resources(
            user=member_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
        )
        assert perm_project.id in result

    def test_include_relations_returns_dict(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """include_relations=True returns {uuid: role} dict."""
        result = engine.get_accessible_resources(
            user=admin_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
            include_relations=True,
        )
        assert isinstance(result, dict)
        assert perm_project.id in result
        assert result[perm_project.id] == "admin"

    def test_empty_for_no_access(
        self, engine, perm_workspace, outsider_user
    ):
        """Returns empty list for user with no tuples."""
        result = engine.get_accessible_resources(
            user=outsider_user,
            resource_type="project",
            workspace_id=perm_workspace.id,
            permission=WorkitemPermissions.VIEW,
        )
        assert result == []
