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
from rest_framework.exceptions import APIException

from plane.permissions.exceptions import (
    ListingAuthorizationConfigurationError,
    PermissionConfigurationError,
)


@pytest.mark.unit
class TestPermissionConfigurationError:
    def test_is_exception(self):
        assert issubclass(PermissionConfigurationError, Exception)

    def test_accepts_message(self):
        err = PermissionConfigurationError("bad config")
        assert "bad config" in str(err)


@pytest.mark.unit
class TestListingAuthorizationConfigurationError:
    def test_is_api_exception(self):
        assert issubclass(ListingAuthorizationConfigurationError, APIException)

    def test_status_code_is_500(self):
        assert ListingAuthorizationConfigurationError.status_code == 500

    def test_default_code(self):
        assert (
            ListingAuthorizationConfigurationError.default_code
            == "listing_authorization_misconfigured"
        )

    def test_detail_carries_code(self):
        err = ListingAuthorizationConfigurationError(
            detail="ViewName.list did not call .authorized_for()"
        )
        assert err.detail.code == "listing_authorization_misconfigured"
