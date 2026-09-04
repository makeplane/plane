# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for service-account role resolution."""

import pytest

from plane.utils.service_account import SERVICE_ACCOUNT_ROLES, resolve_service_account_role


@pytest.mark.unit
class TestResolveServiceAccountRole:
    """Test service-account role resolution"""

    def test_valid_role_names_map_to_values(self):
        """Test role names map to their WorkspaceMember role values"""
        assert resolve_service_account_role("admin") == 20
        assert resolve_service_account_role("member") == 15
        assert resolve_service_account_role("guest") == 5

    def test_valid_integer_roles_pass_through(self):
        """Test allowed integer roles pass through unchanged"""
        for value in SERVICE_ACCOUNT_ROLES.values():
            assert resolve_service_account_role(value) == value

    def test_unknown_role_name_raises(self):
        """Test an unknown role name raises ValueError"""
        with pytest.raises(ValueError):
            resolve_service_account_role("owner")

    def test_unknown_role_name_suppresses_keyerror_context(self):
        """Test the ValueError does not chain the internal KeyError"""
        with pytest.raises(ValueError) as exc_info:
            resolve_service_account_role("owner")
        assert exc_info.value.__suppress_context__ is True
        assert exc_info.value.__cause__ is None

    def test_unsupported_integer_role_raises(self):
        """Test an integer outside the allowed set raises ValueError"""
        # An integer outside the allowed set (20/15/5) must not slip through and
        # create a member with an invalid role.
        with pytest.raises(ValueError):
            resolve_service_account_role(99)
