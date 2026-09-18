# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers import PageBinaryUpdateSerializer
from plane.db.models import (
    Page,
    OrgUnit,
    PeriodicReport,
    PeriodicReportProjectReference,
    PeriodicReportSnapshot,
    Project,
    ProjectPage,
    ReportAccessGrant,
    ReportAttachment,
    ReportReviewLog,
    ReportTemplate,
    ResearchProjectProfile,
)
from plane.research.serializers import (
    PeriodicReportSerializer,
    ReportAccessGrantSerializer,
    ReportReviewLogSerializer,
)
from plane.utils.constants import DEFAULT_TIMEZONE
from plane.research.utils.acl import (
    build_actor_context,
    can_narrow,
    check_access,
    direct_advisor_ids,
    org_unit_ancestry,
    org_unit_scope_ids,
    visibility_breadth,
)
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_REPORTS
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.notifications import (
    notify_report_accepted,
    notify_report_returned,
    notify_report_submitted,
)
from plane.research.utils.periods import InvalidPeriod, current_period, parse_period
from plane.research.utils.reports import can_transition, is_editable, report_resource, visible_reports_queryset
from plane.research.utils.settings import default_visibility_for, get_workspace_research_settings
from plane.research.views.base import ResearchAPIView, parse_date, parse_uuid, resolve_user, truthy


def report_queryset(workspace):
    return (
        PeriodicReport.objects.filter(workspace=workspace)
        .select_related("owner", "org_unit", "page", "project")
        .prefetch_related(
            "team_projects",
            "attachments",
            "page__project_pages",
            "official_snapshots",
            "access_grants",
        )
        .order_by("-period_start", "-created_at")
    )


def serialize_report(report, request, context=None, *, include_draft_content=False):
    context = context if context is not None else build_actor_context(request.user, report.workspace_id)
    return PeriodicReportSerializer(
        report,
        context={
            "request": request,
            "actor_context": context,
            "include_draft_content": include_draft_content,
        },
    ).data


def create_report_snapshot(report, actor):
    """Append the current draft body as the next immutable official version."""
    latest_version = (
        PeriodicReportSnapshot.objects.filter(report=report)
        .order_by("-version_no")
        .values_list("version_no", flat=True)
        .first()
        or 0
    )
    page = report.page
    attachment_manifest = [
        {
            "attachment_id": str(attachment.id),
            "asset_id": str(attachment.asset_id),
            "file_name": attachment.file_name,
            "file_size": attachment.file_size,
            "content_type": attachment.content_type,
            "kind": attachment.kind,
        }
        for attachment in ReportAttachment.objects.filter(
            report=report,
            deleted_at__isnull=True,
        ).order_by("created_at", "id")
    ]
    return PeriodicReportSnapshot.objects.create(
        report=report,
        version_no=latest_version + 1,
        snapshot_status=PeriodicReport.Status.SUBMITTED,
        description_json=page.description_json,
        description_html=page.description_html,
        description_stripped=page.description_stripped,
        description_binary=page.description_binary,
        attachment_manifest=attachment_manifest,
        submitted_by=actor,
    )


def grant_is_within_visibility(report, default_visibility, grantee_user, grantee_unit_id):
    """Validate a custom recipient against the policy's actual recipient set."""
    if default_visibility == "WORKSPACE":
        if grantee_user is not None:
            return grantee_user.member_workspace.filter(
                workspace_id=report.workspace_id,
                is_active=True,
            ).exists()
        return bool(grantee_unit_id)
    if default_visibility == "DIRECT_ADVISOR":
        return grantee_user is not None and grantee_user.id in direct_advisor_ids(
            report.owner_id,
            report.workspace_id,
            report.org_unit_id,
        )
    if default_visibility == "UNIT":
        allowed_units = {str(item) for item in org_unit_scope_ids(report.org_unit_id, report.workspace_id)}
        if grantee_unit_id:
            return str(grantee_unit_id) in allowed_units
        return (
            grantee_user.research_org_memberships.filter(
                workspace_id=report.workspace_id,
                org_unit_id__in=allowed_units,
                deleted_at__isnull=True,
            ).exists()
            if grantee_user is not None
            else False
        )
    if default_visibility == "ANCESTRY":
        allowed_units = {str(item) for item in org_unit_ancestry(report.org_unit_id, report.workspace_id)}
        if grantee_unit_id:
            return str(grantee_unit_id) in allowed_units
        return (
            grantee_user.research_org_memberships.filter(
                workspace_id=report.workspace_id,
                org_unit_id__in=allowed_units,
                deleted_at__isnull=True,
            ).exists()
            if grantee_user is not None
            else False
        )
    return False


