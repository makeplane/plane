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
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.app.permissions import WorkSpaceAdminPermission
from plane.authentication.session import BaseSessionAuthentication
from plane.db.models import Workspace
from plane.utils.exception_logger import log_exception

from ...models import ScriptExecution
from ...serializers import ScriptExecutionSerializer
from ...services import execute_sync
from ...services.script_builder import validate_function_names

logger = logging.getLogger(__name__)


class ScriptTestView(APIView):
    """
    Test script code without saving.
    Builds first to detect functions and validate, then executes synchronously.
    """

    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def post(self, request, slug):
        try:
            workspace = get_object_or_404(Workspace, slug=slug)

            # Validate required field
            code = request.data.get("code")
            if not code:
                return Response({"error": "code is required"}, status=status.HTTP_400_BAD_REQUEST)

            code_type = request.data.get("code_type")

            # Step 1: Build to detect functions and catch syntax errors
            runner_service_url = getattr(settings, "RUNNER_BASE_URL", None)
            if not runner_service_url:
                return Response(
                    {"error": "Runner service is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            try:
                build_response = requests.post(
                    f"{runner_service_url}/build",
                    json={"code": code, "code_type": code_type},
                    headers={"Content-Type": "application/json"},
                    timeout=60,
                )
            except requests.exceptions.RequestException as e:
                logger.error(f"Build request failed: {e}")
                return Response(
                    {"error": f"Build service unavailable: {e}"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            if build_response.status_code != 200:
                return Response(
                    {"error": f"Build failed: {build_response.text}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            build_result = build_response.json()
            if not build_result.get("success"):
                return Response(
                    {"error": build_result.get("error", "Build failed")},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            build = build_result.get("build")
            function_names = build_result.get("function_names", [])

            # Step 2: Validate functions exist
            if function_names:
                is_valid, missing = validate_function_names(str(workspace.id), function_names)
                if not is_valid:
                    return Response(
                        {"error": f"Unknown functions: {', '.join(missing)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Step 3: Execute with only required functions
            result = execute_sync(
                code=code,
                build=build,
                function_names=function_names,
                workspace_id=workspace.id,
                workspace_slug=slug,
                input_data=request.data.get("input_data", {}),
                execution_variables=request.data.get("execution_variables", {}),
                code_type=code_type,
                env_variables=request.data.get("env_variables", {}),
                allowed_domains=request.data.get("allowed_domains", []),
                trigger_type="test",
            )

            # Fetch the execution record to serialize
            execution = ScriptExecution.objects.get(id=result.execution_id)
            serializer = ScriptExecutionSerializer(execution)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            log_exception(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
