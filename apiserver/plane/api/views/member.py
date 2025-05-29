# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
    OpenApiResponse,
)

# Module imports
from .base import BaseAPIView
from plane.api.serializers import UserLiteSerializer
from plane.db.models import User, Workspace, WorkspaceMember, ProjectMember
from plane.app.permissions import ProjectMemberPermission, WorkSpaceAdminPermission
from plane.utils.openapi_spec_helpers import (
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
)


class WorkspaceMemberAPIEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    @extend_schema(
        operation_id="get_workspace_members",
        tags=["Workspaces"],
        parameters=[
            OpenApiParameter(
                name="slug",
                description="Workspace slug",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
            ),
        ],
        summary="Get all the users that are present inside the workspace",
        description="Get all the users that are present inside the workspace",
        responses={
            200: OpenApiResponse(
                description="List of workspace members with their roles",
                response={
                    "type": "array",
                    "items": {
                        "allOf": [
                            {"$ref": "#/components/schemas/UserLite"},
                            {
                                "type": "object",
                                "properties": {
                                    "role": {
                                        "type": "integer",
                                        "description": "Member role in the workspace",
                                    }
                                },
                            },
                        ]
                    },
                },
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: OpenApiResponse(description="Workspace not found"),
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug):
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_members = WorkspaceMember.objects.filter(
            workspace__slug=slug
        ).select_related("member")

        # Get all the users with their roles
        users_with_roles = []
        for workspace_member in workspace_members:
            user_data = UserLiteSerializer(workspace_member.member).data
            user_data["role"] = workspace_member.role
            users_with_roles.append(user_data)

        return Response(users_with_roles, status=status.HTTP_200_OK)


# API endpoint to get and insert users inside the workspace
class ProjectMemberAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectMemberPermission]

    @extend_schema(
        operation_id="get_project_members",
        tags=["Projects"],
        parameters=[
            OpenApiParameter(
                name="slug",
                description="Workspace slug",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
            ),
            OpenApiParameter(
                name="project_id",
                description="Project ID",
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
            ),
        ],
        summary="Get all the users that are present inside the project",
        description="Get all the users that are present inside the project",
        responses={
            200: OpenApiResponse(
                description="List of project members with their roles",
                response=UserLiteSerializer,
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: OpenApiResponse(description="Project not found"),
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug, project_id):
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace members that are present inside the workspace
        project_members = ProjectMember.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values_list("member_id", flat=True)

        # Get all the users that are present inside the workspace
        users = UserLiteSerializer(
            User.objects.filter(id__in=project_members), many=True
        ).data

        return Response(users, status=status.HTTP_200_OK)
