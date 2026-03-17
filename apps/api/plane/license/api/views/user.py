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

# Django imports
from django.db.models import Exists, OuterRef, Q, Count, Value, CharField
from django.db.models.functions import Concat, Coalesce
from django.contrib.auth.hashers import make_password
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status
import uuid

# Module imports
from plane.license.api.serializers import InstanceUserSerializer, InstanceAdminCreateSerializer
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import User, Profile, WorkspaceMember, ProjectMember, WorkspaceMemberInvite, Session
from plane.ee.models import TeamspaceMember, PageUser
from plane.license.models import Instance, InstanceAdmin
from plane.utils.cache import invalidate_cache
from plane.payment.bgtasks.member_sync_task import enterprise_member_sync_task, member_sync_task
from plane.utils.host import base_host
from plane.bgtasks.user_deactivation_email_task import user_deactivation_email
from plane.license.api.views.base import BaseAPIView


class InstanceUserManagementViewSet(BaseAPIView):
    "For managing all users in the instance"

    serializer_class = InstanceUserSerializer
    model = User
    permission_classes = [InstanceAdminPermission]
    search_fields = ["email", "display_name", "first_name", "last_name"]

    def get_queryset(self):
        instance = Instance.objects.first()

        return User.objects.filter(is_bot=False).annotate(
            is_instance_admin=Exists(
                InstanceAdmin.objects.filter(instance=instance, user=OuterRef("pk"))
            ),
            workspace_count=Count("member_workspace", filter=Q(member_workspace__is_active=True), distinct=True),
        )

    def get(self, request):
        queryset = self.get_queryset()

        # Apply search
        search = request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(display_name__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        # Handling sorting
        order_by_param = request.query_params.get("order_by", "-is_active")

        # Validate and sanitize sorting
        valid_sort_fields = {
            "email",
            "display_name",
            "full_name",
            "created_at",
            "is_instance_admin",
            "workspace_count",
            "is_active",
        }

        # Validate and apply sorting
        field_name = order_by_param.lstrip("-")
        if field_name in valid_sort_fields:
            # Handle full_name sorting by concatenating first_name and last_name
            if field_name == "full_name":
                queryset = queryset.annotate(
                    full_name_sort=Concat(
                        Coalesce("first_name", Value("")),
                        Value(" "),
                        Coalesce("last_name", Value("")),
                        output_field=CharField(),
                    )
                )
                # Apply ordering based on direction
                if order_by_param.startswith("-"):
                    queryset = queryset.order_by("-full_name_sort")
                else:
                    queryset = queryset.order_by("full_name_sort")
            else:
                queryset = queryset.order_by(order_by_param)
        else:
            queryset = queryset.order_by("-is_active")

        # Paginate
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda users: InstanceUserSerializer(users, many=True).data,
        )

    @invalidate_cache(path="/api/instances/users/", user=False)
    def post(self, request):
        serializer = InstanceAdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data["email"]

        # Get instance
        instance = Instance.objects.first()
        if instance is None:
            return Response({"error": "Instance is not registered yet"}, status=status.HTTP_403_FORBIDDEN)

        first_name = email.split("@")[0]

        # Create user
        user = User.objects.create(
            email=email,
            username=uuid.uuid4().hex,
            password=make_password(data["password"]),
            first_name=first_name,
            is_password_reset_required=data["is_password_reset_required"],
            is_active=True,
        )

        Profile.objects.create(user=user)

        # Register as instance admin
        InstanceAdmin.objects.create(instance=instance, user=user)

        # Let's run the member sync task to update the new user in all
        # workspaces (he won't be added as a member but this will create
        # the cache for the user)
        enterprise_member_sync_task.delay()

        return Response({"message": "Instance admin created successfully"}, status=status.HTTP_201_CREATED)

    @invalidate_cache(path="/api/instances/users/", user=False)
    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_active=True)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        instance = Instance.objects.first()

        # Check if user is current user
        if user == request.user:
            return Response(
                {
                    "error": "You cannot deactivate your own account",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user in instance admin
        is_admin = InstanceAdmin.objects.filter(instance=instance, user=user).exists()

        if is_admin:
            # Prevent last admin deletion
            admin_count = InstanceAdmin.objects.filter(instance=instance).count()
            if admin_count <= 1:
                return Response(
                    {
                        "error": "Cannot deactivate the last instance admin",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Remove the instance admin
            InstanceAdmin.objects.filter(instance=instance, user=user).delete(soft=False)

        # Remove user from workspaces
        workspace_memberships_to_deactivate = WorkspaceMember.objects.filter(member=user, is_active=True)
        # Capture workspace slugs before update, since the lazy queryset
        # will re-evaluate against the updated rows and return no results.
        workspace_slugs = list(workspace_memberships_to_deactivate.values_list("workspace__slug", flat=True))
        workspace_memberships_to_deactivate.update(is_active=False, updated_at=timezone.now())

        # Remove user from projects
        ProjectMember.objects.filter(member=user, is_active=True).update(is_active=False, updated_at=timezone.now())

        # Remove user from the teamspaces he is part of
        TeamspaceMember.objects.filter(member=user).delete()

        # Remove user from all the pages he is part of
        PageUser.objects.filter(user=user).delete()

        # Sync workspace members
        for slug in workspace_slugs:
            member_sync_task.delay(slug)

        # Delete all workspace invites
        WorkspaceMemberInvite.objects.filter(email=user.email).delete()

        # Delete all session for the user
        Session.objects.filter(user_id=user.id).delete()

        # Reset profile onboarding
        profile = Profile.objects.get(user=user)

        profile.last_workspace_id = None
        profile.is_tour_completed = False
        profile.is_onboarded = False
        profile.onboarding_step = {
            "workspace_join": False,
            "profile_complete": False,
            "workspace_create": False,
            "workspace_invite": False,
        }
        profile.save()

        # Reset password
        user.is_password_autoset = True
        user.set_password(uuid.uuid4().hex)

        # Deactivate the user
        user.is_active = False
        user.save()

        # Send email to the user
        user_deactivation_email.delay(base_host(request=request, is_app=True), user.id)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(path="/api/instances/users/", user=False)
    def patch(self, request, pk):
        """
        Update the role of a user in the instance (admin or user)
        """
        try:
            user = User.objects.get(pk=pk, is_active=True)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        instance = Instance.objects.first()

        # Check if user is current user
        if user.id == request.user.id:
            return Response(
                {"error": "You cannot change your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        role = request.data.get("role")
        if role not in ["admin", "user"]:
            return Response(
                {"error": "Invalid role. Must be 'admin' or 'user'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_admin = InstanceAdmin.objects.filter(instance=instance, user=user).exists()

        if role == "admin" and not is_admin:
            # Promote to instance admin
            InstanceAdmin.objects.create(instance=instance, user=user)
        elif role == "user" and is_admin:
            # Prevent demoting the last admin
            admin_count = InstanceAdmin.objects.filter(instance=instance).count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot demote the last instance admin"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            InstanceAdmin.objects.filter(instance=instance, user=user).delete(soft=False)

        return Response({"message": "Role updated successfully"}, status=status.HTTP_200_OK)
