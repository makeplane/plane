# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import ResearchAuditEvent

from .org import ResearchUserSerializer


class ResearchAuditEventSerializer(serializers.ModelSerializer):
    actor_detail = ResearchUserSerializer(source="actor", read_only=True)
    org_unit_detail = serializers.SerializerMethodField()

    class Meta:
        model = ResearchAuditEvent
        fields = [
            "id",
            "workspace",
            "actor",
            "actor_detail",
            "action",
            "resource_type",
            "resource_id",
            "org_unit",
            "org_unit_detail",
            "metadata",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields

    def get_org_unit_detail(self, obj):
        if not obj.org_unit_id:
            return None
        return {"id": str(obj.org_unit_id), "name": getattr(obj.org_unit, "name", None)}
