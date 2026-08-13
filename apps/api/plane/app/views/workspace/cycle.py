# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import pytz

# Django imports
from django.db.models import Q, Count, Case, CharField, Value, When
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import Cycle
from plane.app.permissions import WorkspaceViewerPermission
from plane.app.serializers.cycle import CycleSerializer


def get_visible_workspace_cycles_queryset(request, slug):
    return (
        Cycle.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
        .select_related("project")
        .select_related("workspace")
        .select_related("owned_by")
        .filter(archived_at__isnull=True)
        .annotate(
            total_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__deleted_at__isnull=True,
                    issue_cycle__issue__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            completed_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__state__group="completed",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            cancelled_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__state__group="cancelled",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            started_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__state__group="started",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            unstarted_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__state__group="unstarted",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            backlog_issues=Count(
                "issue_cycle__issue__id",
                distinct=True,
                filter=Q(
                    issue_cycle__issue__state__group="backlog",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .distinct()
    )


class WorkspaceCyclesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        cycles = get_visible_workspace_cycles_queryset(request, slug).order_by(self.kwargs.get("order_by", "-created_at"))
        serializer = CycleSerializer(cycles, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)


class WorkspaceActiveCyclesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        current_time_in_utc = timezone.now().astimezone(pytz.utc)
        cycles = (
            get_visible_workspace_cycles_queryset(request, slug)
            .filter(project__cycle_view=True, start_date__lte=current_time_in_utc, end_date__gte=current_time_in_utc)
            .annotate(
                status=Case(
                    When(
                        Q(start_date__lte=current_time_in_utc) & Q(end_date__gte=current_time_in_utc),
                        then=Value("CURRENT"),
                    ),
                    default=Value("DRAFT"),
                    output_field=CharField(),
                )
            )
            .order_by("end_date", "project__name", "name", "id")
        )
        return self.paginate(
            request=request,
            queryset=cycles,
            on_results=lambda results: CycleSerializer(results, many=True).data,
            default_per_page=20,
            max_per_page=100,
        )
