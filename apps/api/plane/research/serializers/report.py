# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import PeriodicReport, ReportAccessGrant, ReportReviewLog

from .org import ResearchUserSerializer


class ReportReviewLogSerializer(serializers.ModelSerializer):
    actor_detail = ResearchUserSerializer(source="actor", read_only=True)

    class Meta:
        model = ReportReviewLog
        fields = [
            "id",
            "report",
            "actor",
            "actor_detail",
            "action",
            "from_status",
            "to_status",
            "comment",
            "snapshot_version",
            "created_at",
        ]
        read_only_fields = fields


class ReportAccessGrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportAccessGrant
        fields = [
            "id",
            "grantee_user",
            "grantee_org_unit",
            "granted_by",
            "expires_at",
            "is_revoked",
            "created_at",
        ]
        read_only_fields = ["id", "granted_by", "created_at"]


class PeriodicReportSerializer(serializers.ModelSerializer):
    owner_detail = ResearchUserSerializer(source="owner", read_only=True)
    org_unit_detail = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = PeriodicReport
        fields = [
            "id",
            "workspace",
            "project",
            "owner",
            "owner_detail",
            "org_unit",
            "org_unit_detail",
            "page",
            "report_type",
            "period_key",
            "period_start",
            "period_end",
            "timezone",
            "status",
            "visibility",
            "is_backfill",
            "submitted_at",
            "accepted_at",
            "reviewer",
            "created_at",
            "updated_at",
            "can_edit",
            "can_review",
            "attachment_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_org_unit_detail(self, obj):
        if not obj.org_unit_id or obj.org_unit is None:
            return None
        return {"id": str(obj.org_unit_id), "name": obj.org_unit.name, "unit_type": obj.org_unit.unit_type}

    def get_can_edit(self, obj):
        request = self.context.get("request")
        if request is None:
            return False
        return bool(obj.owner_id == request.user.id and obj.status in ("DRAFT", "NEEDS_REVISION"))

    def get_can_review(self, obj):
        context = self.context.get("actor_context")
        if context is None:
            return False
        from plane.research.utils.acl import check_access
        from plane.research.utils.reports import report_resource

        request = self.context.get("request")
        if request is None:
            return False
        return check_access(request.user, "review", report_resource(obj), context=context)

    def get_attachment_count(self, obj):
        return obj.attachments.count() if hasattr(obj, "attachments") else 0
