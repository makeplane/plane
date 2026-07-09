# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Exists, OuterRef

# Module imports
from .base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import User
from plane.license.models import InstanceAdmin
from plane.license.api.serializers import InstanceUserSerializer


class InstanceUserEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        users = User.objects.filter(is_bot=False).annotate(
            is_instance_admin=Exists(
                InstanceAdmin.objects.filter(user=OuterRef("pk"))
            )
        ).order_by("-date_joined")

        search = request.query_params.get("search", None)
        if search:
            users = users.filter(email__icontains=search) | users.filter(display_name__icontains=search)

        return self.paginate(
            request=request,
            queryset=users,
            on_results=lambda results: InstanceUserSerializer(results, many=True).data,
            max_per_page=50,
            default_per_page=50,
        )

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk, is_bot=False).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Only allow toggling is_active
        is_active = request.data.get("is_active")
        if is_active is None:
            return Response({"error": "is_active is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent admins from deactivating themselves
        if user.pk == request.user.pk and not is_active:
            return Response(
                {"error": "You cannot deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = bool(is_active)
        user.save(update_fields=["is_active"])

        return Response(InstanceUserSerializer(user).data, status=status.HTTP_200_OK)
