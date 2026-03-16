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

import logging

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.authentication.session import BaseSessionAuthentication
from plane.app.permissions import WorkSpaceAdminPermission

logger = logging.getLogger(__name__)


class RunnerHealthView(APIView):
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get(self, request, slug):
        runner_service_url = getattr(settings, "RUNNER_BASE_URL", None)

        if not runner_service_url:
            return Response(
                {"is_available": False},
                status=status.HTTP_200_OK,
            )

        try:
            response = requests.get(
                f"{runner_service_url}/health",
                timeout=5,
            )
            is_available = response.status_code == 200
        except requests.exceptions.RequestException:
            is_available = False

        return Response(
            {"is_available": is_available},
            status=status.HTTP_200_OK,
        )
