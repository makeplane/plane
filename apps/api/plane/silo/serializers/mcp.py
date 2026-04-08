# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.silo.models import MCPApplication, MCPAuthType, MCPConnectionCredentials
from plane.silo.services.mcp_connection import decrypt_auth_config
from plane.api.serializers.base import BaseSerializer


class MCPHeaderSerializer(serializers.Serializer):
    """Validates individual auth headers for HEADER auth type."""

    name = serializers.CharField(required=True)
    value = serializers.CharField(required=True)


class MCPApplicationSerializer(BaseSerializer):
    is_connected = serializers.SerializerMethodField()
    is_custom = serializers.SerializerMethodField()
    is_configured = serializers.SerializerMethodField()
    logo_url = serializers.CharField(read_only=True)
    headers = serializers.SerializerMethodField()
    description = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
        source="description_stripped",
    )

    class Meta:
        model = MCPApplication
        fields = [
            "id",
            "name",
            "slug",
            "url",
            "description_html",
            "description_stripped",
            "logo_asset",
            "logo_url",
            "authorization_type",
            "status",
            "metadata",
            "sort_order",
            "created_at",
            "updated_at",
            # write-only
            "description",
            # computed
            "is_connected",
            "is_custom",
            "is_configured",
            "headers",
        ]
        read_only_fields = [
            "id",
            "slug",
            "status",
            "description_html",
            "description_stripped",
            "created_at",
            "updated_at",
        ]

    def get_is_connected(self, obj):
        """True when the app has been successfully connected (status is ACTIVE)."""
        return obj.status == MCPApplication.Status.ACTIVE

    def get_is_custom(self, obj):
        """True when the app was added by the user (vs a published marketplace app)."""
        owned_app_ids = self.context.get("owned_app_ids", set())
        return obj.id in owned_app_ids

    def get_is_configured(self, obj):
        """
        True when the app is ready to be used.
        - NONE / OAUTH auth types are always configured.
        - HEADER auth is configured only when credentials exist.
        """
        if obj.authorization_type in (MCPAuthType.NONE, MCPAuthType.OAUTH):
            return True
        credentialed_app_ids = self.context.get("credentialed_app_ids", set())
        return obj.id in credentialed_app_ids

    def get_headers(self, obj):
        """
        Return decrypted headers for HEADER auth type when configured.
        Same format as PATCH request.data: [{"name": "...", "value": "..."}]
        """
        if obj.authorization_type != MCPAuthType.HEADER:
            return None
        workspace_id = self.context.get("workspace_id")
        user_id = self.context.get("user_id")
        if not workspace_id or not user_id:
            return None
        try:
            creds = MCPConnectionCredentials.objects.get(
                mcp_application=obj,
                workspace_id=workspace_id,
                user_id=user_id,
            )
        except MCPConnectionCredentials.DoesNotExist:
            return None
        decrypted = decrypt_auth_config(creds.auth_config)
        return decrypted.get("headers", [])

    def validate_authorization_type(self, value):
        valid_types = [choice[0] for choice in MCPAuthType.choices]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid authorization type. Must be one of: {', '.join(valid_types)}"
            )
        return value