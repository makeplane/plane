# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Main PI workspace: one read-only aggregate over the public workspace.

The public workspace stays the single authority for business data. The main
PI workspace renders this aggregate (own node plus its subtree) and links
back to the public workspace pages, so nothing is duplicated and no second
copy can drift (SYS-PI-01 ~ SYS-PI-05).
"""

from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ApprovalRequest,
    OrgUnit,
    OrgUnitMember,
    PeriodicReport,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageReview,
    StageReviewerAssignment,
)
from plane.research.services.accounts import public_workspace
from plane.research.utils.acl import managing_org_units_for
from plane.research.utils.capabilities import NAV_DASHBOARD
from plane.research.utils.roles import is_system_admin
from plane.research.views.base import ResearchAPIView

REPORT_WINDOW_DAYS = 30


def _counts(queryset, field_name):
    return {
        str(row[field_name]): row["total"]
        for row in queryset.values(field_name).annotate(total=Count("id")).order_by()
    }


class ResearchPiAggregateEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/aggregate/``

    The board aggregates a subtree, so it lives behind the main PI level
    (v2.5.0): a caller without a managing organisation role has no subtree to
    aggregate and is refused instead of being shown an empty board.
    """

    nav_capability = NAV_DASHBOARD

    def get(self, request, slug):
        workspace, error = self.get_workspace(require_enabled=False)
        if error:
            return error

        source = public_workspace() or workspace
        scope_ids = managing_org_units_for(request.user, source.id)
        is_admin = is_system_admin(request.user)

        if not scope_ids:
            return Response(
                {
                    "workspace": {"slug": workspace.slug, "name": workspace.name},
                    "source_workspace": {"slug": source.slug, "name": source.name},
                    "is_system_admin": is_admin,
                    "scope": {"unit_ids": [], "unit_count": 0, "is_empty": True},
                    "projects": {"total": 0, "by_status": {}},
                    "reports": {"total": 0, "by_status": {}, "submitted_last_30_days": 0},
                    "stages": {"total": 0, "by_status": {}, "blocked_gates": 0},
                    "reviews": {"awaiting_stages": 0, "open_assignments": 0, "submitted": 0},
                    "approvals": {"pending": 0},
                    "org_units": [],
                    "generated_at": timezone.now().isoformat(),
                },
                status=status.HTTP_200_OK,
            )

        projects = ResearchProjectProfile.objects.filter(workspace=source, org_unit_id__in=scope_ids)
        reports = PeriodicReport.objects.filter(workspace=source, org_unit_id__in=scope_ids)
        stages = ResearchStageInstance.objects.filter(workspace=source, org_unit_id__in=scope_ids)
        reviews = StageReview.objects.filter(stage_instance__in=stages)
        submitted_stages = stages.filter(status=ResearchStageInstance.Status.SUBMITTED)
        approvals = ApprovalRequest.objects.filter(org_unit_id__in=scope_ids)

        since = timezone.now() - timedelta(days=REPORT_WINDOW_DAYS)
        units = list(
            OrgUnit.objects.filter(id__in=scope_ids, deleted_at__isnull=True)
            .order_by("depth", "sort_order", "name")
            .values("id", "name", "depth", "unit_type")
        )

        return Response(
            {
                "workspace": {"slug": workspace.slug, "name": workspace.name},
                "source_workspace": {"slug": source.slug, "name": source.name},
                "is_system_admin": is_admin,
                "scope": {
                    "unit_ids": [str(unit_id) for unit_id in scope_ids],
                    "unit_count": len(scope_ids),
                    "is_empty": False,
                },
                "projects": {
                    "total": projects.count(),
                    "by_status": _counts(projects, "workflow_status"),
                },
                "reports": {
                    "total": reports.count(),
                    "by_status": _counts(reports, "status"),
                    "submitted_last_30_days": reports.filter(submitted_at__gte=since).count(),
                },
                "stages": {
                    "total": stages.count(),
                    "by_status": _counts(stages, "status"),
                    "blocked_gates": stages.filter(gate_result=ResearchStageInstance.GateResult.BLOCKED).count(),
                },
                "reviews": {
                    "awaiting_stages": submitted_stages.count(),
                    "open_assignments": StageReviewerAssignment.objects.filter(
                        stage_instance__in=submitted_stages
                    ).count(),
                    "submitted": reviews.count(),
                },
                "approvals": {
                    "pending": approvals.filter(status=ApprovalRequest.Status.PENDING).count(),
                },
                "members": {
                    "total": OrgUnitMember.objects.filter(
                        workspace=source, org_unit_id__in=scope_ids, deleted_at__isnull=True
                    )
                    .values("user_id")
                    .distinct()
                    .count(),
                },
                "org_units": [
                    {
                        "id": str(unit["id"]),
                        "name": unit["name"],
                        "depth": unit["depth"],
                        "unit_type": unit["unit_type"],
                    }
                    for unit in units
                ],
                "generated_at": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
