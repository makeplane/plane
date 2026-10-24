# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiExample, OpenApiRequest, OpenApiResponse

from plane.api.serializers import ProjectPageCreateSerializer, ProjectPageListSerializer
from plane.app.permissions import ProjectPagePermission
from plane.db.models import Page, Project
from plane.utils.openapi import (
    CURSOR_PARAMETER,
    PROJECT_ID_PARAMETER,
    PROJECT_NOT_FOUND_RESPONSE,
    VALIDATION_ERROR_RESPONSE,
    create_paginated_response,
    project_docs,
)

from .base import BaseAPIView


PROJECT_PAGE_CREATE_EXAMPLE = {
    "name": "Release notes",
    "description_html": "<p>Public release notes for the project.</p>",
    "access": Page.PUBLIC_ACCESS,
    "color": "#2563eb",
}


PROJECT_PAGE_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Release notes",
    "access": Page.PUBLIC_ACCESS,
    "color": "#2563eb",
    "owned_by": "550e8400-e29b-41d4-a716-446655440001",
    "workspace": "550e8400-e29b-41d4-a716-446655440002",
    "parent": None,
    "is_locked": False,
    "archived_at": None,
    "created_at": "2026-01-15T12:00:00Z",
    "updated_at": "2026-01-15T12:00:00Z",
}


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

    @project_docs(
        operation_id="list_project_pages",
        summary="List project Pages",
        description="Retrieve metadata for visible, active top-level Pages in one project.",
        tags=["Pages"],
        parameters=[PROJECT_ID_PARAMETER, CURSOR_PARAMETER],
        responses={
            200: create_paginated_response(
                ProjectPageListSerializer,
                "PaginatedProjectPageResponse",
                "Paginated list of project Pages",
                "Paginated project Pages",
            ),
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda pages: ProjectPageListSerializer(pages, many=True).data,
        )

    @project_docs(
        operation_id="create_project_page",
        summary="Create project Page",
        description="Create one active Page in the URL project. Ownership and workspace are derived from the API key and URL.",
        tags=["Pages"],
        parameters=[PROJECT_ID_PARAMETER],
        request=OpenApiRequest(
            request=ProjectPageCreateSerializer,
            examples=[OpenApiExample(name="Create project Page", value=PROJECT_PAGE_CREATE_EXAMPLE)],
        ),
        responses={
            201: OpenApiResponse(
                description="Project Page created",
                response=ProjectPageListSerializer,
                examples=[OpenApiExample(name="Created project Page", value=PROJECT_PAGE_EXAMPLE)],
            ),
            400: VALIDATION_ERROR_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
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
