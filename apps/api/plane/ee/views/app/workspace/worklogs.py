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

# Django imports
from django.views.decorators.gzip import gzip_page
from django.utils.decorators import method_decorator

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import ExporterHistory, Workspace, Project
from plane.ee.models import IssueWorkLog
from plane.ee.views.base import BaseAPIView
from plane.utils.issue_filters import issue_filters
from plane.ee.serializers import IssueWorkLogSerializer, ExporterHistorySerializer
from plane.permissions import can, WorkspaceWorklogPermissions
from plane.ee.bgtasks.worklogs_export_task import worklogs_export_task
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkspaceWorkLogsEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @can(WorkspaceWorklogPermissions.VIEW, resource_param="workspace_id")
    @method_decorator(gzip_page)
    def get(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        issue_worklogs = (
            IssueWorkLog.objects.filter(
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .order_by("created_at")
            .select_related("logged_by", "issue", "project", "workspace")
            .accessible_to(request.user.id, slug)
        )

        # after getting the dataset, filter it based on the filters
        issue_worklogs = issue_worklogs.filter(**filters)

        return self.paginate(
            order_by=request.GET.get("order_by", "-created_at"),
            request=request,
            queryset=(issue_worklogs),
            on_results=lambda issue_worklogs: IssueWorkLogSerializer(issue_worklogs, many=True).data,
        )


class WorkspaceExportWorkLogsEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @can(WorkspaceWorklogPermissions.EXPORT, resource_param="workspace_id")
    def post(self, request, slug):
        provider = request.data.get("provider", False)
        filters = request.data.get("filters", {False})
        projects = request.query_params.get("project", None)
        filterParams = issue_filters(request.query_params, "GET")
        workspace = Workspace.objects.filter(slug=slug).first()

        project_list = (
            projects.split(",")
            if projects
            else list(Project.objects.filter(workspace__slug=slug).values_list("id", flat=True).distinct())
        )

        if provider in ["csv", "xlsx"]:
            exporter = ExporterHistory.objects.create(
                workspace_id=workspace.id,
                initiated_by=request.user,
                provider=provider,
                filters=filters,
                type="issue_worklogs",
                project=project_list,
            )
            worklogs_export_task.delay(
                provider=exporter.provider,
                workspace_id=workspace.id,
                user_id=request.user.id,
                token_id=exporter.token,
                slug=slug,
                filters=filterParams,
            )
            serializer = ExporterHistorySerializer(exporter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": f"Provider '{provider}' not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @can(WorkspaceWorklogPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        exporter_history = ExporterHistory.objects.filter(workspace__slug=slug, type="issue_worklogs").select_related(
            "workspace", "initiated_by"
        )

        return self.paginate(
            order_by=request.GET.get("order_by", "-created_at"),
            request=request,
            queryset=exporter_history,
            on_results=lambda exporter_history: ExporterHistorySerializer(exporter_history, many=True).data,
        )
