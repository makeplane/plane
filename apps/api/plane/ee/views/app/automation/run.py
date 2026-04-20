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
import uuid

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.app.automation.base import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationRunReadSerializer,
)
from plane.ee.models import AutomationRun
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, ProjectAutomationPermissions, WorkspaceAutomationPermissions


# TODO: Unused endpoint — not exported or wired to URL config. Migrate to @can before re-enabling.
class AutomationRunEndpoint(AutomationBaseEndpoint):

    use_read_replica = True

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @can(ProjectAutomationPermissions.VIEW, resource_param="automation_id")
    def get(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
        pk=None,
    ):
        if pk:
            run = AutomationRun.objects.get(
                id=pk,
                project_id=project_id,
                workspace__slug=slug,
                automation_id=automation_id,
            )
            serializer = AutomationRunReadSerializer(run)
            return Response(serializer.data, status=status.HTTP_200_OK)

        runs = AutomationRun.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            automation_id=automation_id,
        )
        serializer = AutomationRunReadSerializer(runs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class WorkspaceAutomationRunEndpoint(AutomationBaseEndpoint):
    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    @can(WorkspaceAutomationPermissions.VIEW, resource_param="automation_id")
    def get(
        self,
        request: Request,
        slug: str,
        automation_id: uuid.UUID,
        pk=None,
    ):
        if pk:
            run = AutomationRun.objects.get(
                id=pk,
                workspace__slug=slug,
                automation_id=automation_id,
            )
            serializer = AutomationRunReadSerializer(run)
            return Response(serializer.data, status=status.HTTP_200_OK)

        runs = AutomationRun.objects.filter(
            workspace__slug=slug,
            automation_id=automation_id,
        )
        serializer = AutomationRunReadSerializer(runs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
