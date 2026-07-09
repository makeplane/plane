# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiResponse

# Module imports
from plane.api.serializers import PageSerializer
from plane.app.permissions import ROLE, ProjectEntityPermission, WorkspacePagePermission
from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    UserFavorite,
    UserRecentVisit,
    Workspace,
)
from .base import BaseAPIView

# Query filters of the documented `type` parameter. `shared` (selective page
# sharing) is a paid feature with no CE equivalent: it always resolves to an
# empty list.
PAGE_TYPE_FILTERS = {
    "all": Q(),
    "public": Q(access=Page.PUBLIC_ACCESS, archived_at__isnull=True),
    "private": Q(access=Page.PRIVATE_ACCESS, archived_at__isnull=True),
    "archived": Q(archived_at__isnull=False),
}


def _apply_list_filters(request, queryset):
    """Apply the documented ``type`` and ``search`` query parameters.

    Returns ``(queryset, error_response)`` — one of the two is None.
    """
    page_type = request.query_params.get("type", "all")
    if page_type == "shared":
        # Selective page sharing does not exist in the Community Edition
        return queryset.none(), None
    if page_type not in PAGE_TYPE_FILTERS:
        return None, Response(
            {"error": "Invalid type parameter. Expected all, public, private, shared or archived."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    queryset = queryset.filter(PAGE_TYPE_FILTERS[page_type])

    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(name__icontains=search)

    return queryset, None


class WorkspacePageListCreateAPIEndpoint(BaseAPIView):
    """List the pages of the workspace wiki and create workspace pages (v1)."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [WorkspacePagePermission]

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                is_global=True,
                projects__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("owned_by")
            .prefetch_related("projects")
            .order_by("-created_at")
            .distinct()
        )

    @extend_schema(
        operation_id="list_workspace_pages",
        summary="List workspace pages",
        description="Retrieve the workspace (wiki) pages readable by the requester.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(description="Paginated list of workspace pages", response=PageSerializer),
        },
    )
    def get(self, request, slug):
        """List workspace pages

        Paginated listing of the workspace wiki pages readable by the
        requester (their own pages and the public ones). Supports the
        `type` (all|public|private|shared|archived) and `search` filters.
        """
        queryset, error = _apply_list_filters(request, self.get_queryset())
        if error is not None:
            return error
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True).data,
            default_per_page=20,
            max_per_page=100,
        )

    @extend_schema(
        operation_id="create_workspace_page",
        summary="Create a workspace page",
        description="Create a page in the workspace wiki (no project attachment).",
        tags=["Pages"],
        responses={
            201: OpenApiResponse(description="Workspace page created", response=PageSerializer),
        },
    )
    def post(self, request, slug):
        """Create a workspace page

        Create a page in the workspace wiki. The page is owned by the
        requester, flagged `is_global` and never linked to a project.
        """
        workspace = Workspace.objects.get(slug=slug)
        serializer = PageSerializer(data=request.data)
        if serializer.is_valid():
            page = serializer.save(
                workspace_id=workspace.id,
                owned_by=request.user,
                is_global=True,
            )
            return Response(PageSerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspacePageDetailAPIEndpoint(BaseAPIView):
    """Retrieve and delete a workspace page (v1)."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [WorkspacePagePermission]

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                is_global=True,
                projects__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("owned_by")
            .prefetch_related("projects")
            .distinct()
        )

    @extend_schema(
        operation_id="retrieve_workspace_page",
        summary="Retrieve a workspace page",
        description="Retrieve a single workspace (wiki) page.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(description="Workspace page", response=PageSerializer),
        },
    )
    def get(self, request, slug, page_id):
        """Retrieve a workspace page"""
        page = self.get_queryset().filter(pk=page_id).first()
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PageSerializer(page).data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="delete_workspace_page",
        summary="Delete a workspace page",
        description="Delete a workspace page. Owners can delete their own pages; workspace admins can delete any.",
        tags=["Pages"],
        responses={204: OpenApiResponse(description="Workspace page deleted")},
    )
    def delete(self, request, slug, page_id):
        """Delete a workspace page

        The permission matrix (owner, or workspace admin for someone else's
        page) is enforced by `WorkspacePagePermission`.
        """
        page = Page.objects.filter(is_global=True, projects__isnull=True).get(pk=page_id, workspace__slug=slug)

        # remove parent from all the children
        _ = Page.objects.filter(parent_id=page_id, workspace__slug=slug).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project__isnull=True,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()
        # Delete the page from recent visit
        UserRecentVisit.objects.filter(
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="workspace_page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPageListCreateAPIEndpoint(BaseAPIView):
    """List the pages of a project and create project pages (v1)."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("owned_by")
            .prefetch_related("projects")
            .order_by("-created_at")
            .distinct()
        )

    @extend_schema(
        operation_id="list_project_pages",
        summary="List project pages",
        description="Retrieve the pages of a project readable by the requester.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(description="Paginated list of project pages", response=PageSerializer),
        },
    )
    def get(self, request, slug, project_id):
        """List project pages

        Paginated listing of the project pages readable by the requester
        (their own pages and the public ones). Supports the `type`
        (all|public|private|shared|archived) and `search` filters.
        """
        queryset, error = _apply_list_filters(request, self.get_queryset())
        if error is not None:
            return error
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True).data,
            default_per_page=20,
            max_per_page=100,
        )

    @extend_schema(
        operation_id="create_project_page",
        summary="Create a project page",
        description="Create a page linked to a project.",
        tags=["Pages"],
        responses={
            201: OpenApiResponse(description="Project page created", response=PageSerializer),
        },
    )
    def post(self, request, slug, project_id):
        """Create a project page

        Create a page owned by the requester and linked to the project.
        """
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = PageSerializer(data=request.data)
        if serializer.is_valid():
            page = serializer.save(
                workspace_id=project.workspace_id,
                owned_by=request.user,
            )
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project.id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )
            return Response(PageSerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectPageDetailAPIEndpoint(BaseAPIView):
    """Retrieve and delete a project page (v1)."""

    serializer_class = PageSerializer
    model = Page
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                projects__id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("owned_by")
            .prefetch_related("projects")
            .distinct()
        )

    @extend_schema(
        operation_id="retrieve_project_page",
        summary="Retrieve a project page",
        description="Retrieve a single project page.",
        tags=["Pages"],
        responses={
            200: OpenApiResponse(description="Project page", response=PageSerializer),
        },
    )
    def get(self, request, slug, project_id, page_id):
        """Retrieve a project page"""
        page = self.get_queryset().filter(pk=page_id).first()
        if page is None:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PageSerializer(page).data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="delete_project_page",
        summary="Delete a project page",
        description="Delete a project page. Owners can delete their own pages; project admins can delete any.",
        tags=["Pages"],
        responses={204: OpenApiResponse(description="Project page deleted")},
    )
    def delete(self, request, slug, project_id, page_id):
        """Delete a project page

        Internal matrix: the owner or a project admin can delete the page. A
        private page owned by someone else is never disclosed (404).
        """
        page = Page.objects.get(
            pk=page_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_pages__deleted_at__isnull=True,
        )

        # Never disclose the existence of a private page owned by someone else
        if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != request.user.id:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        if page.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=ROLE.ADMIN.value,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # remove parent from all the children of the page within the project
        _ = Page.objects.filter(
            parent_id=page_id,
            projects__id=project_id,
            workspace__slug=slug,
            project_pages__deleted_at__isnull=True,
        ).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_type="page",
        ).delete()
        # Delete the page from recent visit
        UserRecentVisit.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            entity_identifier=page_id,
            entity_name="page",
        ).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
