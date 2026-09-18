# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import WorkspaceResearchSetting


class WorkspaceResearchSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceResearchSetting
        fields = [
            "id",
            "workspace",
            "purpose",
            "main_pi",
            "required_reporter_categories",
            "module_enabled",
            "org_enabled",
            "report_enabled",
            "approval_enabled",
            "allow_multiple_projects",
            "default_report_visibility",
            "weekly_default_visibility",
            "monthly_default_visibility",
            "image_max_mb",
            "pdf_max_mb",
            "markdown_max_mb",
            "timezone",
            "audit_retention_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "purpose", "created_at", "updated_at"]
