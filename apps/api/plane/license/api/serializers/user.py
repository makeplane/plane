# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import User
from plane.license.models import InstanceRoleAssignment


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class InstanceRoleAssignmentSerializer(BaseSerializer):
    assigned_by_email = serializers.CharField(source="assigned_by.email", read_only=True, default=None)

    class Meta:
        model = InstanceRoleAssignment
        fields = ["id", "role", "note", "assigned_by", "assigned_by_email", "created_at"]
        read_only_fields = ["id", "assigned_by", "assigned_by_email", "created_at"]


class InstanceUserSerializer(BaseSerializer):
    """Registered account plus its administrator tags and research profile."""

    admin_roles = serializers.SerializerMethodField()
    research_profile = serializers.SerializerMethodField()
    workspace_memberships = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "display_name",
            "first_name",
            "last_name",
            "is_active",
            "is_bot",
            "last_login",
            "date_joined",
            "admin_roles",
            "research_profile",
            "workspace_memberships",
        ]
        read_only_fields = fields

    def get_admin_roles(self, obj):
        assignments = getattr(obj, "active_role_assignments", None)
        if assignments is None:
            assignments = list(
                InstanceRoleAssignment.objects.filter(user=obj, deleted_at__isnull=True)
                .order_by("role")
                .values_list("role", flat=True)
            )
        return list(assignments)

    def get_research_profile(self, obj):
        profile = getattr(obj, "research_profile", None)
        if profile is None:
            return None
        return {
            "student_no": profile.student_no,
            "grade": profile.grade,
            "degree": profile.degree,
            "phone": profile.phone,
            "category": profile.category,
            "group_label": profile.group_label,
        }

    def get_workspace_memberships(self, obj):
        memberships = getattr(obj, "active_workspace_memberships", None)
        if memberships is None:
            memberships = list(
                obj.member_workspace.filter(is_active=True, deleted_at__isnull=True)
                .order_by("workspace__slug")
                .values_list("workspace__slug", flat=True)
            )
        return list(memberships)
