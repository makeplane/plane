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
Tests for deferred permission conditions enforcement.

Verifies that views using defer_conditions=True must consume conditions
via get_permission_conditions(), and that finalize_response raises
PermissionDenied if conditions are left unconsumed.
"""

import pytest
from unittest.mock import MagicMock

from rest_framework.exceptions import PermissionDenied

from plane.permissions.decorators import get_permission_conditions


class TestGetPermissionConditions:
    """Tests for the get_permission_conditions helper."""

    def test_returns_conditions_and_marks_consumed(self):
        request = MagicMock()
        request._permission_conditions = ("creator",)
        request._conditions_consumed = False

        conditions = get_permission_conditions(request)

        assert conditions == ("creator",)
        assert request._conditions_consumed is True

    def test_returns_empty_when_no_conditions_set(self):
        request = MagicMock(spec=[])  # no attributes by default

        conditions = get_permission_conditions(request)

        assert conditions == ()
        assert request._conditions_consumed is True

    def test_idempotent_multiple_calls(self):
        request = MagicMock()
        request._permission_conditions = ("creator",)
        request._conditions_consumed = False

        first = get_permission_conditions(request)
        second = get_permission_conditions(request)

        assert first == ("creator",)
        assert second == ("creator",)
        assert request._conditions_consumed is True

    def test_empty_conditions_already_consumed(self):
        request = MagicMock()
        request._permission_conditions = ()
        request._conditions_consumed = True

        conditions = get_permission_conditions(request)

        assert conditions == ()
        assert request._conditions_consumed is True


class TestFinalizeResponseEnforcement:
    """Tests for the finalize_response enforcement logic.

    These test the enforcement pattern directly without needing
    the full DRF view lifecycle.
    """

    @staticmethod
    def _check_enforcement(request):
        """Reproduce the finalize_response enforcement logic."""
        conditions = getattr(request, '_permission_conditions', ())
        consumed = getattr(request, '_conditions_consumed', True)
        if conditions and not consumed:
            raise PermissionDenied(
                f"Deferred permission conditions {conditions} were not consumed."
            )

    def test_unconsumed_conditions_raises(self):
        request = MagicMock()
        request._permission_conditions = ("creator",)
        request._conditions_consumed = False

        with pytest.raises(PermissionDenied):
            self._check_enforcement(request)

    def test_consumed_conditions_passes(self):
        request = MagicMock()
        request._permission_conditions = ("creator",)
        request._conditions_consumed = True

        # Should not raise
        self._check_enforcement(request)

    def test_empty_conditions_no_enforcement(self):
        request = MagicMock()
        request._permission_conditions = ()
        request._conditions_consumed = False

        # Empty conditions = nothing to enforce, should not raise
        self._check_enforcement(request)

    def test_no_attributes_set_no_enforcement(self):
        """When @can is not used, no attributes exist — should not raise."""
        request = MagicMock(spec=[])

        # Should not raise
        self._check_enforcement(request)

    def test_helper_prevents_enforcement_error(self):
        """Full flow: conditions set, helper called, enforcement passes."""
        request = MagicMock()
        request._permission_conditions = ("creator",)
        request._conditions_consumed = False

        # Simulate view calling the helper
        get_permission_conditions(request)

        # Enforcement should now pass
        self._check_enforcement(request)
