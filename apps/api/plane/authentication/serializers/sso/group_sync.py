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

from rest_framework import serializers

from plane.authentication.models import GroupSyncConfig, GroupMapping


class GroupSyncConfigSerializer(serializers.ModelSerializer):
    """Serializer for GroupSyncConfig model."""

    class Meta:
        model = GroupSyncConfig
        fields = [
            "id",
            "is_enabled",
            "sync_on_login",
            "auto_remove",
            "group_attribute_key",
            "sync_offline",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
        ]


class GroupMappingSerializer(serializers.ModelSerializer):
    """Serializer for GroupMapping model with project details."""

    class Meta:
        model = GroupMapping
        fields = [
            "id",
            "idp_group_name",
            "project",
            "default_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
        ]

    def validate_project(self, value):
        """Ensure project belongs to the workspace."""
        workspace = self.context.get("workspace")
        if workspace and value.workspace_id != workspace.id:
            raise serializers.ValidationError("Project does not belong to this workspace.")
        return value

    def validate_default_role(self, value):
        """Ensure role is valid."""
        valid_roles = [GroupMapping.ROLE_ADMIN, GroupMapping.ROLE_MEMBER, GroupMapping.ROLE_GUEST]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {valid_roles}")
        return value

    def validate(self, attrs):
        """Check for duplicate mapping."""
        workspace = self.context.get("workspace")
        idp_group_name = attrs.get("idp_group_name")
        project = attrs.get("project")

        # Skip validation for updates if these fields haven't changed
        if self.instance:
            idp_group_name = idp_group_name or self.instance.idp_group_name
            project = project or self.instance.project

        # Check for existing mapping
        existing = GroupMapping.objects.filter(
            workspace=workspace,
            idp_group_name=idp_group_name,
            project=project,
        )

        if self.instance:
            existing = existing.exclude(id=self.instance.id)

        if existing.exists():
            raise serializers.ValidationError(
                {"idp_group_name": "A mapping for this group and project already exists."}
            )

        return attrs


class GroupMappingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating GroupMapping."""

    class Meta:
        model = GroupMapping
        fields = [
            "idp_group_name",
            "project",
            "default_role",
        ]

    def validate_project(self, value):
        """Ensure project belongs to the workspace."""
        workspace = self.context.get("workspace")
        if workspace and value.workspace_id != workspace.id:
            raise serializers.ValidationError("Project does not belong to this workspace.")
        return value

    def validate_default_role(self, value):
        """Ensure role is valid."""
        valid_roles = [GroupMapping.ROLE_ADMIN, GroupMapping.ROLE_MEMBER, GroupMapping.ROLE_GUEST]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {valid_roles}")
        return value

    def validate(self, attrs):
        """Check for duplicate mapping."""
        workspace = self.context.get("workspace")
        idp_group_name = attrs.get("idp_group_name")
        project = attrs.get("project")

        if GroupMapping.objects.filter(
            workspace=workspace,
            idp_group_name=idp_group_name,
            project=project,
        ).exists():
            raise serializers.ValidationError(
                {"idp_group_name": "A mapping for this group and project already exists."}
            )

        return attrs

    def create(self, validated_data):
        workspace = self.context.get("workspace")
        return GroupMapping.objects.create(workspace=workspace, **validated_data)
