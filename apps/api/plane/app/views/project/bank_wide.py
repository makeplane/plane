# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers, status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.base import DynamicBaseSerializer
from plane.app.views.base import BaseAPIView
from plane.app.views.ho import get_accessible_workspace_ids
from plane.db.models import Project, Workspace


class BankWideProjectSerializer(DynamicBaseSerializer):
    """Lean serializer for cross-workspace bank-wide project list."""

    workspace_slug = serializers.SerializerMethodField()
    workspace_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    def get_workspace_slug(self, obj):
        return obj.workspace.slug

    def get_workspace_name(self, obj):
        return obj.workspace.name

    def get_member_count(self, obj):
        return obj.project_projectmember.filter(is_active=True).count()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "identifier",
            "logo_props",
            "cover_image",
            "cover_image_url",
            "description",
            "network",
            "is_bank_wide",
            "created_at",
            "member_count",
            "workspace_slug",
            "workspace_name",
        ]


class WorkspaceBankWideProjectsEndpoint(BaseAPIView):
    """
    Returns all bank-wide projects across all workspaces.
    Only accessible from a Board of Director workspace.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        # Server-side guard: only BoD workspaces may call this endpoint
        workspace = Workspace.objects.filter(slug=slug).only("is_board_of_director_workspace").first()
        if not workspace or not workspace.is_board_of_director_workspace:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        # Scope to workspaces the user manages (department tree) or belongs to.
        # Instance admins see all workspaces; others see only their managed departments + descendants.
        accessible_workspace_ids = get_accessible_workspace_ids(request.user)

        projects = (
            Project.objects.filter(
                is_bank_wide=True,
                archived_at__isnull=True,
                workspace_id__in=accessible_workspace_ids,
            )
            .select_related("workspace")
            .prefetch_related("project_projectmember")
            .order_by("workspace__name", "name")
        )

        serializer = BankWideProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
