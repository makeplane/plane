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

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ApprovalRequest,
    OrgUnit,
    OrgUnitMember,
    PeriodicReport,
    ResearchOutcome,
    ResearchProjectProfile,
    ResearchStageInstance,
    ResearchUserProfile,
    StageReview,
    StageReviewerAssignment,
    WorkspaceResearchSetting,
)
from plane.research.utils.acl import managing_org_units_for, org_unit_scope_ids
from plane.research.utils.capabilities import NAV_DASHBOARD
from plane.research.utils.errors import ResearchErrorCode, research_error, research_not_found
from plane.research.utils.roles import is_system_admin
from plane.research.utils.org import active_membership_q, effective_mentee_ids
from plane.research.views.base import ResearchAPIView, parse_date, parse_uuid

REPORT_WINDOW_DAYS = 30


def _counts(queryset, field_name):
    return {
        str(row[field_name]): row["total"] for row in queryset.values(field_name).annotate(total=Count("id")).order_by()
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

        setting = getattr(workspace, "research_setting", None)
        if setting is not None and setting.purpose == setting.Purpose.PI_PRIVATE:
            return research_not_found(
                ResearchErrorCode.WORKSPACE_NOT_FOUND,
                "Research overview is available from the public research workspace.",
            )
        source = workspace
        scope_ids = managing_org_units_for(request.user, source.id)
        mentee_ids = set(effective_mentee_ids(request.user, source.id))
        owner_ids = {request.user.id, *mentee_ids} if not scope_ids else mentee_ids
        is_main_pi = (
            WorkspaceResearchSetting.objects.filter(
                workspace=source,
                main_pi=request.user,
                deleted_at__isnull=True,
            ).exists()
            or WorkspaceResearchSetting.objects.filter(
                purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
                main_pi=request.user,
                deleted_at__isnull=True,
            ).exists()
        )
        if is_main_pi:
            scope_ids = set(
                OrgUnit.objects.filter(
                    workspace=source,
                    deleted_at__isnull=True,
                    is_active=True,
                ).values_list("id", flat=True)
            )
        is_admin = is_system_admin(request.user)

        # Normalise and validate all aggregate filters before touching business
        # querysets. An explicitly requested node must be inside the caller's
        # already-authorised scope; returning 404 avoids exposing its existence.
        requested_org_unit, error = parse_uuid(request.GET.get("org_unit"), "org_unit")
        if error:
            return error
        requested_owner, error = parse_uuid(request.GET.get("owner"), "owner")
        if error:
            return error
        date_from, error = parse_date(request.GET.get("date_from"), "date_from")
        if error:
            return error
        date_to, error = parse_date(request.GET.get("date_to"), "date_to")
        if error:
            return error
        if date_from and date_to and date_from > date_to:
            return research_error(
                ResearchErrorCode.ORG_MEMBER_INVALID,
                "date_from must not be after date_to.",
            )

        aggregate_scope_ids = set(scope_ids)
        if requested_org_unit:
            requested_scope = org_unit_scope_ids(requested_org_unit, source.id)
            if not requested_scope or not requested_scope.issubset(scope_ids):
                return research_not_found(
                    ResearchErrorCode.ORG_UNIT_NOT_FOUND,
                    "Organisation node not found.",
                )
            aggregate_scope_ids = requested_scope

        normalized_filters = {}
        if requested_org_unit:
            normalized_filters["org_unit"] = str(requested_org_unit)
        if requested_owner:
            normalized_filters["owner"] = str(requested_owner)
        if date_from:
            normalized_filters["date_from"] = date_from.isoformat()
        if date_to:
            normalized_filters["date_to"] = date_to.isoformat()

        if requested_owner and requested_owner not in owner_ids:
            # A managed node may contain owners who do not have an explicit
            # mentor relation, so check the membership scope before refusing.
            owner_in_scope = (
                OrgUnitMember.objects.filter(
                    workspace=source,
                    user_id=requested_owner,
                    org_unit_id__in=aggregate_scope_ids,
                    deleted_at__isnull=True,
                )
                .filter(active_membership_q())
                .exists()
                or ResearchProjectProfile.objects.filter(
                    workspace=source,
                    owner_id=requested_owner,
                    org_unit_id__in=aggregate_scope_ids,
                    deleted_at__isnull=True,
                ).exists()
            )
            if not owner_in_scope:
                return research_not_found(
                    ResearchErrorCode.USER_NOT_FOUND,
                    "Research user not found.",
                )
            owner_ids = {requested_owner}
        elif requested_owner:
            owner_ids = {requested_owner}

        if not scope_ids and not owner_ids:
            return Response(
                {
                    "workspace": {"slug": workspace.slug, "name": workspace.name},
                    "source_workspace": {"slug": source.slug, "name": source.name},
                    "is_system_admin": is_admin,
                    "scope": {"unit_ids": [], "unit_count": 0, "is_empty": True},
                    "filters": normalized_filters,
                    "drilldowns": {"projects": normalized_filters, "reports": normalized_filters},
                    "projects": {"total": 0, "by_status": {}},
                    "reports": {
                        "total": 0,
                        "by_status": {},
                        "submitted_last_30_days": 0,
                        "not_submitted": 0,
                    },
                    "stages": {"total": 0, "by_status": {}, "blocked_gates": 0},
                    "reviews": {"awaiting_stages": 0, "open_assignments": 0, "submitted": 0},
                    "approvals": {"pending": 0},
                    "org_units": [],
                    "generated_at": timezone.now().isoformat(),
                },
                status=status.HTTP_200_OK,
            )

        scoped_projects = (
            ResearchProjectProfile.objects.filter(workspace=source)
            .filter(Q(org_unit_id__in=scope_ids) | Q(owner_id__in=owner_ids))
            .distinct()
        )
        if requested_org_unit:
            scoped_projects = scoped_projects.filter(org_unit_id__in=aggregate_scope_ids)
        if requested_owner:
            scoped_projects = scoped_projects.filter(owner_id=requested_owner)
        projects = scoped_projects
        if date_from:
            projects = projects.filter(started_at__gte=date_from)
        if date_to:
            projects = projects.filter(started_at__lte=date_to)
        reports = (
            PeriodicReport.objects.filter(workspace=source)
            .filter(Q(org_unit_id__in=scope_ids) | Q(owner_id__in=owner_ids))
            .exclude(status=PeriodicReport.Status.DRAFT)
            .distinct()
        )
        if requested_org_unit:
            reports = reports.filter(org_unit_id__in=aggregate_scope_ids)
        if requested_owner:
            reports = reports.filter(owner_id=requested_owner)
        if date_from:
            reports = reports.filter(period_start__gte=date_from)
        if date_to:
            reports = reports.filter(period_end__lte=date_to)
        stages = ResearchStageInstance.objects.filter(
            workspace=source,
            project_id__in=scoped_projects.values("project_id"),
        ).distinct()
        if date_from:
            stages = stages.filter(created_at__date__gte=date_from)
        if date_to:
            stages = stages.filter(created_at__date__lte=date_to)
        reviews = StageReview.objects.filter(stage_instance__in=stages)
        submitted_stages = stages.filter(status=ResearchStageInstance.Status.SUBMITTED)
        approvals = ApprovalRequest.objects.filter(org_unit_id__in=aggregate_scope_ids)
        if requested_owner:
            approvals = approvals.filter(requested_by_id=requested_owner)
        if date_from:
            approvals = approvals.filter(created_at__date__gte=date_from)
        if date_to:
            approvals = approvals.filter(created_at__date__lte=date_to)

        outcomes = ResearchOutcome.objects.filter(
            workspace=source,
            project_id__in=scoped_projects.values("project_id"),
            deleted_at__isnull=True,
        ).exclude(status=ResearchOutcome.Status.DRAFT)
        if date_from:
            outcomes = outcomes.filter(
                Q(published_at__gte=date_from) | Q(published_at__isnull=True, created_at__date__gte=date_from)
            )
        if date_to:
            outcomes = outcomes.filter(
                Q(published_at__lte=date_to) | Q(published_at__isnull=True, created_at__date__lte=date_to)
            )

        since = timezone.now() - timedelta(days=REPORT_WINDOW_DAYS)
        today = timezone.localdate()
        active_member_ids = set(
            OrgUnitMember.objects.filter(
                workspace=source,
                org_unit_id__in=aggregate_scope_ids,
                deleted_at__isnull=True,
            )
            .filter(active_membership_q(today))
            .values_list("user_id", flat=True)
            .distinct()
        )
        active_member_ids.update(scoped_projects.values_list("owner_id", flat=True).distinct())
        required_categories = set(getattr(setting, "required_reporter_categories", ["STUDENT", "POSTDOC"]))
        expected_reporter_ids = set(
            ResearchUserProfile.objects.filter(
                user_id__in=active_member_ids,
                category__in=required_categories,
            ).values_list("user_id", flat=True)
        )
        expected_reporter_ids |= set(
            ResearchProjectProfile.objects.filter(
                workspace=source,
                owner_id__in=active_member_ids,
                research_type__in=(
                    ResearchProjectProfile.ResearchType.PHD,
                    ResearchProjectProfile.ResearchType.MASTER,
                    ResearchProjectProfile.ResearchType.POSTDOC,
                ),
                workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
                is_active=True,
                deleted_at__isnull=True,
            ).values_list("owner_id", flat=True)
        )
        if requested_owner:
            expected_reporter_ids &= {requested_owner}
        reported_owner_ids = set(reports.values_list("owner_id", flat=True).distinct())
        visible_member_ids = active_member_ids & {requested_owner} if requested_owner else active_member_ids
        units = list(
            OrgUnit.objects.filter(id__in=aggregate_scope_ids, deleted_at__isnull=True)
            .order_by("depth", "sort_order", "name")
            .values("id", "name", "depth", "unit_type")
        )

        return Response(
            {
                "workspace": {"slug": workspace.slug, "name": workspace.name},
                "source_workspace": {"slug": source.slug, "name": source.name},
                "is_system_admin": is_admin,
                "scope": {
                    "unit_ids": [str(unit_id) for unit_id in aggregate_scope_ids],
                    "unit_count": len(aggregate_scope_ids),
                    "owner_ids": [str(owner_id) for owner_id in owner_ids],
                    "is_empty": False,
                },
                "projects": {
                    "total": projects.count(),
                    "by_status": _counts(projects, "workflow_status"),
                },
                "outcomes": {
                    "total": outcomes.count(),
                    "recent": [
                        {
                            "id": str(outcome.id),
                            "title": outcome.title,
                            "published_at": outcome.published_at.isoformat() if outcome.published_at else None,
                        }
                        for outcome in outcomes.order_by("-published_at", "-created_at")[:10]
                    ],
                },
                "reports": {
                    "total": reports.count(),
                    "by_status": _counts(reports, "status"),
                    "submitted_last_30_days": reports.filter(submitted_at__gte=since).count(),
                    "not_submitted": len(expected_reporter_ids - reported_owner_ids),
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
                    "total": len(visible_member_ids),
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
                "filters": normalized_filters,
                "drilldowns": {
                    "projects": normalized_filters,
                    "reports": normalized_filters,
                },
            },
            status=status.HTTP_200_OK,
        )
