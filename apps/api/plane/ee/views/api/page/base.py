import base64

from plane.api.views.base import BaseAPIView
from plane.db.models import Page, DeployBoard, Project, ProjectMember, Workspace
from plane.ee.serializers.api import PageDetailAPISerializer, PageCreateAPISerializer
from plane.ee.permissions import WorkspacePagePermission, ProjectPagePermission
from plane.ee.utils.check_user_teamspace_member import (
    check_if_current_user_is_teamspace_member,
)
from plane.app.permissions import ROLE

# openapi imports
from plane.utils.openapi.decorators import page_docs
from plane.utils.openapi.parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    PAGE_ID_PARAMETER,
    PAGE_ANCHOR_PARAMETER,
)
from plane.utils.openapi.responses import UNAUTHORIZED_RESPONSE, NOT_FOUND_RESPONSE
from plane.utils.openapi.examples import SAMPLE_PAGE
from plane.bgtasks.copy_s3_object import sync_with_external_service
from plane.bgtasks.page_transaction_task import page_transaction
from plane.ee.bgtasks.page_update import nested_page_update, PageAction
from drf_spectacular.utils import OpenApiResponse

# Third party imports
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response


class ProjectPageDetailAPIEndpoint(BaseAPIView):
    model = Page
    serializer_class = PageDetailAPISerializer
    permission_classes = [ProjectPagePermission]

    def get_queryset(self):
        return Page.objects.filter(
            workspace__slug=self.kwargs["slug"], projects__id=self.kwargs["project_id"]
        )

    @page_docs(
        operation_id="get_project_page_detail",
        summary="Get a project page by ID",
        description="Get a project page by ID",
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER, PAGE_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page",
                response=PageDetailAPISerializer,
                examples=[SAMPLE_PAGE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        """
        if the role is guest and guest_view_all_features is false and owned by is not
        the requesting user then dont show the page
        """

        project = Project.objects.get(id=project_id)
        page = self.get_queryset().get(id=pk)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not page.owned_by == request.user
            and not check_if_current_user_is_teamspace_member(
                request.user.id, slug, project_id
            )
        ):
            return Response(
                {"error": "You are not allowed to view this page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.serializer_class(page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageDetailAPIEndpoint(BaseAPIView):
    model = Page
    serializer_class = PageDetailAPISerializer
    permission_classes = [WorkspacePagePermission]

    def get_queryset(self):
        return Page.objects.filter(workspace__slug=self.kwargs["slug"], is_global=True)

    @page_docs(
        operation_id="get_workspace_page_detail",
        summary="Get a workspace page by ID",
        description="Get a workspace page by ID",
        parameters=[WORKSPACE_SLUG_PARAMETER, PAGE_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page",
                response=PageDetailAPISerializer,
                examples=[SAMPLE_PAGE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, pk):
        page = self.get_queryset().get(id=pk)
        serializer = self.serializer_class(page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublishedPageDetailAPIEndpoint(BaseAPIView):
    model = Page
    serializer_class = PageDetailAPISerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeployBoard.objects.filter(
            entity_name="page", anchor=self.kwargs["anchor"]
        )

    @page_docs(
        operation_id="get_published_page_detail",
        summary="Get a published page by anchor",
        description="Get a published page by anchor",
        parameters=[PAGE_ANCHOR_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page",
                response=PageDetailAPISerializer,
                examples=[SAMPLE_PAGE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, anchor):
        deploy_board = self.get_queryset().get(anchor=anchor)
        is_page_anchor = (
            deploy_board.entity_name == "page"
            and deploy_board.entity_identifier is not None
        )
        if not deploy_board or not is_page_anchor:
            return Response(
                {"detail": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        page = Page.objects.get(id=deploy_board.entity_identifier)
        serializer = self.serializer_class(page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectPageAPIEndpoint(BaseAPIView):
    model = Page
    serializer_class = PageDetailAPISerializer
    permission_classes = [ProjectPagePermission]

    @page_docs(
        operation_id="create_project_page",
        summary="Create a project page",
        description="Create a project page",
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={
            201: OpenApiResponse(description="Page", response=PageDetailAPISerializer),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        description_html = request.data.get("description_html", "<p></p>")
        external_data = sync_with_external_service(
            entity_name="PAGE", description_html=description_html
        )
        workspace = Workspace.objects.get(slug=slug)

        serializer = PageCreateAPISerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
                "project_id": project_id,
                "owned_by_id": request.user.id,
                "description_html": description_html,
                "description_binary": (
                    base64.b64decode(external_data.get("description_binary"))
                    if external_data
                    else None
                ),
                "description": (
                    external_data.get("description", {}) if external_data else {}
                ),
            },
        )

        if serializer.is_valid():
            page = serializer.save()
            # capture the page transaction
            page_transaction.delay(request.data, None, page.id)
            if serializer.data.get("parent_id"):
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.SUB_PAGE,
                    project_id=project_id,
                    slug=slug,
                    user_id=request.user.id,
                )

            # Check parent access without additional query
            if page.parent_id and page.parent.access == Page.PRIVATE_ACCESS:
                page.owned_by_id = page.parent.owned_by_id
                page.save()
                # Re-serialize to get updated data
                serializer = self.serializer_class(page)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspacePageAPIEndpoint(BaseAPIView):
    serializer_class = PageDetailAPISerializer
    permission_classes = [WorkspacePagePermission]

    @page_docs(
        operation_id="create_workspace_page",
        summary="Create a workspace page",
        description="Create a workspace page",
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            201: OpenApiResponse(description="Page", response=PageDetailAPISerializer),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        description_html = request.data.get("description_html", "<p></p>")
        external_data = sync_with_external_service(
            entity_name="PAGE", description_html=description_html
        )
        serializer = PageCreateAPISerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
                "owned_by_id": request.user.id,
                "description_html": description_html,
                "description_binary": (
                    base64.b64decode(external_data.get("description_binary"))
                    if external_data
                    else None
                ),
                "description": (
                    external_data.get("description", {}) if external_data else {}
                ),
            },
        )

        if serializer.is_valid():
            page = serializer.save(is_global=True)
            # capture the page transaction
            page_transaction.delay(request.data, None, page.id)
            if serializer.data.get("parent_id"):
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.SUB_PAGE,
                    slug=slug,
                    user_id=request.user.id,
                )

            # Check parent access without additional query
            if page.parent_id and page.parent.access == Page.PRIVATE_ACCESS:
                page.owned_by_id = page.parent.owned_by_id
                page.save()
                # Re-serialize to get updated data
                serializer = self.serializer_class(page)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
