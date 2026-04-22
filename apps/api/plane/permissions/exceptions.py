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

"""Permission-system exceptions.

PermissionConfigurationError — programmer error surfaced at call-site when
a model lacks PermissionMeta or the given permission isn't in its scope_map.
Not an APIException; it signals a bug, not a client error.

ListingAuthorizationConfigurationError — raised at response finalize time
when AuthorizedListingView detects that .authorized_for() was not called
for a listing endpoint. APIException subclass so DRF's exception handler
converts it to a structured 500 response with code on the ErrorDetail.
"""

from rest_framework.exceptions import APIException


class PermissionConfigurationError(Exception):
    """Raised when the permission system is misconfigured at a call site."""


class ListingAuthorizationConfigurationError(APIException):
    """Raised by AuthorizedListingView when a listing endpoint fails to call
    queryset.authorized_for(request, permission) before responding.
    """

    status_code = 500
    default_detail = (
        "Listing endpoint did not call queryset.authorized_for(request, permission)."
    )
    default_code = "listing_authorization_misconfigured"
