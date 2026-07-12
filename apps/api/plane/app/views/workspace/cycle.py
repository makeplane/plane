# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import pytz

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Q, Count, Value, UUIDField
from django.db.models.functions import Coalesce
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import Cycle, Project
from plane.app.permissions import WorkspaceViewerPermission, WorkspaceEntityPermission
from plane.app.serializers.cycle import CycleSerializer


class WorkspaceCyclesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        cycles = (
            Cycle.objects.filter(workspace__slug=slug)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .filter(archived_at__isnull=True)
            .annotate(
                total_issues=Count(
                    "issue_cycle",
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
                    "issue_cycle__issue__state__group",
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
                    "issue_cycle__issue__state__group",
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
                    "issue_cycle__issue__state__group",
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
                    "issue_cycle__issue__state__group",
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
                    "issue_cycle__issue__state__group",
                    filter=Q(
                        issue_cycle__issue__state__group="backlog",
                        issue_cycle__issue__archived_at__isnull=True,
                        issue_cycle__issue__is_draft=False,
                        issue_cycle__issue__deleted_at__isnull=True,
                        issue_cycle__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )
        serializer = CycleSerializer(cycles, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)


class WorkspaceActiveCyclesEndpoint(BaseAPIView):
    """List the currently active cycles across every project of the workspace
    the requesting user is an active member of.

    A cycle is "active" when it is not archived and the current instant falls
    within its ``[start_date, end_date]`` window. ``start_date`` / ``end_date``
    are stored in UTC, so ``timezone.now()`` (an aware UTC datetime) is the
    correct comparison boundary. The result is cursor-paginated via
    ``self.paginate`` to match the ``IWorkspaceActiveCyclesResponse`` contract
    consumed by the web client.
    """

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        # start_date / end_date are stored in UTC -> compare against aware UTC now
        now = timezone.now()

        cycles = (
            Cycle.objects.filter(workspace__slug=slug)
            # scope strictly to projects where the user is an active member
            .filter(
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(archived_at__isnull=True)
            .filter(project__archived_at__isnull=True)
            # active window: start_date <= now <= end_date
            .filter(start_date__lte=now, end_date__gte=now)
            .select_related("project", "workspace", "owned_by")
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
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
                        issue_cycle__deleted_at__isnull=True,
                        issue_cycle__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue_cycle__issue__assignees__id",
                        distinct=True,
                        filter=~Q(issue_cycle__issue__assignees__id__isnull=True)
                        & Q(issue_cycle__issue__issue_assignee__deleted_at__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
            .order_by("-created_at")
            .distinct()
        )

        return self.paginate(
            request=request,
            queryset=cycles,
            on_results=lambda cycles: self._process_active_cycles(cycles),
        )

    def _process_active_cycles(self, cycles):
        """Serialize the paginated page of cycles into plain dicts, converting
        each cycle's dates into its own project timezone (cycles may span
        several projects with different timezones)."""
        cycles = list(cycles)

        # Build a project_id -> timezone map for the projects on this page
        project_timezones = dict(
            Project.objects.filter(id__in=[cycle.project_id for cycle in cycles]).values_list("id", "timezone")
        )

        data = []
        for cycle in cycles:
            local_tz = pytz.timezone(project_timezones.get(cycle.project_id) or "UTC")
            data.append(
                {
                    # identifiers
                    "id": cycle.id,
                    "workspace_id": cycle.workspace_id,
                    "project_id": cycle.project_id,
                    # model fields
                    "name": cycle.name,
                    "description": cycle.description,
                    "start_date": (cycle.start_date.astimezone(local_tz) if cycle.start_date else None),
                    "end_date": (cycle.end_date.astimezone(local_tz) if cycle.end_date else None),
                    "owned_by_id": cycle.owned_by_id,
                    "view_props": cycle.view_props,
                    "sort_order": cycle.sort_order,
                    "external_source": cycle.external_source,
                    "external_id": cycle.external_id,
                    "progress_snapshot": cycle.progress_snapshot,
                    "logo_props": cycle.logo_props,
                    "version": cycle.version,
                    "archived_at": cycle.archived_at,
                    "created_at": cycle.created_at,
                    "created_by": cycle.created_by_id,
                    # meta fields (annotations)
                    "total_issues": cycle.total_issues,
                    "completed_issues": cycle.completed_issues,
                    "cancelled_issues": cycle.cancelled_issues,
                    "started_issues": cycle.started_issues,
                    "unstarted_issues": cycle.unstarted_issues,
                    "backlog_issues": cycle.backlog_issues,
                    "assignee_ids": cycle.assignee_ids,
                    "status": "CURRENT",
                }
            )
        return data
