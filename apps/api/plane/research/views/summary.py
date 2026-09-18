# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    OrgUnit,
    OrgUnitMember,
    PeriodicReport,
    ResearchProjectProfile,
    ResearchUserProfile,
    User,
)
from plane.research.utils.acl import (
    active_org_units_for,
    build_actor_context,
    check_access,
    org_unit_scope_ids,
)
from plane.research.utils.capabilities import NAV_SUMMARY
from plane.research.utils.org import managing_unit_ids
from plane.research.utils.errors import ResearchErrorCode, research_error
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.periods import InvalidPeriod, parse_period
from plane.research.utils.reports import report_resource
from plane.research.views.base import ResearchAPIView
from plane.research.views.reports import report_timezone_for

STATUS_BUCKETS = {
    "DRAFT": "draft",
    "SUBMITTED": "submitted",
    "NEEDS_REVISION": "needs_revision",
    "ACCEPTED": "accepted",
}


def empty_counts():
    return {
        "not_submitted": 0,
        "draft": 0,
        "submitted": 0,
        "needs_revision": 0,
        "accepted": 0,
    }


class ResearchReportSummaryEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/reports/summary/``

    Counts per organisation node for one period, plus the list of research
    owners who have not submitted yet. The aggregation uses exactly the same
    ACL as the report list, so the dashboard and the detail view can never
    disagree (P0-UI-05, P0-ACL-07).
    """

    nav_capability = NAV_SUMMARY

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        report_type = str(request.GET.get("report_type") or "WEEKLY").upper()
        if report_type not in PeriodicReport.ReportType.values:
            return research_error(ResearchErrorCode.REPORT_PERIOD_CONFLICT, "Unknown report type.")

        report_timezone = report_timezone_for(workspace)
        try:
            period_key, period_start, period_end = parse_period(
                report_type, request.GET.get("period_key"), report_timezone
            )
        except InvalidPeriod as error:
            return research_error(ResearchErrorCode.REPORT_PERIOD_CONFLICT, str(error))

        context = build_actor_context(request.user, workspace.id)
        is_admin = is_workspace_admin(request.user, workspace.id)

        if is_admin:
            scope_ids = set(
                OrgUnit.objects.filter(workspace=workspace, deleted_at__isnull=True).values_list("id", flat=True)
            )
        else:
            scope_ids = set(managing_unit_ids(request.user, workspace.id)) | active_org_units_for(
                request.user, workspace.id
            )
        if not scope_ids:
            return Response(
                {
                    "period_key": period_key,
                    "period_start": period_start,
                    "period_end": period_end,
                    "report_type": report_type,
                    "org_unit": None,
                    "org_unit_name": None,
                    "counts": empty_counts(),
                    "pending_members": [],
                    "by_unit": [],
                },
                status=status.HTTP_200_OK,
            )

        requested_unit = request.GET.get("org_unit")
        if requested_unit:
            if requested_unit not in {str(unit_id) for unit_id in scope_ids}:
                return research_error(
                    ResearchErrorCode.PERMISSION_DENIED,
                    "You cannot aggregate this organisation node.",
                    status.HTTP_403_FORBIDDEN,
                )
            head_units = [OrgUnit.objects.get(pk=requested_unit)]
        else:
            # only the top-most nodes of the scope: descendants are covered by
            # their ancestor's subtree scope and must not be counted twice
            candidates = list(
                OrgUnit.objects.filter(workspace=workspace, pk__in=scope_ids, deleted_at__isnull=True)
                .values("id", "parent_id", "name", "unit_type", "depth")
            )
            head_ids = [
                entry["id"]
                for entry in candidates
                if not entry["parent_id"] or entry["parent_id"] not in scope_ids
            ]
            head_units = list(
                OrgUnit.objects.filter(pk__in=head_ids).order_by("depth", "name")
            )

        reports = list(
            PeriodicReport.objects.filter(
                workspace=workspace,
                report_type=report_type,
                period_key=period_key,
            ).select_related("owner", "org_unit")
        )
        visible_reports = [
            report
            for report in reports
            if check_access(request.user, "view", report_resource(report), context=context)
        ]

        today = timezone.localdate()
        required_categories = set(
            getattr(workspace.research_setting, "required_reporter_categories", ["STUDENT", "POSTDOC"])
        )
        by_unit = []
        for unit in head_units:
            unit_scope = org_unit_scope_ids(unit.id, workspace.id)
            memberships = OrgUnitMember.objects.filter(
                workspace=workspace,
                org_unit_id__in=unit_scope,
                deleted_at__isnull=True,
                effective_from__lte=today,
            ).filter(Q(effective_to__isnull=True) | Q(effective_to__gte=today))
            member_ids = set(memberships.values_list("user_id", flat=True).distinct())
            owner_ids = set(
                ResearchUserProfile.objects.filter(
                    user_id__in=member_ids,
                    category__in=required_categories,
                ).values_list("user_id", flat=True)
            )
            # Compatibility for existing accounts whose profile has not yet
            # been completed: an active cultivation project still marks them
            # as expected reporters.
            owner_ids |= set(
                ResearchProjectProfile.objects.filter(
                    workspace=workspace,
                    owner_id__in=member_ids,
                    research_type__in=("PHD", "MASTER", "POSTDOC"),
                    is_active=True,
                    workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
                ).values_list("owner_id", flat=True)
            )

            counts = empty_counts()
            reported_owner_ids = set()
            for report in visible_reports:
                if report.org_unit_id in unit_scope and report.owner_id in owner_ids:
                    counts[STATUS_BUCKETS.get(report.status, "draft")] += 1
                    reported_owner_ids.add(report.owner_id)

            counts["not_submitted"] = len(owner_ids - reported_owner_ids)
            pending = list(
                User.objects.filter(id__in=owner_ids - reported_owner_ids, is_active=True).order_by("first_name")
            )
            by_unit.append(
                {
                    "org_unit": str(unit.id),
                    "org_unit_name": unit.name,
                    "org_unit_type": unit.unit_type,
                    "counts": counts,
                    "pending_members": [
                        {
                            "id": str(user.id),
                            "email": user.email,
                            "display_name": user.display_name,
                        }
                        for user in pending
                    ],
                }
            )

        head = by_unit[0] if len(by_unit) == 1 else None
        totals = empty_counts()
        for entry in by_unit:
            for bucket, value in entry["counts"].items():
                totals[bucket] += value

        return Response(
            {
                "period_key": period_key,
                "period_start": period_start,
                "period_end": period_end,
                "report_type": report_type,
                "org_unit": head["org_unit"] if head else None,
                "org_unit_name": head["org_unit_name"] if head else None,
                "counts": head["counts"] if head else totals,
                "pending_members": head["pending_members"] if head else [],
                "by_unit": by_unit,
            },
            status=status.HTTP_200_OK,
        )
