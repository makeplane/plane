# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    Page,
    PeriodicReport,
    ProjectPage,
    ReportAccessGrant,
    ReportReviewLog,
    ReportTemplate,
    ResearchProjectProfile,
)
from plane.research.serializers import (
    PeriodicReportSerializer,
    ReportAccessGrantSerializer,
    ReportReviewLogSerializer,
)
from plane.research.utils.acl import (
    build_actor_context,
    can_narrow,
    check_access,
    visibility_breadth,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.notifications import (
    notify_report_accepted,
    notify_report_returned,
    notify_report_submitted,
)
from plane.research.utils.periods import InvalidPeriod, current_period, parse_period
from plane.research.utils.reports import can_transition, is_editable, report_resource
from plane.research.utils.settings import default_visibility_for, get_workspace_research_settings
from plane.research.views.base import ResearchAPIView, resolve_user, truthy


def report_queryset(workspace):
    return (
        PeriodicReport.objects.filter(workspace=workspace)
        .select_related("owner", "org_unit", "page", "project")
        .order_by("-period_start", "-created_at")
    )


def serialize_report(report, request, context=None):
    context = context if context is not None else build_actor_context(request.user, report.workspace_id)
    return PeriodicReportSerializer(
        report, context={"request": request, "actor_context": context}
    ).data


def report_timezone_for(workspace):
    settings_map = get_workspace_research_settings(workspace)
    return settings_map.get("timezone") or getattr(workspace, "timezone", None) or "UTC"


class ResearchReportListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/reports/``"""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        queryset = report_queryset(workspace)
        if request.GET.get("period_key"):
            queryset = queryset.filter(period_key=request.GET["period_key"])
        if request.GET.get("status"):
            queryset = queryset.filter(status=str(request.GET["status"]).upper())
        if request.GET.get("report_type"):
            queryset = queryset.filter(report_type=str(request.GET["report_type"]).upper())
        if request.GET.get("org_unit"):
            queryset = queryset.filter(org_unit_id=request.GET["org_unit"])
        if request.GET.get("owner"):
            queryset = queryset.filter(owner_id=request.GET["owner"])
        if truthy(request.GET.get("mine")):
            queryset = queryset.filter(owner=request.user)

        context = build_actor_context(request.user, workspace.id)
        visible = [
            report
            for report in list(queryset)
            if check_access(request.user, "view", report_resource(report), context=context)
        ]
        return Response(
            {
                "results": [serialize_report(report, request, context) for report in visible],
                "count": len(visible),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error

        report_type = str(request.data.get("report_type") or "WEEKLY").strip().upper()
        if report_type not in PeriodicReport.ReportType.values:
            return research_error(ResearchErrorCode.REPORT_PERIOD_CONFLICT, "Unknown report type.")

        report_timezone = report_timezone_for(workspace)
        try:
            period_key, period_start, period_end = parse_period(
                report_type, request.data.get("period_key"), report_timezone
            )
        except InvalidPeriod as error:
            return research_error(ResearchErrorCode.REPORT_PERIOD_CONFLICT, str(error))

        profile = (
            ResearchProjectProfile.objects.filter(
                workspace=workspace,
                owner=request.user,
                is_active=True,
                workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
            )
            .select_related("project", "org_unit")
            .first()
        )
        if profile is None:
            return research_error(
                ResearchErrorCode.PROJECT_NOT_FOUND,
                "An active research project is required before creating reports.",
            )

        current_key, _, _ = current_period(report_type, timezone_name=report_timezone)
        default_visibility = default_visibility_for(report_type, workspace)
        requested_visibility = str(request.data.get("visibility") or default_visibility).strip().upper()
        if not can_narrow(default_visibility, requested_visibility):
            return research_error(
                ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                "The visibility cannot be wider than the workspace default.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        template = None
        if request.data.get("template"):
            template = ReportTemplate.objects.filter(
                workspace=workspace, pk=request.data["template"], is_active=True
            ).first()
            if template is None:
                return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")

        if PeriodicReport.objects.filter(
            workspace=workspace,
            owner=request.user,
            report_type=report_type,
            period_key=period_key,
        ).exists():
            return research_conflict(
                ResearchErrorCode.REPORT_PERIOD_CONFLICT,
                "A report already exists for this period.",
            )

        try:
            with transaction.atomic():
                page = Page.objects.create(
                    workspace=workspace,
                    name=f"{period_key} {report_type}",
                    description_json=(template.content_json if template else {"type": "doc", "content": []}),
                    description_html="<p></p>",
                    owned_by=request.user,
                    access=Page.PRIVATE_ACCESS,
                    created_by=request.user,
                )
                ProjectPage.objects.create(
                    project=profile.project,
                    page=page,
                    workspace=workspace,
                    created_by=request.user,
                )
                report = PeriodicReport.objects.create(
                    workspace=workspace,
                    project=profile.project,
                    owner=request.user,
                    org_unit=profile.org_unit,
                    page=page,
                    report_type=report_type,
                    period_key=period_key,
                    period_start=period_start,
                    period_end=period_end,
                    timezone=report_timezone,
                    visibility=requested_visibility,
                    is_backfill=period_key != current_key,
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.REPORT_PERIOD_CONFLICT,
                "A report already exists for this period.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_CREATE,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={
                "report_type": report_type,
                "period_key": period_key,
                "is_backfill": report.is_backfill,
            },
            request=request,
        )
        return Response(serialize_report(report, request), status=status.HTTP_201_CREATED)


class ResearchReportDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/reports/<report_id>/``"""

    def _visible_report(self, request, workspace, report_id, action="view"):
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, action, report_resource(report), context=context):
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        return report, None

    def get(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._visible_report(request, workspace, report_id)
        if error:
            return error
        return Response(serialize_report(report, request), status=status.HTTP_200_OK)

    def patch(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._visible_report(request, workspace, report_id, action="edit")
        if error:
            return error
        if not is_editable(report):
            return research_conflict(
                ResearchErrorCode.REPORT_READ_ONLY,
                "A submitted report is read only. Return it before editing.",
            )

        # the body lives in the linked Page; this endpoint applies a template
        if request.data.get("template"):
            template = ReportTemplate.objects.filter(
                workspace=workspace, pk=request.data["template"], is_active=True
            ).first()
            if template is None:
                return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")
            report.page.description_json = template.content_json
            report.page.save(update_fields=["description_json", "updated_at"])

        if "is_backfill" in request.data:
            report.is_backfill = truthy(request.data.get("is_backfill"))
            report.save(update_fields=["is_backfill", "updated_at"])

        return Response(serialize_report(report, request), status=status.HTTP_200_OK)


class ResearchReportSubmitEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reports/<report_id>/submit/``"""

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None or report.owner_id != request.user.id:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        target = "SUBMITTED"
        if not can_transition(report.status, target):
            return research_conflict(
                ResearchErrorCode.REPORT_STATE_CONFLICT,
                "The report status does not allow this action.",
            )

        previous = report.status
        with transaction.atomic():
            report.status = target
            report.submitted_at = timezone.now()
            report.save(update_fields=["status", "submitted_at", "updated_at"])
            ReportReviewLog.objects.create(
                report=report,
                actor=request.user,
                action=ReportReviewLog.Action.SUBMIT,
                from_status=previous,
                to_status=target,
                comment=str(request.data.get("comment") or ""),
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_SUBMIT,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={"period_key": report.period_key, "report_type": report.report_type},
            request=request,
        )
        notify_report_submitted(report, request.user)
        return Response(serialize_report(report, request), status=status.HTTP_200_OK)


class ResearchReportReturnEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reports/<report_id>/return/``"""

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        comment = str(request.data.get("comment") or "").strip()
        if not comment:
            return research_error(
                ResearchErrorCode.REPORT_RETURN_REASON_REQUIRED,
                "A reason is required when returning a report.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "return", report_resource(report), context=context):
            return research_permission_denied()

        target = "NEEDS_REVISION"
        if not can_transition(report.status, target):
            return research_conflict(
                ResearchErrorCode.REPORT_STATE_CONFLICT,
                "The report status does not allow this action.",
            )

        previous = report.status
        with transaction.atomic():
            report.status = target
            report.reviewer = request.user
            report.save(update_fields=["status", "reviewer", "updated_at"])
            ReportReviewLog.objects.create(
                report=report,
                actor=request.user,
                action=ReportReviewLog.Action.RETURN,
                from_status=previous,
                to_status=target,
                comment=comment,
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_RETURN,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={"period_key": report.period_key, "reason_provided": True},
            request=request,
        )
        notify_report_returned(report, request.user, comment)
        return Response(serialize_report(report, request), status=status.HTTP_200_OK)


class ResearchReportAcceptEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reports/<report_id>/accept/``"""

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "accept", report_resource(report), context=context):
            return research_permission_denied()

        target = "ACCEPTED"
        if not can_transition(report.status, target):
            return research_conflict(
                ResearchErrorCode.REPORT_STATE_CONFLICT,
                "The report status does not allow this action.",
            )

        previous = report.status
        with transaction.atomic():
            report.status = target
            report.accepted_at = timezone.now()
            report.reviewer = request.user
            report.save(update_fields=["status", "accepted_at", "reviewer", "updated_at"])
            ReportReviewLog.objects.create(
                report=report,
                actor=request.user,
                action=ReportReviewLog.Action.ACCEPT,
                from_status=previous,
                to_status=target,
                comment=str(request.data.get("comment") or ""),
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_ACCEPT,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={"period_key": report.period_key, "report_type": report.report_type},
            request=request,
        )
        notify_report_accepted(report, request.user)
        return Response(serialize_report(report, request), status=status.HTTP_200_OK)


class ResearchReportHistoryEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/reports/<report_id>/history/``"""

    def get(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "view", report_resource(report), context=context):
            return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")

        logs = list(ReportReviewLog.objects.filter(report=report).select_related("actor"))
        return Response(
            {"results": ReportReviewLogSerializer(logs, many=True).data, "count": len(logs)},
            status=status.HTTP_200_OK,
        )


class ResearchReportAccessEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/reports/<report_id>/access/``

    Authors may only narrow the workspace default and may only grant within that
    boundary (P0-ACL-04, P0-ACL-05).
    """

    def _load(self, request, workspace, report_id):
        report = report_queryset(workspace).filter(pk=report_id).first()
        if report is None:
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "manage_access", report_resource(report), context=context):
            return None, research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
        return report, None

    def _payload(self, workspace, report):
        default_visibility = default_visibility_for(report.report_type, workspace)
        grants = list(ReportAccessGrant.objects.filter(report=report, is_revoked=False))
        return {
            "visibility": report.visibility,
            "default_visibility": default_visibility,
            "can_widen": False,
            "grants": ReportAccessGrantSerializer(grants, many=True).data,
        }

    def get(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._load(request, workspace, report_id)
        if error:
            return error
        return Response(self._payload(workspace, report), status=status.HTTP_200_OK)

    def patch(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        report, error = self._load(request, workspace, report_id)
        if error:
            return error

        default_visibility = default_visibility_for(report.report_type, workspace)
        previous = {"visibility": report.visibility}

        if "visibility" in request.data:
            requested = str(request.data.get("visibility") or "").strip().upper()
            if not requested or not can_narrow(default_visibility, requested):
                return research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "The visibility cannot be wider than the workspace default.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            report.visibility = requested
            report.save(update_fields=["visibility", "updated_at"])

        if "grants" in request.data:
            if visibility_breadth(report.visibility) == 0:
                return research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "Custom grants are not available for private reports.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            raw_grants = request.data.get("grants") or []
            if not isinstance(raw_grants, list):
                return research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "grants must be a list.",
                )
            with transaction.atomic():
                ReportAccessGrant.objects.filter(report=report, is_revoked=False).update(is_revoked=True)
                for entry in raw_grants:
                    grantee_user = resolve_user(entry.get("grantee_user")) if entry.get("grantee_user") else None
                    grantee_unit_id = entry.get("grantee_org_unit") or None
                    if grantee_user is None and not grantee_unit_id:
                        return research_error(
                            ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                            "Each grant needs a user or an org unit.",
                        )
                    if grantee_user is not None and grantee_user.id == report.owner_id:
                        continue
                    ReportAccessGrant.objects.create(
                        report=report,
                        grantee_user=grantee_user,
                        grantee_org_unit_id=grantee_unit_id,
                        granted_by=request.user,
                    )
            report.visibility = "CUSTOM"
            report.save(update_fields=["visibility", "updated_at"])

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REPORT_VISIBILITY_UPDATE,
            resource_type=ResearchResourceType.REPORT,
            resource_id=report.id,
            org_unit=report.org_unit,
            actor=request.user,
            metadata={
                "previous": previous,
                "visibility": report.visibility,
                "default_visibility": default_visibility,
            },
            request=request,
        )
        return Response(self._payload(workspace, report), status=status.HTTP_200_OK)
