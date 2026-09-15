# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import ReportTemplate
from plane.research.serializers import ReportTemplateSerializer
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.views.base import ResearchAPIView, truthy

REPORT_TYPES = ("WEEKLY", "MONTHLY")


class ResearchReportTemplateListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/report-templates/``"""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        templates = ReportTemplate.objects.filter(workspace=workspace)
        if request.GET.get("report_type"):
            templates = templates.filter(report_type=str(request.GET["report_type"]).upper())
        if not truthy(request.GET.get("include_inactive")):
            templates = templates.filter(is_active=True)
        data = list(templates.order_by("report_type", "name"))
        return Response(
            {"results": ReportTemplateSerializer(data, many=True).data, "count": len(data)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()

        name = str(request.data.get("name") or "").strip()
        scope = str(request.data.get("scope") or ReportTemplate.Scope.REPORT).upper()
        if scope not in ReportTemplate.Scope.values:
            return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Unknown template scope.")
        report_type = str(request.data.get("report_type") or "WEEKLY").strip().upper()
        if not name:
            return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template name is required.")
        if scope == ReportTemplate.Scope.REPORT and report_type not in REPORT_TYPES:
            return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Unknown report type.")

        is_default = truthy(request.data.get("is_default"))
        try:
            with transaction.atomic():
                if is_default:
                    ReportTemplate.objects.filter(
                        workspace=workspace, report_type=report_type, is_default=True
                    ).update(is_default=False)
                template = ReportTemplate.objects.create(
                    workspace=workspace,
                    name=name,
                    scope=scope,
                    report_type=report_type,
                    stage=str(request.data.get("stage") or "").upper(),
                    material_type=str(request.data.get("material_type") or "").upper(),
                    variables=list(request.data.get("variables") or []),
                    content_json=request.data.get("content_json") or {"type": "doc", "content": []},
                    is_default=is_default,
                    is_active=truthy(request.data.get("is_active"), default=True),
                )
        except IntegrityError:
            return research_error(
                ResearchErrorCode.TEMPLATE_NOT_FOUND,
                "A template with the same name already exists for this report type.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.TEMPLATE_CREATE,
            resource_type=ResearchResourceType.REPORT_TEMPLATE,
            resource_id=template.id,
            actor=request.user,
            metadata={"name": name, "scope": scope, "report_type": report_type, "is_default": is_default},
            request=request,
        )
        return Response(ReportTemplateSerializer(template).data, status=status.HTTP_201_CREATED)


class ResearchReportTemplateDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/report-templates/<pk>/``"""

    def _get_template(self, workspace, pk):
        return ReportTemplate.objects.filter(workspace=workspace, pk=pk).first()

    def get(self, request, slug, pk):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        template = self._get_template(workspace, pk)
        if template is None:
            return research_not_found(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")
        return Response(ReportTemplateSerializer(template).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()
        template = self._get_template(workspace, pk)
        if template is None:
            return research_not_found(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")

        fields = []
        if "name" in request.data:
            name = str(request.data.get("name") or "").strip()
            if not name:
                return research_error(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template name is required.")
            template.name = name
            fields.append("name")
        if "content_json" in request.data:
            template.content_json = request.data.get("content_json") or {}
            fields.append("content_json")
        if "is_active" in request.data:
            template.is_active = truthy(request.data.get("is_active"))
            fields.append("is_active")
        if "is_default" in request.data:
            wants_default = truthy(request.data.get("is_default"))
            template.is_default = wants_default
            fields.append("is_default")

        try:
            with transaction.atomic():
                if template.is_default:
                    ReportTemplate.objects.filter(
                        workspace=workspace,
                        report_type=template.report_type,
                        is_default=True,
                    ).exclude(pk=template.pk).update(is_default=False)
                if fields:
                    template.save(update_fields=[*fields, "updated_at"])
        except IntegrityError:
            return research_error(
                ResearchErrorCode.TEMPLATE_NOT_FOUND,
                "A template with the same name already exists for this report type.",
            )

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.TEMPLATE_UPDATE,
            resource_type=ResearchResourceType.REPORT_TEMPLATE,
            resource_id=template.id,
            actor=request.user,
            metadata={"changed": fields, "is_default": template.is_default},
            request=request,
        )
        return Response(ReportTemplateSerializer(template).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        workspace, error = self.get_workspace(section="reports")
        if error:
            return error
        if not is_workspace_admin(request.user, workspace.id):
            return research_permission_denied()
        template = self._get_template(workspace, pk)
        if template is None:
            return research_not_found(ResearchErrorCode.TEMPLATE_NOT_FOUND, "Template not found.")

        template.is_active = False
        template.is_default = False
        template.deleted_at = timezone.now()
        template.save(update_fields=["is_active", "is_default", "deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.TEMPLATE_DELETE,
            resource_type=ResearchResourceType.REPORT_TEMPLATE,
            resource_id=template.id,
            actor=request.user,
            metadata={"name": template.name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
