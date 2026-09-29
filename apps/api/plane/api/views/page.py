# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import ProjectPageCreateSerializer, ProjectPageListSerializer
from plane.app.permissions import ProjectPagePermission
from plane.db.models import Page, Project

from .base import BaseAPIView


class ProjectPageListAPIEndpoint(BaseAPIView):
    """List project Pages visible to the authenticated API-key identity."""

    serializer_class = ProjectPageListSerializer
    permission_classes = [ProjectPagePermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.workspace_slug,
                project_pages__project_id=self.project_id,
                project_pages__deleted_at__isnull=True,
                project_pages__project__archived_at__isnull=True,
                archived_at__isnull=True,
                parent__isnull=True,
            )
            .filter(Q(access=Page.PUBLIC_ACCESS) | Q(owned_by=self.request.user))
            .select_related("workspace", "owned_by", "parent")
            .order_by("-created_at", "id")
            .distinct()
        )

    def get(self, request, slug, project_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda pages: ProjectPageListSerializer(pages, many=True).data,
        )

    def post(self, request, slug, project_id):
        project = Project.objects.get(
            id=project_id,
            workspace__slug=slug,
            archived_at__isnull=True,
        )
        serializer = ProjectPageCreateSerializer(
            data=request.data,
            context={"project": project, "user": request.user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page = serializer.save()
        return Response(ProjectPageListSerializer(page).data, status=status.HTTP_201_CREATED)
