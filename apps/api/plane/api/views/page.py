# Django imports
from django.db.models import Exists, OuterRef, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import extend_schema

# Module imports
from plane.api.serializers import PageAPISerializer
from plane.app.permissions import ProjectPagePermission
from plane.db.models import Page, ProjectPage, UserFavorite, Project
from .base import BaseAPIView


class PageListCreateAPIEndpoint(BaseAPIView):
    """
    GET  /api/v1/workspaces/{slug}/projects/{project_id}/pages/
         List all pages in a project visible to the current user.

    POST /api/v1/workspaces/{slug}/projects/{project_id}/pages/
         Create a new page in the specified project.
    """

    permission_classes = [ProjectPagePermission]
    serializer_class = PageAPISerializer

    def get_queryset(self, slug, project_id):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=slug,
        )
        return (
            Page.objects.filter(workspace__slug=slug)
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(parent__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .filter(
                Exists(
                    ProjectPage.objects.filter(
                        page_id=OuterRef("id"),
                        project_id=project_id,
                    )
                )
            )
            .prefetch_related("projects")
            .select_related("workspace", "owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-created_at")
        )

    @extend_schema(
        responses={200: PageAPISerializer(many=True)},
        summary="List project pages",
        description="Returns all pages in a project visible to the current user.",
        tags=["Pages"],
    )
    def get(self, request, slug, project_id):
        pages = self.get_queryset(slug, project_id)
        serializer = PageAPISerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=PageAPISerializer,
        responses={201: PageAPISerializer},
        summary="Create a page",
        description="Creates a new page in the specified project.",
        tags=["Pages"],
    )
    def post(self, request, slug, project_id):
        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PageAPISerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        page = Page.objects.create(
            name=serializer.validated_data.get("name", ""),
            description_html=serializer.validated_data.get("description_html", ""),
            description_stripped=serializer.validated_data.get("description_stripped", ""),
            description=serializer.validated_data.get("description", {}),
            access=serializer.validated_data.get("access", 0),
            color=serializer.validated_data.get("color", ""),
            view_props=serializer.validated_data.get("view_props", {}),
            logo_props=serializer.validated_data.get("logo_props", {}),
            # Explicitly clear binary so the collab server reads description_html on next load
            description_binary=None,
            owned_by=request.user,
            workspace_id=project.workspace_id,
        )
        ProjectPage.objects.create(
            workspace_id=page.workspace_id,
            project_id=project_id,
            page_id=page.id,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(PageAPISerializer(page).data, status=status.HTTP_201_CREATED)


class PageDetailAPIEndpoint(BaseAPIView):
    """
    GET    /api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/
    PATCH  /api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/
    DELETE /api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/
    """

    permission_classes = [ProjectPagePermission]
    serializer_class = PageAPISerializer

    def get_page(self, slug, project_id, page_id):
        return (
            Page.objects.filter(
                workspace__slug=slug,
                projects__id=project_id,
                pk=page_id,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .first()
        )

    @extend_schema(
        responses={200: PageAPISerializer},
        summary="Get a page",
        description="Retrieve a single page by ID.",
        tags=["Pages"],
    )
    def get(self, request, slug, project_id, page_id):
        page = self.get_page(slug, project_id, page_id)
        if not page:
            return Response(
                {"error": "Page not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PageAPISerializer(page).data)

    @extend_schema(
        request=PageAPISerializer,
        responses={200: PageAPISerializer},
        summary="Update a page",
        description=(
            "Partially update a page. Cannot update locked pages. "
            "When description_html is updated, description_binary is reset so the "
            "collaborative editor reloads the content from the new HTML on next open."
        ),
        tags=["Pages"],
    )
    def patch(self, request, slug, project_id, page_id):
        page = self.get_page(slug, project_id, page_id)
        if not page:
            return Response(
                {"error": "Page not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if page.is_locked:
            return Response(
                {"error": "Page is locked and cannot be modified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PageAPISerializer(page, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # If the caller is updating description_html, reset description_binary so
        # the Tiptap/Yjs collab server picks up the new HTML on next document load
        # instead of serving stale binary state.
        save_kwargs = {"updated_by": request.user}
        if "description_html" in request.data:
            save_kwargs["description_binary"] = None

        serializer.save(**save_kwargs)
        return Response(serializer.data)

    @extend_schema(
        responses={204: None},
        summary="Delete a page",
        description="Delete a page. Only the page owner can perform this action.",
        tags=["Pages"],
    )
    def delete(self, request, slug, project_id, page_id):
        page = self.get_page(slug, project_id, page_id)
        if not page:
            return Response(
                {"error": "Page not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if page.owned_by != request.user:
            return Response(
                {"error": "Only the page owner can delete this page."},
                status=status.HTTP_403_FORBIDDEN,
            )
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
