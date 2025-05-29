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

from plane.app.permissions import ProjectMemberPermission, WorkSpaceAdminPermission


class WorkspaceMemberAPIEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

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
