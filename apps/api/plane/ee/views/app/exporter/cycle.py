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

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.permissions import can, CyclePermissions
from plane.db.models import ExporterHistory, Workspace
from plane.bgtasks.export_task import issue_export_task
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ProjectCycleExportEndpoint(BaseAPIView):
    """
    Export cycle from a project cycle endpoint.
    with filters and rich filters
    """

    @check_feature_flag(FeatureFlag.ADVANCED_EXPORTS)
    @can(CyclePermissions.EXPORT, resource_param="project_id")
    def post(self, request, slug, project_id, cycle_id):
        # Get the provider
        provider = request.data.get("provider", False)

        if provider not in ["csv", "xlsx", "json"]:
            return Response(
                {"error": f"Provider '{provider}' not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the filters
        filters = request.data.get("filters", {})
        rich_filters = request.data.get("rich_filters", None)

        # Add the cycle filter to cycle id
        filters["cycle"] = str(cycle_id)

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # Create the exporter
        exporter = ExporterHistory.objects.create(
            workspace=workspace,
            project=[project_id],
            initiated_by=request.user,
            provider=provider,
            type="cycle_exports",
            filters=filters,
            rich_filters=rich_filters,
        )

        # Trigger the export task for cycle issues
        issue_export_task.delay(
            provider=exporter.provider,
            workspace_id=workspace.id,
            project_ids=[str(project_id)],
            token_id=exporter.token,
            multiple=False,
            slug=slug,
            export_type="issue",
        )

        # Return the response
        return Response(
            {"message": "Once the export is ready you will be able to download it"},
            status=status.HTTP_200_OK,
        )
