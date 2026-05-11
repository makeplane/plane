# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import ProjectFieldPermission


class ProjectFieldPermissionSerializer(BaseSerializer):
    """Serializer for ProjectFieldPermission — exposes 4 toggle booleans plus read-only IDs."""

    workspace = serializers.UUIDField(source="workspace_id", read_only=True)
    project = serializers.UUIDField(source="project_id", read_only=True)

    class Meta:
        model = ProjectFieldPermission
        fields = [
            "id",
            "workspace",
            "project",
            "allow_member_modify_completed_date",
            "allow_member_modify_target_date",
            "allow_member_modify_start_date",
            "allow_member_delete_work_item",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "project", "created_at", "updated_at"]
