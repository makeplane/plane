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

"""AuthorizedListingView — view mixin that enforces .authorized_for() on
listing endpoints.

Opt-in: only views that mix this in are checked. Non-listing paginated
endpoints are unaffected.

Fires only on successful responses (status < 400) to avoid masking a valid
early 400 with a configuration-error 500. Matches the existing deferred-
condition guard in BaseAPIView.finalize_response.

Enforcement strategy: instead of RAISING from finalize_response (which would
be caught by BaseAPIView.dispatch's outer try/except and result in an
unfinalized error response — no accepted_renderer, broken content
negotiation), we SWAP the response for a structured 500 Response BEFORE
calling super().finalize_response(). Super then finalizes the error
response normally, attaching the renderer + headers the same way it would
for any other response. The client sees a proper JSON 500 with a
machine-readable `code`.

MRO: list this mixin BEFORE BaseAPIView / BaseViewSet in the class bases so
its finalize_response runs before the base's.
"""

import logging

from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


CONFIGURATION_ERROR_CODE = "listing_authorization_misconfigured"


class AuthorizedListingView:
    """Enforce that listing endpoints call .authorized_for() or
    .authorization_not_required() on their queryset.
    """

    _authorized_listing_actions = frozenset({"list", "get"})

    def finalize_response(self, request, response, *args, **kwargs):
        # Evaluate the check BEFORE super finalizes. If it fails we swap in
        # a structured 500 Response so super can attach the renderer +
        # headers the normal way. Raising here would break because Plane's
        # BaseAPIView.dispatch catches exceptions and returns the result of
        # handle_exception WITHOUT re-finalizing (see app/views/base.py:146).
        if response.status_code < 400:
            action = getattr(self, "action", None) or request.method.lower()
            if action in self._authorized_listing_actions and not getattr(
                request, "_authorized_for_called", False
            ):
                logger.error(
                    "[PERM] %s.%s did not call .authorized_for()",
                    type(self).__name__, action,
                )
                response = Response(
                    data={
                        "detail": (
                            f"{type(self).__name__}.{action} did not call "
                            f"queryset.authorized_for(request, permission) or "
                            f"queryset.authorization_not_required(request). "
                            "Listing endpoints must authorize their queryset explicitly."
                        ),
                        "code": CONFIGURATION_ERROR_CODE,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        return super().finalize_response(request, response, *args, **kwargs)
