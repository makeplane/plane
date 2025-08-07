# Python imports
import uuid

# Django imports
from django.core.validators import validate_email
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError


# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
)

# Module imports
from .base import BaseAPIView
from plane.api.serializers import UserLiteSerializer
from plane.db.models import User, Workspace, WorkspaceMember, ProjectMember, Project
from plane.app.permissions import ProjectMemberPermission, WorkSpaceAdminPermission
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    PROJECT_NOT_FOUND_RESPONSE,
    WORKSPACE_MEMBER_EXAMPLE,
    PROJECT_MEMBER_EXAMPLE,
)

from plane.payment.bgtasks.member_sync_task import member_sync_task


class WorkspaceMemberAPIEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="get_workspace_members",
        summary="List workspace members",
        description="Retrieve all users who are members of the specified workspace.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
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
                examples=[WORKSPACE_MEMBER_EXAMPLE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug):
        """List workspace members

        Retrieve all users who are members of the specified workspace.
        Returns user profiles with their respective workspace roles and permissions.
        """
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
    use_read_replica = True

    @extend_schema(
        operation_id="get_project_members",
        summary="List project members",
        description="Retrieve all users who are members of the specified project.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="List of project members with their roles",
                response=UserLiteSerializer(many=True),
                examples=[PROJECT_MEMBER_EXAMPLE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug, project_id):
        """List project members

        Retrieve all users who are members of the specified project.
        Returns user profiles with their project-specific roles and access levels.
        """
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

    def post(self, request, slug, project_id):
        # ------------------- Validation -------------------
        if (
            request.data.get("email") is None
            or request.data.get("display_name") is None
        ):
            return Response(
                {
                    "error": "Expected email, display_name, workspace_slug, project_id, one or more of the fields are missing."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email")

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Invalid email provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.filter(slug=slug).first()
        project = Project.objects.filter(pk=project_id).first()

        if not all([workspace, project]):
            return Response(
                {"error": "Provided workspace or project does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()

        workspace_member = None
        project_member = None

        if user:
            # Check if user is part of the workspace
            workspace_member = WorkspaceMember.objects.filter(
                workspace=workspace, member=user
            ).first()
            if workspace_member:
                # Check if user is part of the project
                project_member = ProjectMember.objects.filter(
                    project=project, member=user
                ).first()
                if project_member:
                    return Response(
                        {"error": "User is already part of the workspace and project"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # If user does not exist, create the user
        if not user:
            user = User.objects.create(
                email=email,
                display_name=request.data.get("display_name"),
                first_name=request.data.get("first_name", ""),
                last_name=request.data.get("last_name", ""),
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
                is_active=False,
                avatar_asset_id=request.data.get("avatar_asset_id", None),
            )
            user.save()

        # Create a workspace member for the user if not already a member
        if not workspace_member:
            workspace_member = WorkspaceMember.objects.create(
                workspace=workspace, member=user, role=request.data.get("role", 5)
            )
            workspace_member.save()

        # Create a project member for the user if not already a member
        if not project_member:
            project_member = ProjectMember.objects.create(
                project=project, member=user, role=request.data.get("role", 5)
            )
            project_member.save()

        # Run the member sync task for the workspace
        member_sync_task.delay(workspace.slug)

        # Serialize the user and return the response
        user_data = UserLiteSerializer(user).data

        return Response(user_data, status=status.HTTP_201_CREATED)
