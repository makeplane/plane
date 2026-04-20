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

    default_workspace_role_detail = serializers.SerializerMethodField()

    class Meta:
        model = GroupSyncConfig
        fields = [
            "id",
            "is_enabled",
            "sync_on_login",
            "auto_remove",
            "group_attribute_key",
            "sync_offline",
            "default_workspace_role",
            "default_workspace_role_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "default_workspace_role_detail",
            "created_at",
            "updated_at",
        ]

    def get_default_workspace_role_detail(self, obj):
        if obj.default_workspace_role:
            return {
                "id": str(obj.default_workspace_role.id),
                "slug": obj.default_workspace_role.slug,
                "name": obj.default_workspace_role.name,
            }
        return None

    def validate_default_workspace_role(self, value):
        """Ensure role belongs to the workspace and is workspace-scoped."""
        instance = self.instance
        if instance and value.workspace_id != instance.workspace_id:
            raise serializers.ValidationError("Role does not belong to this workspace.")
        if value.namespace != "workspace":
            raise serializers.ValidationError("Role must be a workspace-scoped role.")
        return value


class GroupMappingSerializer(serializers.ModelSerializer):
    """Serializer for GroupMapping model with project and role details."""

    role_detail = serializers.SerializerMethodField()

    class Meta:
        model = GroupMapping
        fields = [
            "id",
            "idp_group_name",
            "project",
            "role",
            "role_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "role_detail",
            "created_at",
            "updated_at",
        ]

    def get_role_detail(self, obj):
        if obj.role:
            return {
                "id": str(obj.role.id),
                "slug": obj.role.slug,
                "name": obj.role.name,
            }
        return None

    def validate_project(self, value):
        """Ensure project belongs to the workspace."""
        workspace = self.context.get("workspace")
        if workspace and value.workspace_id != workspace.id:
            raise serializers.ValidationError("Project does not belong to this workspace.")
        return value

    def validate_role(self, value):
        """Ensure role exists, belongs to the workspace, and is project-scoped."""
        workspace = self.context.get("workspace")
        if not workspace:
            return value
        if value.workspace_id != workspace.id:
            raise serializers.ValidationError("Role does not belong to this workspace.")
        if value.namespace != "project":
            raise serializers.ValidationError("Role must be a project-scoped role.")
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
            "role",
        ]

    def validate_project(self, value):
        """Ensure project belongs to the workspace."""
        workspace = self.context.get("workspace")
        if workspace and value.workspace_id != workspace.id:
            raise serializers.ValidationError("Project does not belong to this workspace.")
        return value

    def validate_role(self, value):
        """Ensure role exists, belongs to the workspace, and is project-scoped."""
        workspace = self.context.get("workspace")
        if not workspace:
            return value
        if value.workspace_id != workspace.id:
            raise serializers.ValidationError("Role does not belong to this workspace.")
        if value.namespace != "project":
            raise serializers.ValidationError("Role must be a project-scoped role.")
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
