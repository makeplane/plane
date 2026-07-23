# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Count, OuterRef, Q, Subquery
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import User
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers import InstanceUserSerializer
from plane.license.models import InstanceAdmin

from .base import BaseAPIView


class InstanceUserEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get_queryset(self):
        instance_admin_role = InstanceAdmin.objects.filter(
            user_id=OuterRef("id"),
            deleted_at__isnull=True,
        ).values("role")[:1]
        return (
            User.objects.filter(is_bot=False)
            .annotate(
                workspace_count=Count(
                    "member_workspace",
                    filter=Q(
                        member_workspace__is_active=True,
                        member_workspace__is_instance_admin_access=False,
                    ),
                    distinct=True,
                ),
                instance_admin_role=Subquery(instance_admin_role),
            )
            .order_by("-created_at")
        )

    def get(self, request, pk=None):
        users = self.get_queryset()
        search = request.query_params.get("search", "").strip()
        if search:
            users = users.filter(
                Q(email__icontains=search)
                | Q(display_name__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        if pk is not None:
            user = users.filter(pk=pk).first()
            if user is None:
                return Response(status=status.HTTP_404_NOT_FOUND)
            return Response(InstanceUserSerializer(user).data, status=status.HTTP_200_OK)

        return self.paginate(
            request=request,
            queryset=users,
            on_results=lambda results: InstanceUserSerializer(results, many=True).data,
            default_per_page=25,
            max_per_page=100,
        )

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk, is_bot=False).first()
        if user is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return Response(
                {"error": "is_active must be a boolean"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user == request.user and not is_active:
            return Response(
                {"error": "You cannot deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if InstanceAdmin.objects.filter(user=user).exists():
            return Response(
                {"error": "Remove the instance admin role before deactivating this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.is_active = is_active
        user.save(update_fields=["is_active", "updated_at"])
        annotated_user = self.get_queryset().get(pk=user.pk)
        return Response(InstanceUserSerializer(annotated_user).data, status=status.HTTP_200_OK)
