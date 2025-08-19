from plane.api.views.base import BaseAPIView
from plane.db.models import Page, DeployBoard, Project, ProjectMember
from plane.ee.serializers.api import PageDetailAPISerializer
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
