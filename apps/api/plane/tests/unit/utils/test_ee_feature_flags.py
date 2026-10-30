# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest.mock import Mock
from django.test import override_settings


@pytest.mark.unit
class TestEeFeatureFlags:
    @override_settings(EE_FEATURES_ENABLED=True)
    def test_flag_allows_view_when_enabled(self):
        from plane.payment.flags.flag import FeatureFlag
        from plane.payment.flags.flag_decorator import check_feature_flag

        @check_feature_flag(FeatureFlag.ISSUE_TYPES)
        def view(self, request, *args, **kwargs):
            return "ok"

        request = Mock()
        request.user.id = "u1"
        request.user.is_bot = False
        assert view(None, request, slug="ws") == "ok"

    @override_settings(EE_FEATURES_ENABLED=False)
    def test_flag_returns_402_when_disabled(self):
        from plane.payment.flags.flag import FeatureFlag
        from plane.payment.flags.flag_decorator import check_feature_flag

        @check_feature_flag(FeatureFlag.ISSUE_TYPES)
        def view(self, request, *args, **kwargs):
            return "ok"

        request = Mock()
        request.user.id = "u1"
        request.user.is_bot = False
        response = view(None, request, slug="ws")
        assert response.status_code == 402
        assert response.data["error_code"] == 1999
