# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import secrets
import string

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers.user import (
    InstanceUserAddToWorkspaceSerializer,
    InstanceUserCreateSerializer,
    InstanceUserSerializer,
    InstanceUserUpdateSerializer,
    InstanceUserWorkspaceSerializer,
)
from plane.license.api.views.base import BaseAPIView


class InstanceUserEndpoint(BaseAPIView):
    """CRUD for users in instance admin."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk=None):
        if pk:
            return self._detail(request, pk)
        return self._list(request)

    def _list(self, request):
        """GET /api/instances/users/ — paginated list with search."""
        queryset = User.objects.all().order_by("-date_joined")

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(display_name__icontains=search)
            )

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda results: InstanceUserSerializer(results, many=True).data,
            default_per_page=20,
            max_per_page=100,
        )

    def _detail(self, request, pk):
        """GET /api/instances/users/<pk>/ — detail with workspace memberships."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user_data = InstanceUserSerializer(user).data
        memberships = WorkspaceMember.objects.filter(
            member=user, is_active=True
        ).select_related("workspace")
        user_data["workspaces"] = InstanceUserWorkspaceSerializer(memberships, many=True).data
        return Response(user_data, status=status.HTTP_200_OK)

    def post(self, request):
        """POST /api/instances/users/ — create user."""
        serializer = InstanceUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = User.objects.create(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),
            username=data["email"],
        )
        user.set_password(data["password"])
        user.is_password_autoset = False
        user.save()

        return Response(InstanceUserSerializer(user).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk=None):
        """PATCH /api/instances/users/<pk>/ — update user."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InstanceUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save()

        # Cascade deactivation
        if "is_active" in serializer.validated_data and not serializer.validated_data["is_active"]:
            WorkspaceMember.objects.filter(member=user, is_active=True).update(is_active=False)

        return Response(InstanceUserSerializer(user).data, status=status.HTTP_200_OK)


class InstanceUserResetPasswordEndpoint(BaseAPIView):
    """Reset user password — auto-generates random password."""

    permission_classes = [InstanceAdminPermission]

    def post(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Generate random 12-char password
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        new_password = "".join(secrets.choice(alphabet) for _ in range(12))

        user.set_password(new_password)
        user.is_password_autoset = True
        user.save()

        return Response({"password": new_password}, status=status.HTTP_200_OK)


class InstanceUserWorkspaceEndpoint(BaseAPIView):
    """Add user to workspace."""

    permission_classes = [InstanceAdminPermission]

    def post(self, request, pk=None):
        """POST /api/instances/users/<pk>/workspaces/ — add to workspace."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InstanceUserAddToWorkspaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = serializer.validated_data["workspace_id"]
        role = serializer.validated_data["role"]

        try:
            workspace = Workspace.objects.get(pk=workspace_id)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        membership, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=user,
            defaults={"role": role, "is_active": True},
        )

        if not created:
            if not membership.is_active:
                membership.is_active = True
                membership.role = role
                membership.save()
            else:
                return Response(
                    {"error": "User is already a member of this workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            InstanceUserWorkspaceSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )
