# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.research.utils.config import (
    oidc_configured,
    oidc_settings,
    research_file_limits,
    research_module_enabled,
)


class ResearchHealthEndpoint(APIView):
    """Availability probe used by the frontend to decide on graceful fallback.

    This endpoint intentionally ignores the research switch so the frontend can
    always answer "is the module available" without guessing from error codes.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(
            {
                "module_enabled": research_module_enabled(),
                "limits": research_file_limits(),
                "oidc_configured": oidc_configured(),
                "oidc_provider": oidc_settings()["provider"] if oidc_configured() else None,
            },
            status=status.HTTP_200_OK,
        )
