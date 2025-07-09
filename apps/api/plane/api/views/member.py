# Python imports
import uuid

# Django imports
from django.contrib.auth.hashers import make_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from plane.api.serializers import UserLiteSerializer
from plane.db.models import User, Workspace, Project, WorkspaceMember, ProjectMember

from plane.app.permissions import ProjectMemberPermission


# API endpoint to get and insert users inside the workspace
class ProjectMemberAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectMemberPermission]

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

    # Insert a new user inside the workspace, and assign the user to the project
    def post(self, request, slug, project_id):
        # Check if user with email already exists, and send bad request if it's
        # not present, check for workspace and valid project mandat
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

        # Check if user exists
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

        # Serialize the user and return the response
        user_data = UserLiteSerializer(user).data

        return Response(user_data, status=status.HTTP_201_CREATED)
