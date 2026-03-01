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
User Import Serializer.

Single responsibility: Import a user into a workspace (and optionally project).
Handles User, WorkspaceMember, and ProjectMember creation in one place.
"""

import uuid
from typing import Any, Dict, List

from rest_framework import serializers
from plane.app.serializers import UserSerializer
from plane.db.models import User, WorkspaceMember, WorkspaceMemberInvite, ProjectMember
from plane.ee.models import WorkspaceLicense


class UserImportListSerializer(serializers.ListSerializer):
    """
    Custom ListSerializer that validates seat limits before processing rows.

    Used when UserImportSerializer(many=True) is called.
    """

    def validate(self, attrs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate seat limits before processing individual rows."""
        self._validate_seat_limits(attrs)
        return super().validate(attrs)

    def _validate_seat_limits(self, records: List[Dict[str, Any]]) -> None:
        """
        Validate that importing these records won't exceed seat limits.

        Raises:
            ValidationError: If import would exceed available seats
        """
        workspace_id = self.context.get("workspace_id")
        if not workspace_id:
            return

        workspace_license = WorkspaceLicense.objects.filter(workspace_id=workspace_id).first()

        if not workspace_license:
            return  # No license means no restrictions

        # Collect emails from import to exclude existing workspace members
        import_emails = [r.get("email", "").lower().strip() for r in records if r.get("email")]

        # Get existing workspace member emails (they won't consume new seats)
        existing_wm_emails = set(
            WorkspaceMember.objects.filter(
                workspace_id=workspace_id,
                member__email__in=import_emails,
                is_active=True,
            ).values_list("member__email", flat=True)
        )

        # Count new members by role (excluding already workspace members)
        new_admin_members = 0  # role > 10
        new_guest_viewers = 0  # role <= 10

        for record in records:
            email = record.get("email", "").lower().strip()
            if email in existing_wm_emails:
                continue  # Already a workspace member, no new seat needed

            # Role might be string or int at this point
            role = record.get("role", 15)
            role = int(role) if isinstance(role, str) else role

            if role > 10:
                new_admin_members += 1
            else:
                new_guest_viewers += 1

        # No new seats needed
        if new_admin_members == 0 and new_guest_viewers == 0:
            return

        # Get current seat counts
        current_admin_count = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            is_active=True,
            member__is_bot=False,
            role__gt=10,
        ).count()

        current_guest_count = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            is_active=True,
            member__is_bot=False,
            role__lte=10,
        ).count()

        invited_admin_count = WorkspaceMemberInvite.objects.filter(
            workspace_id=workspace_id,
            role__gt=10,
        ).count()

        invited_guest_count = WorkspaceMemberInvite.objects.filter(
            workspace_id=workspace_id,
            role__lte=10,
        ).count()

        # Validate based on plan
        if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
            total_after_import = (
                current_admin_count
                + current_guest_count
                + invited_admin_count
                + invited_guest_count
                + new_admin_members
                + new_guest_viewers
            )

            if total_after_import > workspace_license.free_seats:
                available = max(
                    0,
                    workspace_license.free_seats
                    - current_admin_count
                    - current_guest_count
                    - invited_admin_count
                    - invited_guest_count,
                )
                raise serializers.ValidationError(
                    f"Import exceeds free plan seat limit. "
                    f"Available: {available}, Requested: {new_admin_members + new_guest_viewers}"
                )
        else:
            # Paid plans: check admin/member and guest/viewer limits separately
            total_admin_after = current_admin_count + invited_admin_count + new_admin_members
            total_guest_after = current_guest_count + invited_guest_count + new_guest_viewers
            purchased = workspace_license.purchased_seats

            if new_admin_members > 0 and total_admin_after > purchased:
                available_admin = max(0, purchased - current_admin_count - invited_admin_count)
                raise serializers.ValidationError(
                    f"Import exceeds admin/member seat limit. "
                    f"Available: {available_admin}, Requested: {new_admin_members}"
                )

            if new_guest_viewers > 0 and total_guest_after > 5 * purchased:
                available_guest = max(0, 5 * purchased - current_guest_count - invited_guest_count)
                raise serializers.ValidationError(
                    f"Import exceeds guest/viewer seat limit. "
                    f"Available: {available_guest}, Requested: {new_guest_viewers}"
                )

    def create(self, validated_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create records with partial success.

        Continues processing even if individual rows fail.
        Uses get_or_create with ignore behavior for resilience.
        """
        results = []
        for item in validated_data:
            try:
                result = self.child.create(item)
                results.append(result)
            except Exception:
                # Skip failed rows, continue with others
                # Error is already handled by get_or_create's ignore_conflicts behavior
                continue
        return results


class UserImportSerializer(UserSerializer):
    """
    Complete serializer for importing users into workspace/project.

    Inherits from UserSerializer, overrides Meta to:
    - Make email writable (required for import)
    - Add role field (for membership)
    - Limit fields to import-relevant ones

    Context required:
    - workspace_id: UUID of workspace (required)
    - project_id: UUID of project (optional)
    - created_by_id: UUID of user performing import (optional)

    Usage:
        serializer = UserImportSerializer(data=row, context={
            'workspace_id': workspace_id,
            'project_id': project_id,
            'created_by_id': user_id,
        })
        if serializer.is_valid():
            result = serializer.save()
            # result = {
            #     'user': User instance,
            #     'user_created': bool,
            #     'workspace_member': WorkspaceMember or None,
            #     'workspace_member_created': bool,
            #     'project_member': ProjectMember or None,
            #     'project_member_created': bool,
            # }
    """

    # Override email to be writable
    email = serializers.EmailField(required=True)

    # Add role field (not on User model, used for membership)
    role = serializers.ChoiceField(choices=["5", "15", "20"], default="15", required=False)

    class Meta(UserSerializer.Meta):
        fields = ["email", "display_name", "first_name", "last_name", "role"]
        read_only_fields = []  # Override to make all fields writable
        list_serializer_class = UserImportListSerializer  # Use custom list serializer for many=True

    def validate_email(self, value):
        """Normalize email to lowercase."""
        return value.lower().strip() if value else value

    def validate_role(self, value):
        """Convert role string to integer."""
        return int(value) if value else 15

    def validate(self, attrs):
        """Ensure workspace_id is in context."""
        if not self.context.get("workspace_id"):
            raise serializers.ValidationError("workspace_id is required in context")
        return attrs

    def _get_or_create_user(self, validated_data):
        """Get existing user or create new one."""
        email = validated_data["email"]

        user = User.objects.filter(email=email).first()
        if user:
            return user, False

        user = User.objects.create(
            email=email,
            username=uuid.uuid4().hex,
            display_name=validated_data.get("display_name") or email.split("@")[0],
            first_name=validated_data.get("first_name") or "",
            last_name=validated_data.get("last_name") or "",
            is_password_autoset=True,
        )
        return user, True

    def _get_or_create_member(self, model_class, user, role, **lookup_kwargs):
        """
        Get existing member or create new one.

        Args:
            model_class: WorkspaceMember or ProjectMember
            user: User instance
            role: Role integer
            **lookup_kwargs: e.g., workspace_id=X or project_id=Y
        """
        created_by_id = self.context.get("created_by_id")

        member, created = model_class.objects.get_or_create(
            member=user,
            **lookup_kwargs,
            defaults={
                "role": role,
                "created_by_id": created_by_id,
                "updated_by_id": created_by_id,
            },
        )
        return member, created

    def create(self, validated_data):
        """
        Create User, WorkspaceMember, and optionally ProjectMember.

        Returns dict with all created/fetched objects and creation status.
        """
        role = validated_data.pop("role", 15)
        workspace_id = self.context["workspace_id"]
        project_id = self.context.get("project_id")

        user, user_created = self._get_or_create_user(validated_data)

        workspace_member, wm_created = self._get_or_create_member(
            WorkspaceMember, user, role, workspace_id=workspace_id
        )

        project_member, pm_created = None, False
        if project_id:
            project_member, pm_created = self._get_or_create_member(ProjectMember, user, role, project_id=project_id)

        return {
            "user": user,
            "user_created": user_created,
            "workspace_member": workspace_member,
            "workspace_member_created": wm_created,
            "project_member": project_member,
            "project_member_created": pm_created,
        }
