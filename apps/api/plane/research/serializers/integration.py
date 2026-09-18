# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import (
    ExternalReferenceLink,
    ExternalSystemConnection,
    IntegrationCallLog,
    ResearchExternalReference,
)


class ExternalSystemConnectionSerializer(serializers.ModelSerializer):
    has_credential = serializers.SerializerMethodField()

    class Meta:
        model = ExternalSystemConnection
        fields = [
            "id",
            "workspace",
            "system",
            "display_name",
            "base_url",
            "auth_mode",
            "credential_ref",
            "has_credential",
            "timeout_seconds",
            "cache_ttl_seconds",
            "degraded_mode",
            "is_enabled",
            "health_status",
            "last_health_at",
            "last_success_at",
            "last_error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "health_status",
            "last_health_at",
            "last_success_at",
            "last_error",
            "created_at",
            "updated_at",
        ]

    def get_has_credential(self, obj):
        """Credentials are never echoed, only their presence (P1-INT-02)."""
        return bool(obj.credential_ref)


class ExternalReferenceLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalReferenceLink
        fields = ["id", "reference", "target_type", "target_id", "created_at"]
        read_only_fields = ["id", "reference", "created_at"]


class ResearchExternalReferenceSerializer(serializers.ModelSerializer):
    links = ExternalReferenceLinkSerializer(many=True, read_only=True)

    class Meta:
        model = ResearchExternalReference
        fields = [
            "id",
            "workspace",
            "system",
            "external_type",
            "external_id",
            "external_parent_id",
            "title",
            "summary",
            "source_url",
            "acl_hint",
            "metadata",
            "content_hash",
            "synced_at",
            "status",
            "links",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]


class IntegrationCallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationCallLog
        fields = [
            "id",
            "system",
            "operation",
            "request_id",
            "outcome",
            "status_code",
            "latency_ms",
            "error_code",
            "created_at",
        ]
        read_only_fields = fields
