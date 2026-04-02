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

"""
Project Member Import Serializer.

Imports existing workspace members into a project. Only requires email and role.
Users must already be workspace members; non-members are skipped.
"""

from rest_framework import serializers
from plane.db.models import WorkspaceMember, ProjectMember


class ProjectMemberImportSerializer(serializers.Serializer):
    """
    Serializer for importing workspace members into a project.

    Only accepts email and role. The user must already be a workspace member.

    Context required:
    - workspace_id: UUID of workspace (required)
    - project_id: UUID of project (required)
    - created_by_id: UUID of user performing import (optional)
    """

    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=["5", "15", "20"], default="15", required=False)

    def validate_email(self, value):
        return value.lower().strip() if value else value

    def validate_role(self, value):
        return int(value) if value else 15

    def validate(self, attrs):
        workspace_id = self.context.get("workspace_id")
        project_id = self.context.get("project_id")

        if not workspace_id:
            raise serializers.ValidationError("workspace_id is required in context")
        if not project_id:
            raise serializers.ValidationError("project_id is required in context")

        # Look up the workspace member by email
        workspace_member = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            member__email=attrs["email"],
            is_active=True,
        ).select_related("member").first()

        if not workspace_member:
            raise serializers.ValidationError(
                f"{attrs['email']} is not an active workspace member"
            )

        attrs["_workspace_member"] = workspace_member
        return attrs

    def create(self, validated_data):
        workspace_member = validated_data["_workspace_member"]
        user = workspace_member.member
        role = validated_data.get("role", 15)
        project_id = self.context["project_id"]
        created_by_id = self.context.get("created_by_id")

        # Check for existing member including inactive ones
        existing_member = ProjectMember.all_objects.filter(
            member=user,
            project_id=project_id,
        ).first()

        if existing_member:
            if existing_member.is_active:
                # Already an active member, nothing to do
                return {
                    "email": user.email,
                    "project_member_created": False,
                    "reactivated": False,
                }
            # Reactivate inactive member
            existing_member.is_active = True
            existing_member.role = role
            existing_member.save(update_fields=["is_active", "role"])
            return {
                "email": user.email,
                "project_member_created": False,
                "reactivated": True,
            }

        # Create new project member
        ProjectMember.objects.create(
            member=user,
            project_id=project_id,
            role=role,
            created_by_id=created_by_id,
            updated_by_id=created_by_id,
        )
        return {
            "email": user.email,
            "project_member_created": True,
            "reactivated": False,
        }
