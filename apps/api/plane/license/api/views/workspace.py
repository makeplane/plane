# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.db.models import OuterRef, Func, F, Exists

# Module imports
from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import (
    DEFAULT_CONTRACT_CATEGORY_NAME,
    FileCategory,
    Project,
    Workspace,
    WorkspaceFeature,
    WorkspaceMember,
)
from plane.license.api.serializers import WorkspaceSerializer
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class InstanceWorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        slug = request.GET.get("slug", False)

        if not slug or slug == "":
            return Response(
                {"error": "Workspace Slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(slug__iexact=slug).exists() or slug in RESTRICTED_WORKSPACE_SLUGS
        return Response({"status": not workspace}, status=status.HTTP_200_OK)


class InstanceWorkSpaceEndpoint(BaseAPIView):
    model = Workspace
    serializer_class = WorkspaceSerializer
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        project_count = (
            Project.objects.filter(workspace_id=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        member_count = (
            WorkspaceMember.objects.filter(workspace=OuterRef("id"), member__is_bot=False, is_active=True)
            .select_related("owner")
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        file_library_enabled = WorkspaceFeature.objects.filter(
            workspace_id=OuterRef("id"),
            key=WorkspaceFeature.FeatureKey.FILE_LIBRARY,
            is_enabled=True,
        )

        workspaces = Workspace.objects.annotate(
            total_projects=project_count,
            total_members=member_count,
            is_file_library_enabled=Exists(file_library_enabled),
        )

        # Add search functionality
        search = request.query_params.get("search", None)
        if search:
            workspaces = workspaces.filter(name__icontains=search)

        return self.paginate(
            request=request,
            queryset=workspaces,
            on_results=lambda results: WorkspaceSerializer(results, many=True).data,
            max_per_page=10,
            default_per_page=10,
        )

    def post(self, request):
        try:
            serializer = WorkspaceSerializer(data=request.data)

            slug = request.data.get("slug", False)
            name = request.data.get("name", False)

            if not name or not slug:
                return Response(
                    {"error": "Both name and slug are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(name) > 80 or len(slug) > 48:
                return Response(
                    {"error": "The maximum length for name is 80 and for slug is 48"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.is_valid(raise_exception=True):
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )


class InstanceWorkspaceFeatureEndpoint(BaseAPIView):
    """Manage per-workspace feature flags from the instance admin (god-mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, workspace_id):
        workspace = Workspace.objects.filter(id=workspace_id).first()
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        enabled_keys = set(
            WorkspaceFeature.objects.filter(workspace=workspace, is_enabled=True).values_list("key", flat=True)
        )
        features = {key: (key in enabled_keys) for key, _ in WorkspaceFeature.FeatureKey.choices}
        return Response(
            {"workspace_id": str(workspace.id), "features": features},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, workspace_id):
        workspace = Workspace.objects.filter(id=workspace_id).first()
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        key = request.data.get("key")
        is_enabled = request.data.get("is_enabled")

        valid_keys = {choice for choice, _ in WorkspaceFeature.FeatureKey.choices}
        if key not in valid_keys or not isinstance(is_enabled, bool):
            return Response(
                {"error": "A valid feature key and a boolean is_enabled are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feature, _ = WorkspaceFeature.objects.update_or_create(
            workspace=workspace, key=key, defaults={"is_enabled": is_enabled}
        )

        # Enabling the file library guarantees the protected default
        # "Contratos" category exists for the workspace.
        if key == WorkspaceFeature.FeatureKey.FILE_LIBRARY and is_enabled:
            FileCategory.objects.get_or_create(
                workspace=workspace,
                name=DEFAULT_CONTRACT_CATEGORY_NAME,
                defaults={"is_default": True, "pdf_only": True},
            )

        return Response(
            {"workspace_id": str(workspace.id), "key": feature.key, "is_enabled": feature.is_enabled},
            status=status.HTTP_200_OK,
        )
