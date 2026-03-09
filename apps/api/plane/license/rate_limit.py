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
# Standard library imports
import os

# Third party imports
from typing import Any
from rest_framework.throttling import AnonRateThrottle
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class AdminAuthenticationThrottle(AnonRateThrottle):
    rate = os.environ.get("ADMIN_AUTHENTICATION_RATE_LIMIT", "10/minute")
    scope = "authentication"

    def throttle_failure_view(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        try:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                error_message="RATE_LIMIT_EXCEEDED",
            )
        except AuthenticationException as e:
            return Response(e.get_error_dict(), status=status.HTTP_429_TOO_MANY_REQUESTS)
