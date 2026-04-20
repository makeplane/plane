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
Tests for workspace-to-project role ceiling and auto-join mapping.

Workspace guests are capped at commenter/guest for project roles.
All other workspace roles have no ceiling.
Auto-join mapping: owner/admin → admin, guest → guest, everything else → contributor.
"""

import pytest

from plane.permissions.system_roles import (
    is_project_role_allowed_for_workspace_role,
    get_auto_join_project_role_slug,
    enforce_project_role_ceiling,
)


@pytest.mark.unit
class TestWorkspaceProjectCeiling:
    """Tests for is_project_role_allowed_for_workspace_role()."""

    # --- Workspace guest ceiling tests ---

    def test_guest_can_be_project_guest(self):
        assert is_project_role_allowed_for_workspace_role("guest", "guest") is True

    def test_guest_can_be_project_commenter(self):
        assert is_project_role_allowed_for_workspace_role("guest", "commenter") is True

    def test_guest_cannot_be_project_contributor(self):
        assert is_project_role_allowed_for_workspace_role("guest", "contributor") is False

    def test_guest_cannot_be_project_admin(self):
        assert is_project_role_allowed_for_workspace_role("guest", "admin") is False

    # --- Workspace member — no ceiling ---

    def test_member_can_be_project_guest(self):
        assert is_project_role_allowed_for_workspace_role("member", "guest") is True

    def test_member_can_be_project_admin(self):
        assert is_project_role_allowed_for_workspace_role("member", "admin") is True

    # --- Workspace admin — no ceiling ---

    def test_admin_can_be_project_guest(self):
        assert is_project_role_allowed_for_workspace_role("admin", "guest") is True

    def test_admin_can_be_project_admin(self):
        assert is_project_role_allowed_for_workspace_role("admin", "admin") is True

    # --- Workspace owner — no ceiling ---

    def test_owner_can_be_any_project_role(self):
        for proj_slug in ["guest", "commenter", "contributor", "admin"]:
            assert is_project_role_allowed_for_workspace_role("owner", proj_slug) is True

    # --- Custom workspace roles — no ceiling (unless slug is "guest") ---

    def test_custom_role_not_guest_has_no_ceiling(self):
        assert is_project_role_allowed_for_workspace_role("qa-lead", "admin") is True


@pytest.mark.unit
class TestAutoJoinProjectRoleSlug:
    """Tests for get_auto_join_project_role_slug()."""

    def test_owner_maps_to_admin(self):
        assert get_auto_join_project_role_slug("owner") == "admin"

    def test_admin_maps_to_admin(self):
        assert get_auto_join_project_role_slug("admin") == "admin"

    def test_member_maps_to_contributor(self):
        assert get_auto_join_project_role_slug("member") == "contributor"

    def test_guest_maps_to_guest(self):
        assert get_auto_join_project_role_slug("guest") == "guest"

    def test_custom_role_maps_to_contributor(self):
        assert get_auto_join_project_role_slug("qa-lead") == "contributor"

    def test_another_custom_role_maps_to_contributor(self):
        assert get_auto_join_project_role_slug("designer") == "contributor"


@pytest.mark.unit
class TestEnforceProjectRoleCeiling:
    """Tests for enforce_project_role_ceiling() with numeric workspace role fallback."""

    def test_guest_role_20_capped_to_10(self):
        """Workspace guest requesting admin(20) gets capped to commenter(10)."""
        assert enforce_project_role_ceiling(5, 20) == 10

    def test_guest_role_15_capped_to_10(self):
        """Workspace guest requesting contributor(15) gets capped to commenter(10)."""
        assert enforce_project_role_ceiling(5, 15) == 10

    def test_guest_role_10_unchanged(self):
        """Workspace guest requesting commenter(10) is allowed."""
        assert enforce_project_role_ceiling(5, 10) == 10

    def test_guest_role_5_unchanged(self):
        """Workspace guest requesting guest(5) is allowed."""
        assert enforce_project_role_ceiling(5, 5) == 5

    def test_member_role_20_unchanged(self):
        """Workspace member requesting admin(20) is allowed — no ceiling."""
        assert enforce_project_role_ceiling(15, 20) == 20

    def test_admin_role_5_unchanged(self):
        """Workspace admin requesting guest(5) is allowed — no ceiling."""
        assert enforce_project_role_ceiling(20, 5) == 5
