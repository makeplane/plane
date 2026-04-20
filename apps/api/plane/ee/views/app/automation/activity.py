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

# Django imports
from django.db.models import Prefetch


# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.app.automation.base import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationActivityReadSerializer,
)
from plane.ee.models import AutomationActivity, AutomationRun
from plane.permissions import can, ProjectAutomationPermissions, WorkspaceAutomationPermissions
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class AutomationActivityEndpoint(AutomationBaseEndpoint):

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
        filters = {}
        excludes = {"field": "automation.edge"}

        show_fails = request.GET.get("show_fails", "true")

        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        if request.GET.get("type", None) is not None:
            if request.GET.get("type") == "run_history":
                filters["field"] = "automation.run_history"
            elif request.GET.get("type") == "activity":
                excludes["field"] = "automation.run_history"

        if str(show_fails).lower() == "false":
            excludes["automation_run__status"] = "failed"

        if pk:
            queryset = (
                AutomationActivity.objects.select_related("automation")
                .prefetch_related(
                    Prefetch(
                        "automation_run",
                        queryset=AutomationRun.objects.select_related("work_item"),
                    )
                )
                .filter(**filters)
                .exclude(**excludes)
            )
            activity = queryset.get(
                id=pk,
                workspace__slug=slug,
                automation_id=automation_id,
            )

            serializer = AutomationActivityReadSerializer(activity)
            return Response(serializer.data, status=status.HTTP_200_OK)

        queryset = (
            AutomationActivity.objects.select_related("automation")
            .prefetch_related(
                Prefetch(
                    "automation_run",
                    queryset=AutomationRun.objects.select_related("work_item"),
                )
            )
            .filter(
                workspace__slug=slug,
                automation_id=automation_id,
            )
            .filter(**filters)
            .exclude(**excludes)
        )

        activities = queryset.order_by("created_at")
        serializer = AutomationActivityReadSerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceAutomationActivityEndpoint(AutomationBaseEndpoint):

    @can(WorkspaceAutomationPermissions.VIEW, resource_param="automation_id")
    @check_feature_flag(FeatureFlag.WORKSPACE_AUTOMATIONS)
    def get(
        self,
        request: Request,
        slug: str,
        automation_id: uuid.UUID,
        pk=None,
    ):
        filters = {}
        excludes = {"field": "automation.edge"}

        show_fails = request.GET.get("show_fails", "true")

        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        if request.GET.get("type", None) is not None:
            if request.GET.get("type") == "run_history":
                filters["field"] = "automation.run_history"
            elif request.GET.get("type") == "activity":
                excludes["field"] = "automation.run_history"

        if str(show_fails).lower() == "false":
            excludes["automation_run__status"] = "failed"

        if pk:
            queryset = (
                AutomationActivity.objects.select_related("automation")
                .prefetch_related(
                    Prefetch(
                        "automation_run",
                        queryset=AutomationRun.objects.select_related("work_item"),
                    )
                )
                .filter(**filters)
                .exclude(**excludes)
            )
            activity = queryset.get(
                id=pk,
                workspace__slug=slug,
                automation_id=automation_id,
            )

            serializer = AutomationActivityReadSerializer(activity)
            return Response(serializer.data, status=status.HTTP_200_OK)

        queryset = (
            AutomationActivity.objects.select_related("automation")
            .prefetch_related(
                Prefetch(
                    "automation_run",
                    queryset=AutomationRun.objects.select_related("work_item"),
                )
            )
            .filter(
                workspace__slug=slug,
                automation_id=automation_id,
            )
            .filter(**filters)
            .exclude(**excludes)
        )

        activities = queryset.order_by("created_at")
        serializer = AutomationActivityReadSerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
