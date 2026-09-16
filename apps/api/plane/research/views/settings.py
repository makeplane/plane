# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytz
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import ReportVisibility, WorkspaceResearchSetting
from plane.research.serializers import WorkspaceResearchSettingSerializer
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_error,
    research_permission_denied,
)
from plane.research.utils.org import ensure_root_org_unit, is_workspace_admin
from plane.research.utils.settings import default_workspace_research_settings
from plane.research.views.base import ResearchAPIView, truthy

BOOLEAN_FIELDS = (
    "module_enabled",
    "org_enabled",
    "report_enabled",
    "approval_enabled",
    "allow_multiple_projects",
)

VISIBILITY_FIELDS = (
    "default_report_visibility",
    "weekly_default_visibility",
    "monthly_default_visibility",
)

LIMIT_FIELDS = ("image_max_mb", "pdf_max_mb", "markdown_max_mb", "audit_retention_days")


def get_or_create_setting(workspace, actor=None):
    setting = WorkspaceResearchSetting.objects.filter(workspace=workspace).first()
    if setting is None:
        setting = WorkspaceResearchSetting.objects.create(
            workspace=workspace,
            created_by=actor,
            # Opening this page must not flip a workspace off unnoticed: a fresh
            # row inherits the deployment switch instead of the model default.
            module_enabled=default_workspace_research_settings()["module_enabled"],
        )
    return setting


class ResearchSettingsEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/settings/``

    The deployment switch is the outer gate; this endpoint manages the
    workspace level switches, upload limits and the default visibility policy
    (P0-CFG-01 ~ P0-CFG-08).
    """

    def get(self, request, slug):
        workspace, error = self.get_workspace(require_enabled=False)
        if error:
            return error
        setting = get_or_create_setting(workspace, actor=request.user)
        return Response(WorkspaceResearchSettingSerializer(setting).data, status=status.HTTP_200_OK)

    def patch(self, request, slug):
        workspace, error = self.get_workspace(require_enabled=False)
        if error:
            return error
        if not is_research_admin(request.user, workspace.id):
            return research_permission_denied()

        setting = get_or_create_setting(workspace, actor=request.user)
        previous = WorkspaceResearchSettingSerializer(setting).data
        changed = []

        for field in BOOLEAN_FIELDS:
            if field in request.data:
                setattr(setting, field, truthy(request.data.get(field)))
                changed.append(field)

        for field in VISIBILITY_FIELDS:
            if field in request.data:
                value = request.data.get(field)
                if value in (None, ""):
                    if field == "default_report_visibility":
                        return research_error(
                            ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                            "The default visibility is required.",
                        )
                    setattr(setting, field, None)
                elif value not in ReportVisibility.values:
                    return research_error(
                        ResearchErrorCode.REPORT_VISIBILITY_EXCEEDS_DEFAULT,
                        "Unknown visibility level.",
                    )
                else:
                    setattr(setting, field, value)
                changed.append(field)

        for field in LIMIT_FIELDS:
            if field in request.data:
                try:
                    value = int(request.data.get(field))
                except (TypeError, ValueError):
                    return research_error(
                        ResearchErrorCode.FILE_SIZE_EXCEEDED,
                        f"{field} must be a positive integer.",
                    )
                if value < 0:
                    return research_error(
                        ResearchErrorCode.FILE_SIZE_EXCEEDED,
                        f"{field} must be a positive integer.",
                    )
                setattr(setting, field, value)
                changed.append(field)

        if "timezone" in request.data:
            timezone_value = request.data.get("timezone") or None
            if timezone_value and timezone_value not in pytz.all_timezones:
                return research_error(
                    ResearchErrorCode.ORG_UNIT_TYPE_INVALID,
                    "Unknown timezone.",
                )
            setting.timezone = timezone_value
            changed.append("timezone")

        if not changed:
            return Response(WorkspaceResearchSettingSerializer(setting).data, status=status.HTTP_200_OK)

        setting.save()

        # enabling the module provisions the organisation root so the tree is
        # never empty (P0-ORG-01)
        if setting.module_enabled and setting.org_enabled:
            ensure_root_org_unit(workspace, actor=request.user)

        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.CONFIG_UPDATE,
            resource_type=ResearchResourceType.WORKSPACE_SETTING,
            resource_id=setting.id,
            actor=request.user,
            metadata={
                "changed": changed,
                "previous": {field: previous.get(field) for field in changed},
                "current": {field: getattr(setting, field) for field in changed},
            },
            request=request,
        )
        return Response(WorkspaceResearchSettingSerializer(setting).data, status=status.HTTP_200_OK)