def validate_report_access_update(report, workspace, payload):
    """Validate a visibility/grant mutation against the locked report state."""
    default_visibility = default_visibility_for(report.report_type, workspace)
    requested_visibility = report.visibility
    if "visibility" in payload:
        requested_visibility = str(payload.get("visibility") or "").strip().upper()
        if not requested_visibility or not can_narrow(default_visibility, requested_visibility):
            return (
                None,
                None,
                default_visibility,
                research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "The visibility cannot be wider than the workspace default.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                ),
            )

    validated_grants = None
    if "grants" in payload:
        if visibility_breadth(requested_visibility) == 0:
            return (
                None,
                None,
                default_visibility,
                research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "Custom grants are not available for private reports.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                ),
            )
        raw_grants = payload.get("grants") or []
        if not isinstance(raw_grants, list):
            return (
                None,
                None,
                default_visibility,
                research_error(
                    ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                    "grants must be a list.",
                ),
            )
        validated_grants = []
        for entry in raw_grants:
            if not isinstance(entry, dict):
                return (
                    None,
                    None,
                    default_visibility,
                    research_error(
                        ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                        "Each grant must be an object.",
                    ),
                )
            grantee_user = resolve_user(entry.get("grantee_user")) if entry.get("grantee_user") else None
            grantee_unit_id = entry.get("grantee_org_unit") or None
            if (
                grantee_unit_id
                and not OrgUnit.objects.filter(
                    workspace=workspace,
                    pk=grantee_unit_id,
                    deleted_at__isnull=True,
                ).exists()
            ):
                return (
                    None,
                    None,
                    default_visibility,
                    research_error(
                        ResearchErrorCode.ORG_UNIT_NOT_FOUND,
                        "Grant organisation not found.",
                    ),
                )
            if grantee_user is None and not grantee_unit_id:
                return (
                    None,
                    None,
                    default_visibility,
                    research_error(
                        ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                        "Each grant needs a user or an org unit.",
                    ),
                )
            if grantee_user is not None and grantee_user.id == report.owner_id:
                continue
            if not grant_is_within_visibility(
                report,
                default_visibility,
                grantee_user,
                grantee_unit_id,
            ):
                return (
                    None,
                    None,
                    default_visibility,
                    research_error(
                        ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                        "A custom grant must stay within the default audience.",
                        status.HTTP_422_UNPROCESSABLE_ENTITY,
                    ),
                )
            validated_grants.append((grantee_user, grantee_unit_id))
    return requested_visibility, validated_grants, default_visibility, None


def report_timezone_for(workspace):
    settings_map = get_workspace_research_settings(workspace)
    return settings_map.get("timezone") or getattr(workspace, "timezone", None) or DEFAULT_TIMEZONE


class ResearchReportListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/reports/``"""

    nav_capability = NAV_REPORTS

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
        org_unit_id, error = parse_uuid(request.GET.get("org_unit"), "org_unit")
        if error:
            return error
        owner_id, error = parse_uuid(request.GET.get("owner"), "owner")
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
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        if date_from:
            queryset = queryset.filter(period_start__gte=date_from)
        if date_to:
            queryset = queryset.filter(period_end__lte=date_to)
        if truthy(request.GET.get("mine")):
            queryset = queryset.filter(owner=request.user)

        context = build_actor_context(request.user, workspace.id)
        visible_queryset = visible_reports_queryset(queryset, context)
        return self.paginate(
            request=request,
            queryset=visible_queryset,
            on_results=lambda reports: [serialize_report(report, request, context) for report in reports],
            default_per_page=50,
            max_per_page=100,
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
                research_type__in=(
                    ResearchProjectProfile.ResearchType.PHD,
                    ResearchProjectProfile.ResearchType.MASTER,
                    ResearchProjectProfile.ResearchType.POSTDOC,
                ),
                is_active=True,
                workflow_status=ResearchProjectProfile.WorkflowStatus.ACTIVE,
            )
            .select_related("project", "org_unit")
            .first()
        )
        primary_membership = (
            request.user.research_org_memberships.filter(
                workspace=workspace,
                is_primary=True,
                deleted_at__isnull=True,
                effective_from__lte=timezone.localdate(),
            )
            .filter(Q(effective_to__isnull=True) | Q(effective_to__gte=timezone.localdate()))
            .select_related("org_unit")
            .first()
        )
        if profile is None and primary_membership is None:
            return research_error(
                ResearchErrorCode.PROJECT_NOT_FOUND,
                "A primary organisation assignment is required before creating reports.",
            )
        report_org_unit = (
            profile.org_unit
            if profile is not None and profile.org_unit_id
            else (primary_membership.org_unit if primary_membership is not None else None)
        )

        raw_team_projects = request.data.get("team_projects") or []
        if not isinstance(raw_team_projects, list):
            return research_error(ResearchErrorCode.PROJECT_NOT_FOUND, "team_projects must be a list.")
        eligible_team_projects = Project.objects.filter(
            workspace=workspace,
            research_profile__research_type=ResearchProjectProfile.ResearchType.RESEARCH_PROJECT,
            project_projectmember__member=request.user,
            project_projectmember__is_active=True,
            deleted_at__isnull=True,
        ).distinct()
        team_projects = list(eligible_team_projects.filter(id__in=raw_team_projects))
        if len(team_projects) != len({str(item) for item in raw_team_projects}):
            return research_permission_denied()

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
                # Plane ``Page`` does not require a ``ProjectPage``. Reports
                # without a cultivation project keep their private draft Page
                # inside the research flow so no arbitrary team project becomes
                # its owner and no synthetic project leaks into project lists.
                if profile is not None:
                    ProjectPage.objects.create(
                        project=profile.project,
                        page=page,
                        workspace=workspace,
                        created_by=request.user,
                    )
                report = PeriodicReport.objects.create(
                    workspace=workspace,
                    project=profile.project if profile else None,
                    owner=request.user,
                    org_unit=report_org_unit,
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
                PeriodicReportProjectReference.objects.bulk_create(
                    [
                        PeriodicReportProjectReference(
                            report=report,
                            project=team_project,
                            created_by=request.user,
                        )
                        for team_project in team_projects
                    ]
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

    nav_capability = NAV_REPORTS

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
        return Response(
            serialize_report(report, request, include_draft_content=True),
            status=status.HTTP_200_OK,
        )

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

        # The body lives in the linked Page. A report without a cultivation
        # project has no ProjectPage route, so its author edits the same Page
        # through this research endpoint.
        if request.data.get("template"):
            template = ReportTemplate.objects.filter(
                workspace=workspace, pk=request.data["template"], is_active=True
            ).first()
            if template is None:
                return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")
            report.page.description_json = template.content_json
            report.page.save(update_fields=["description_json", "updated_at"])

        body_fields = ("description_json", "description_html", "description_binary")
        body_payload = {field: request.data[field] for field in body_fields if field in request.data}
        if body_payload:
            page_serializer = PageBinaryUpdateSerializer(report.page, data=body_payload, partial=True)
            if not page_serializer.is_valid():
                return Response(page_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            page_serializer.save()

        if "is_backfill" in request.data:
            report.is_backfill = truthy(request.data.get("is_backfill"))
            report.save(update_fields=["is_backfill", "updated_at"])

        return Response(
            serialize_report(report, request, include_draft_content=True),
            status=status.HTTP_200_OK,
        )


class ResearchReportSubmitEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reports/<report_id>/submit/``"""

    nav_capability = NAV_REPORTS

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        target = PeriodicReport.Status.SUBMITTED
        with transaction.atomic():
            report = report_queryset(workspace).select_for_update(of=("self",)).filter(pk=report_id).first()
            if report is None or report.owner_id != request.user.id:
                return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
            if report.org_unit_id is None:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_NOT_FOUND,
                    "A report must have an organisation assignment before submission.",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            if not can_transition(report.status, target):
                return research_conflict(
                    ResearchErrorCode.REPORT_STATE_CONFLICT,
                    "The report status does not allow this action.",
                )

            report.page = Page.objects.select_for_update().get(pk=report.page_id)
            body_fields = ("description_json", "description_html", "description_binary")
            final_body = {field: request.data[field] for field in body_fields if field in request.data}
            if final_body:
                page_serializer = PageBinaryUpdateSerializer(report.page, data=final_body, partial=True)
                if not page_serializer.is_valid():
                    return Response(page_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                page_serializer.save()

            previous = report.status
            snapshot = create_report_snapshot(report, request.user)
            ReportAttachment.objects.filter(
                report=report,
                deleted_at__isnull=True,
            ).update(official_version_no=snapshot.version_no)
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
                snapshot_version=str(snapshot.version_no),
            )
            report._prefetched_objects_cache.pop("official_snapshots", None)
            report._prefetched_objects_cache.pop("attachments", None)

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

    nav_capability = NAV_REPORTS

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        comment = str(request.data.get("comment") or "").strip()
        if not comment:
            return research_error(
                ResearchErrorCode.REPORT_RETURN_REASON_REQUIRED,
                "A reason is required when returning a report.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        target = PeriodicReport.Status.NEEDS_REVISION
        with transaction.atomic():
            report = report_queryset(workspace).select_for_update(of=("self",)).filter(pk=report_id).first()
            if report is None:
                return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
            context = build_actor_context(request.user, workspace.id)
            if not check_access(request.user, "return", report_resource(report), context=context):
                return research_permission_denied()
            if not can_transition(report.status, target):
                return research_conflict(
                    ResearchErrorCode.REPORT_STATE_CONFLICT,
                    "The report status does not allow this action.",
                )

            previous = report.status
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

    nav_capability = NAV_REPORTS

    def post(self, request, slug, report_id):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        target = PeriodicReport.Status.ACCEPTED
        with transaction.atomic():
            report = report_queryset(workspace).select_for_update(of=("self",)).filter(pk=report_id).first()
            if report is None:
                return research_not_found(ResearchErrorCode.REPORT_NOT_FOUND, "Report not found.")
            context = build_actor_context(request.user, workspace.id)
            if not check_access(request.user, "accept", report_resource(report), context=context):
                return research_permission_denied()
            if not can_transition(report.status, target):
                return research_conflict(
                    ResearchErrorCode.REPORT_STATE_CONFLICT,
                    "The report status does not allow this action.",
                )

            previous = report.status
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

    nav_capability = NAV_REPORTS

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

    nav_capability = NAV_REPORTS

    def _load(self, request, workspace, report_id, *, for_update=False):
        queryset = report_queryset(workspace)
        if for_update:
            queryset = queryset.select_for_update(of=("self",))
        report = queryset.filter(pk=report_id).first()
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
        with transaction.atomic():
            report, error = self._load(request, workspace, report_id, for_update=True)
            if error:
                return error
            previous = {"visibility": report.visibility}
            requested_visibility, validated_grants, default_visibility, error = validate_report_access_update(
                report, workspace, request.data
            )
            if error:
                return error
            if validated_grants is not None:
                ReportAccessGrant.objects.filter(report=report, is_revoked=False).update(is_revoked=True)
                for grantee_user, grantee_unit_id in validated_grants:
                    ReportAccessGrant.objects.create(
                        report=report,
                        grantee_user=grantee_user,
                        grantee_org_unit_id=grantee_unit_id,
                        granted_by=request.user,
                    )
                report.visibility = "CUSTOM"
            else:
                report.visibility = requested_visibility
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
