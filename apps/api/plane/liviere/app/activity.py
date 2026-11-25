# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project activity heatmap and log entries for the web app (session authentication). See
# plane/liviere/activity.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import ProjectMember
from plane.liviere.activity.endpoints import ActivityHandlers
from plane.liviere.models import ProjectActivitySettings


class ProjectActivityHeatmapEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_heatmap(request, project_id)


class ProjectActivityEventsEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_events(request, project_id)


class ProjectActivitySettingsEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        return self.get_settings(request, project_id)

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        return self.patch_settings(request, project_id)


class ProjectActivityReportEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_report(request, project_id)


class ActivityEnabledProjectsEndpoint(BaseAPIView):
    """Projects of the workspace where the user may open "Activity" (sidebar item)."""

    def get(self, request, slug):
        project_ids = ProjectMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
        ).values("project_id")
        enabled = ProjectActivitySettings.objects.filter(project_id__in=project_ids, enabled=True).values_list(
            "project_id", flat=True
        )
        return Response({"project_ids": [str(project_id) for project_id in enabled]}, status=status.HTTP_200_OK)


class ProjectActivitySkipPeriodsEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_skips(request, project_id)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        return self.create_skip(request, project_id)


class ProjectActivitySkipPeriodDetailEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, skip_id):
        return self.patch_skip(request, project_id, skip_id)

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, skip_id):
        return self.delete_skip(request, project_id, skip_id)


class ProjectActivitySummariesEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_summaries(request, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.upsert_summary(request, project_id)


class ProjectActivitySummaryDetailEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, summary_id):
        return self.get_summary(request, project_id, summary_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, summary_id):
        return self.patch_summary(request, slug, project_id, summary_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, summary_id):
        return self.delete_summary(request, slug, project_id, summary_id)


class ProjectActivityLogsEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_logs(request, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_log(request, slug, project_id)


class ProjectActivityLogDetailEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, log_id):
        return self.get_log(request, project_id, log_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, log_id):
        return self.patch_log(request, slug, project_id, log_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, log_id):
        return self.delete_log(request, slug, project_id, log_id)
