# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.core.exceptions import RequestDataTooBig
from django.http import JsonResponse


class RequestBodySizeLimitMiddleware:
    """
    Middleware to catch RequestDataTooBig exceptions and return
    413 Request Entity Too Large instead of 400 Bad Request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            _ = request.body
        except RequestDataTooBig:
            return JsonResponse(
                {
                    "error": "REQUEST_BODY_TOO_LARGE",
                    "detail": "The size of the request body exceeds the maximum allowed size.",
                },
                status=413,
            )

        # If body size is OK, continue with the request
        return self.get_response(request)
