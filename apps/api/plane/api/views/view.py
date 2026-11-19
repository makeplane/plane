# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
API endpoints for managing saved views (IssueView) in the public REST API.
"""

from django.db.models import Exists, OuterRef, Q
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import IssueViewSerializer
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission, WorkspaceEntityPermission
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.db.models import IssueView, Project, ProjectMember, UserFavorite, UserRecentVisit, Workspace, WorkspaceMember
from plane.utils.openapi import (
    CURSOR_PARAMETER,
    EXPAND_PARAMETER,
    FIELDS_PARAMETER,
    PER_PAGE_PARAMETER,
    create_paginated_response,
    view_docs,
    workspace_view_docs,
)


class IssueViewListCreateAPIEndpoint(BaseAPIView):
    """Project-level saved view list and create API endpoint."""

    model = IssueView
    serializer_class = IssueViewSerializer
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Return accessible project views ordered by favorite status and name."""
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="view",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            IssueView.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("project", "workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )

    @view_docs(
        operation_id="list_project_views",
        summary="List project views",
        description="Retrieve all saved views accessible to the user in a project.",
        parameters=[CURSOR_PARAMETER, PER_PAGE_PARAMETER, FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: create_paginated_response(
                IssueViewSerializer,
                "PaginatedProjectViewResponse",
                "Paginated list of project views",
                "Paginated Project Views",
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List accessible project views."""
        project = Project.objects.filter(id=project_id, workspace__slug=slug, archived_at__isnull=True).first()
        if not project:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        queryset = self.get_queryset()
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda views: IssueViewSerializer(
                views, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @view_docs(
        operation_id="create_project_view",
        summary="Create project view",
        description="Create a new named saved view for a project.",
        request=OpenApiRequest(request=IssueViewSerializer),
        responses={
            201: OpenApiResponse(description="View created", response=IssueViewSerializer),
            400: OpenApiResponse(description="Invalid request payload"),
            404: OpenApiResponse(description="Project not found"),
        },
    )
    def post(self, request, slug, project_id):
        """Create a new project saved view."""
        project = Project.objects.filter(id=project_id, workspace__slug=slug, archived_at__isnull=True).first()
        if not project:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project.id,
                workspace_id=project.workspace_id,
                owned_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueViewDetailAPIEndpoint(BaseAPIView):
    """Project-level saved view detail, update, and delete API endpoint."""

    model = IssueView
    serializer_class = IssueViewSerializer
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Return accessible project views."""
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="view",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            IssueView.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("project", "workspace")
            .annotate(is_favorite=Exists(subquery))
            .distinct()
        )

    @view_docs(
        operation_id="retrieve_project_view",
        summary="Retrieve project view",
        description="Retrieve details of a specific saved view in a project.",
        parameters=[FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(description="View details", response=IssueViewSerializer),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve a specific project saved view."""
        issue_view = self.get_queryset().filter(pk=pk, project_id=project_id).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        project = Project.objects.filter(id=project_id).first()
        if (
            project
            and ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and issue_view.owned_by_id != request.user.id
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            recent_visited_task.delay(
                slug=slug,
                project_id=project_id,
                entity_name="view",
                entity_identifier=pk,
                user_id=request.user.id,
            )
        except Exception:
            pass

        serializer = self.serializer_class(issue_view, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @view_docs(
        operation_id="update_project_view",
        summary="Update project view",
        description="Partially update an existing project saved view.",
        request=OpenApiRequest(request=IssueViewSerializer),
        responses={
            200: OpenApiResponse(description="View updated", response=IssueViewSerializer),
            400: OpenApiResponse(description="Invalid payload or locked view"),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Partially update a project saved view."""
        issue_view = IssueView.objects.filter(pk=pk, project_id=project_id, workspace__slug=slug).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if issue_view.is_locked:
            return Response({"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST)

        if issue_view.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the owner of the view can update the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.serializer_class(issue_view, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @view_docs(
        operation_id="delete_project_view",
        summary="Delete project view",
        description="Permanently delete a project saved view.",
        responses={
            204: OpenApiResponse(description="View deleted successfully"),
            400: OpenApiResponse(description="Only admin or owner can delete"),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete a project saved view."""
        issue_view = IssueView.objects.filter(pk=pk, project_id=project_id, workspace__slug=slug).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = ProjectMember.objects.filter(
            workspace__slug=slug, project_id=project_id, member=request.user, role=20, is_active=True
        ).exists()

        if is_admin or issue_view.owned_by_id == request.user.id:
            issue_view.delete()
            UserFavorite.objects.filter(
                project_id=project_id, workspace__slug=slug, entity_identifier=pk, entity_type="view"
            ).delete()
            UserRecentVisit.objects.filter(
                project_id=project_id, workspace__slug=slug, entity_identifier=pk, entity_name="view"
            ).delete(soft=False)
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {"error": "Only admin or owner can delete the view"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WorkspaceViewListCreateAPIEndpoint(BaseAPIView):
    """Workspace-level saved view list and create API endpoint."""

    model = IssueView
    serializer_class = IssueViewSerializer
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Return accessible workspace views."""
        return (
            IssueView.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .order_by("-created_at")
            .distinct()
        )

    @workspace_view_docs(
        operation_id="list_workspace_views",
        summary="List workspace views",
        description="Retrieve all global views in a workspace accessible to the user.",
        parameters=[CURSOR_PARAMETER, PER_PAGE_PARAMETER, FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: create_paginated_response(
                IssueViewSerializer,
                "PaginatedWorkspaceViewResponse",
                "Paginated list of workspace views",
                "Paginated Workspace Views",
            ),
        },
    )
    def get(self, request, slug):
        """List accessible workspace views."""
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda views: IssueViewSerializer(
                views, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @workspace_view_docs(
        operation_id="create_workspace_view",
        summary="Create workspace view",
        description="Create a new named global saved view for a workspace.",
        request=OpenApiRequest(request=IssueViewSerializer),
        responses={
            201: OpenApiResponse(description="View created", response=IssueViewSerializer),
            400: OpenApiResponse(description="Invalid request payload"),
            404: OpenApiResponse(description="Workspace not found"),
        },
    )
    def post(self, request, slug):
        """Create a new workspace saved view."""
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project=None,
                owned_by=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspaceViewDetailAPIEndpoint(BaseAPIView):
    """Workspace-level saved view detail, update, and delete API endpoint."""

    model = IssueView
    serializer_class = IssueViewSerializer
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Return accessible workspace views."""
        return (
            IssueView.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .distinct()
        )

    @workspace_view_docs(
        operation_id="retrieve_workspace_view",
        summary="Retrieve workspace view",
        description="Retrieve details of a specific global workspace view.",
        parameters=[FIELDS_PARAMETER, EXPAND_PARAMETER],
        responses={
            200: OpenApiResponse(description="View details", response=IssueViewSerializer),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def get(self, request, slug, pk):
        """Retrieve a specific workspace saved view."""
        issue_view = self.get_queryset().filter(pk=pk).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(issue_view, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @workspace_view_docs(
        operation_id="update_workspace_view",
        summary="Update workspace view",
        description="Partially update a global workspace view.",
        request=OpenApiRequest(request=IssueViewSerializer),
        responses={
            200: OpenApiResponse(description="View updated", response=IssueViewSerializer),
            400: OpenApiResponse(description="Invalid payload or locked view"),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def patch(self, request, slug, pk):
        """Partially update a workspace saved view."""
        issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug, project__isnull=True).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if issue_view.is_locked:
            return Response({"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST)

        if issue_view.owned_by_id != request.user.id:
            return Response(
                {"error": "Only the owner of the view can update the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.serializer_class(issue_view, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @workspace_view_docs(
        operation_id="delete_workspace_view",
        summary="Delete workspace view",
        description="Permanently delete a global workspace view.",
        responses={
            204: OpenApiResponse(description="View deleted successfully"),
            400: OpenApiResponse(description="Only admin or owner can delete"),
            404: OpenApiResponse(description="View not found"),
        },
    )
    def delete(self, request, slug, pk):
        """Delete a workspace saved view."""
        issue_view = IssueView.objects.filter(pk=pk, workspace__slug=slug, project__isnull=True).first()
        if not issue_view:
            return Response({"error": "The requested resource does not exist."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = WorkspaceMember.objects.filter(
            workspace__slug=slug, member=request.user, role=20, is_active=True
        ).exists()

        if is_admin or issue_view.owned_by_id == request.user.id:
            issue_view.delete()
            UserFavorite.objects.filter(
                workspace__slug=slug, entity_identifier=pk, project__isnull=True, entity_type="view"
            ).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {"error": "Only admin or owner can delete the view"},
            status=status.HTTP_400_BAD_REQUEST,
        )
