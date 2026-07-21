# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import CrmIntegration, CrmSyncLog


class CrmIntegrationSerializer(DynamicBaseSerializer):
    """Serializer for the per-workspace CRM integration configuration.

    The raw CRM API key is accepted write-only and stored encrypted; it is never
    returned. ``has_api_key`` lets clients show whether a key is configured.
    """

    # Write-only raw key. A blank value on update leaves the stored key intact.
    crm_api_key = serializers.CharField(
        write_only=True, required=False, allow_blank=True, trim_whitespace=True
    )
    has_api_key = serializers.SerializerMethodField()

    class Meta:
        model = CrmIntegration
        fields = [
            "id",
            "workspace",
            "crm_api_url",
            "crm_project_id_custom_field",
            "crm_invoice_hours_field_id",
            "is_active",
            "last_synced_at",
            "last_sync_status",
            "crm_api_key",
            "has_api_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "last_synced_at",
            "last_sync_status",
            "created_at",
            "updated_at",
        ]

    def get_has_api_key(self, obj):
        return bool(obj.crm_api_key_encrypted)

    def validate_crm_project_id_custom_field(self, value):
        """Ensure the chosen custom field belongs to this workspace and targets projects."""
        if value is None:
            return value
        workspace = self.context.get("workspace")
        if workspace is not None and value.workspace_id != workspace.id:
            raise serializers.ValidationError("Custom field does not belong to this workspace.")
        if value.entity_type != "project":
            raise serializers.ValidationError("Custom field must target projects.")
        return value

    def create(self, validated_data):
        raw_key = validated_data.pop("crm_api_key", None)
        instance = CrmIntegration(**validated_data)
        if raw_key:
            instance.set_api_key(raw_key)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        raw_key = validated_data.pop("crm_api_key", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Only replace the stored key when a non-empty new value is supplied.
        if raw_key:
            instance.set_api_key(raw_key)
        instance.save()
        return instance


class CrmSyncLogSerializer(DynamicBaseSerializer):
    class Meta:
        model = CrmSyncLog
        fields = [
            "id",
            "integration",
            "sync_month",
            "status",
            "projects_processed",
            "projects_synced",
            "projects_skipped",
            "details",
            "created_at",
        ]
        read_only_fields = fields
