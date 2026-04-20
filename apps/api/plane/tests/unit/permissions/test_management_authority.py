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
from plane.permissions.system_roles import can_manage_role, can_assign_role


@pytest.mark.unit
class TestCanManageRole:
    """Test tier-based management authority checks."""

    def test_owner_can_manage_owner(self):
        allowed, _ = can_manage_role("owner", "owner")
        assert allowed is True

    def test_owner_can_manage_admin(self):
        allowed, _ = can_manage_role("owner", "admin")
        assert allowed is True

    def test_owner_can_manage_member(self):
        allowed, _ = can_manage_role("owner", "member")
        assert allowed is True

    def test_owner_can_manage_guest(self):
        allowed, _ = can_manage_role("owner", "guest")
        assert allowed is True

    def test_owner_can_manage_custom_role(self):
        allowed, _ = can_manage_role("owner", "qa-lead")
        assert allowed is True

    def test_admin_can_manage_admin(self):
        allowed, _ = can_manage_role("admin", "admin")
        assert allowed is True

    def test_admin_can_manage_member(self):
        allowed, _ = can_manage_role("admin", "member")
        assert allowed is True

    def test_admin_can_manage_guest(self):
        allowed, _ = can_manage_role("admin", "guest")
        assert allowed is True

    def test_admin_can_manage_custom_role(self):
        allowed, _ = can_manage_role("admin", "qa-lead")
        assert allowed is True

    def test_admin_cannot_manage_owner(self):
        allowed, error = can_manage_role("admin", "owner")
        assert allowed is False
        assert "owner" in error

    def test_member_cannot_manage_owner(self):
        allowed, _ = can_manage_role("member", "owner")
        assert allowed is False

    def test_member_cannot_manage_admin(self):
        allowed, _ = can_manage_role("member", "admin")
        assert allowed is False

    def test_member_can_manage_member(self):
        allowed, _ = can_manage_role("member", "member")
        assert allowed is True

    def test_member_can_manage_guest(self):
        allowed, _ = can_manage_role("member", "guest")
        assert allowed is True

    def test_member_can_manage_custom_role(self):
        allowed, _ = can_manage_role("member", "qa-lead")
        assert allowed is True

    def test_guest_cannot_manage_owner(self):
        allowed, _ = can_manage_role("guest", "owner")
        assert allowed is False

    def test_guest_cannot_manage_admin(self):
        allowed, _ = can_manage_role("guest", "admin")
        assert allowed is False

    def test_guest_can_manage_guest(self):
        allowed, _ = can_manage_role("guest", "guest")
        assert allowed is True

    def test_custom_role_cannot_manage_owner(self):
        allowed, _ = can_manage_role("qa-lead", "owner")
        assert allowed is False

    def test_custom_role_cannot_manage_admin(self):
        allowed, _ = can_manage_role("qa-lead", "admin")
        assert allowed is False

    def test_custom_role_can_manage_another_custom_role(self):
        allowed, _ = can_manage_role("qa-lead", "tech-lead")
        assert allowed is True


@pytest.mark.unit
class TestCanAssignRole:
    """Test tier-based assignment authority checks."""

    def test_owner_can_assign_owner(self):
        allowed, _ = can_assign_role("owner", "owner")
        assert allowed is True

    def test_owner_can_assign_admin(self):
        allowed, _ = can_assign_role("owner", "admin")
        assert allowed is True

    def test_admin_can_assign_admin(self):
        allowed, _ = can_assign_role("admin", "admin")
        assert allowed is True

    def test_admin_cannot_assign_owner(self):
        allowed, error = can_assign_role("admin", "owner")
        assert allowed is False
        assert "owner" in error

    def test_member_cannot_assign_admin(self):
        allowed, _ = can_assign_role("member", "admin")
        assert allowed is False

    def test_member_can_assign_member(self):
        allowed, _ = can_assign_role("member", "member")
        assert allowed is True

    def test_member_can_assign_guest(self):
        allowed, _ = can_assign_role("member", "guest")
        assert allowed is True

    def test_member_can_assign_custom_role(self):
        allowed, _ = can_assign_role("member", "qa-lead")
        assert allowed is True

    def test_custom_role_cannot_assign_admin(self):
        allowed, _ = can_assign_role("qa-lead", "admin")
        assert allowed is False

    def test_custom_role_can_assign_custom_role(self):
        allowed, _ = can_assign_role("qa-lead", "tech-lead")
        assert allowed is True


@pytest.mark.unit
class TestCustomProtectedSlugs:
    """Test that the protected_slugs parameter override works."""

    def test_custom_map_overrides_default(self):
        custom = {"member": {"owner", "admin", "member"}}
        allowed, _ = can_manage_role("guest", "member", protected_slugs=custom)
        assert allowed is False

    def test_custom_map_does_not_affect_unmapped_slugs(self):
        custom = {"member": {"owner", "admin", "member"}}
        allowed, _ = can_manage_role("guest", "guest", protected_slugs=custom)
        assert allowed is True
