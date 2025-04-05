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
from plane.db.models import (
    User,
    Workspace,
    Project,
    WorkspaceMember,
    ProjectMember,
    Profile
)

from plane.app.permissions import (
    ProjectMemberPermission,
)


# API endpoint to get and insert users inside the workspace
class ProjectMemberAPIEndpoint(BaseAPIView):
    permission_classes = [
        ProjectMemberPermission,
    ]

    # Get all the users that are present inside the workspace
    def get(self, request, slug, project_id, member_id=None):
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member_id:
            # Check if the user is a member of the project in the workspace
            if not ProjectMember.objects.filter(
                project_id=project_id, 
                workspace__slug=slug,
                member_id=member_id
            ).exists():
                return Response(
                    {"error": "User is not a member of this project"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
            # Get the user details
            try:
                user = User.objects.get(id=member_id)
                serialized_user = UserLiteSerializer(user).data
                return Response(serialized_user, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response(
                    {"error": "User does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Get the workspace members that are present inside the workspace
            project_members = ProjectMember.objects.filter(
                project_id=project_id, workspace__slug=slug
            ).values_list("member_id", flat=True)

            # Get all the users that are present inside the workspace
            users = UserLiteSerializer(
                User.objects.filter(
                    id__in=project_members,
                ),
                many=True,
            ).data

        return Response(users, status=status.HTTP_200_OK)

    # Insert a new user inside the workspace, and assign the user to the project
    def post(self, request, slug, project_id):
        # Check if user with email already exists, and send bad request if it's
        # not present, check for workspace and valid project mandat
        # ------------------- Validation -------------------
        if (
            request.data.get("email") is None
        ):
            return Response(
                {
                    "error": "Expected email, workspace_slug, project_id, one or more of the fields are missing."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email")
        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Invalid email provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(slug=slug).first()
        project = Project.objects.filter(pk=project_id).first()

        if not all([workspace, project]):
            return Response(
                {"error": "Provided workspace or project does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user exists
        user = User.objects.filter(email=email.lower()).first()
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
                        {
                            "error": "User is already part of the workspace and project"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # If user does not exist, create the user
        user_data = {
                "email": email,
                "display_name": request.data.get("display_name"),
                "first_name": request.data.get("first_name", ""),
                "last_name": request.data.get("last_name", ""),
                "role": request.data.get("role", 15),
            }
        if not user:
            user = self.create_user(user_data)
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.last_workspace_id = workspace.id
            profile.onboarding_step.update({
                'profile_complete': True,
                'workspace_join': True
            })
            profile.is_tour_completed = True
            profile.is_onboarded = True
            profile.company_name = workspace.name
            profile.save()

        if not workspace_member:
            self.create_workspace_member(workspace.id, user, role=user_data.get("role"))
            

        if not project_member:
            self.create_project_member(project.id, user, role=user_data.get("role"))

        
        # Serialize the user and return the response
        user_data = UserLiteSerializer(user).data

        return Response(user_data, status=status.HTTP_201_CREATED)

    def create_user(self, data):
        user = User.objects.create(
            email=data.get("email"),
            display_name=data.get("display_name"),
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            username=data.get("username", uuid.uuid4().hex),
            password=make_password(data.get("username", uuid.uuid4().hex)),
            is_password_autoset=False,
            is_active=False,
        )
        user.save()
        return user

        # Create a workspace member for the user if not already a member
    def create_workspace_member(self, workspace_id, user, role=15):
            workspace_member = WorkspaceMember.objects.create(
                workspace_id=workspace_id,
                member=user,
                role=role
            )
            workspace_member.save()

    def create_project_member(self, project_id, user, role=15):
        # Create a project member for the user if not already a member
        project_member = ProjectMember.objects.create(
            project_id=project_id,
            member=user,
            role=role
        )
        project_member.save()