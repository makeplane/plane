# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import logging
import uuid

import requests as http_requests

# Django imports
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiRequest,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status

# Third Party imports
from rest_framework.response import Response

from plane.api.serializers import ProjectMemberSerializer, UserLiteSerializer
from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.db.models.workspace import ROLE as WORKSPACE_ROLE
from plane.ee.bgtasks.workspace_member_activities_task import workspace_members_activity
from plane.ee.models import PageUser, TeamspaceMember, TeamspaceProject, WorkspaceLicense
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.bgtasks.member_sync_task import member_sync_task
from plane.permissions import ProjectMemberPermissions, WorkspaceMemberPermissions, can
from plane.utils.exception_logger import log_exception
from plane.utils.oauth import (
    PROJECTS_MEMBERS_READ_SCOPE,
    PROJECTS_MEMBERS_WRITE_SCOPE,
    READ_SCOPE,
    WORKSPACES_MEMBERS_READ_SCOPE,
    WORKSPACES_MEMBERS_WRITE_SCOPE,
    WRITE_SCOPE,
)
from plane.utils.openapi import (
    FORBIDDEN_RESPONSE,
    PROJECT_ID_PARAMETER,
    PROJECT_MEMBER_EXAMPLE,
    PROJECT_NOT_FOUND_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    WORKSPACE_MEMBER_EXAMPLE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
)

from .base import ScopedBaseAPIView

logger = logging.getLogger("plane.api")


class WorkspaceMemberAPIEndpoint(ScopedBaseAPIView):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_MEMBERS_READ_SCOPE]],
    }
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
    @can(WorkspaceMemberPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
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

        workspace_members = WorkspaceMember.objects.filter(workspace__slug=slug).select_related("member")

        # Get all the users with their roles
        users_with_roles = []
        for workspace_member in workspace_members:
            user_data = UserLiteSerializer(workspace_member.member).data
            user_data["role"] = workspace_member.role
            users_with_roles.append(user_data)

        return Response(users_with_roles, status=status.HTTP_200_OK)


class ProjectMemberSiloEndpoint(ScopedBaseAPIView):
    # TODO: Remove this endpoint once the silo is updated to use the new endpoint

    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_MEMBERS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_MEMBERS_WRITE_SCOPE]],
    }
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
    @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
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
        # Get the workspace members that are present inside the project.
        project_members = list(
            ProjectMember.objects.filter(project_id=project_id, workspace__slug=slug, is_active=True).values_list(
                "member_id", flat=True
            )
        )

        # Teamspace members linked to this project can also be assigned work items,
        # so include them in the member list shown to integrations.
        if check_workspace_feature_flag(feature_key=FeatureFlag.TEAMSPACES, user_id=request.user.id, slug=slug):
            teamspace_ids = TeamspaceProject.objects.filter(project_id=project_id, workspace__slug=slug).values_list(
                "team_space_id", flat=True
            )
            teamspace_members = list(
                TeamspaceMember.objects.filter(team_space_id__in=teamspace_ids, member__is_active=True).values_list(
                    "member_id", flat=True
                )
            )
            project_members = list(set(project_members + teamspace_members))

        # Get all the users that are present inside the workspace
        users = UserLiteSerializer(User.objects.filter(id__in=project_members, is_active=True), many=True).data
        return Response(users, status=status.HTTP_200_OK)

    @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    def post(self, request, slug, project_id):
        # ------------------- Validation -------------------
        if request.data.get("email") is None or request.data.get("display_name") is None:
            return Response(
                {
                    "error": "Expected email, display_name, workspace_slug, project_id, one or more of the fields are missing."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email")

        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Invalid email provided"}, status=status.HTTP_400_BAD_REQUEST)

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
            workspace_member = WorkspaceMember.objects.filter(workspace=workspace, member=user).first()
            if workspace_member:
                # Check if user is part of the project
                project_member = ProjectMember.objects.filter(project=project, member=user).first()
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


class ProjectMemberListCreateAPIEndpoint(ScopedBaseAPIView):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_MEMBERS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_MEMBERS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_MEMBERS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [PROJECTS_MEMBERS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_MEMBERS_WRITE_SCOPE]],
    }
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
    @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
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
        project_members = ProjectMember.objects.filter(project_id=project_id, workspace__slug=slug).values_list(
            "member_id", flat=True
        )

        # Get all the users that are present inside the workspace
        users = UserLiteSerializer(User.objects.filter(id__in=project_members), many=True).data
        return Response(users, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="create_project_member",
        summary="Create project member",
        description="Create a new project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={201: OpenApiResponse(description="Project member created", response=ProjectMemberSerializer)},
        request=OpenApiRequest(request=ProjectMemberSerializer),
    )
    @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    def post(self, request, slug, project_id):
        serializer = ProjectMemberSerializer(data=request.data, context={"slug": slug})
        serializer.is_valid(raise_exception=True)
        serializer.save(project_id=project_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# API endpoint to get and update a project member
class ProjectMemberDetailAPIEndpoint(ProjectMemberListCreateAPIEndpoint):
    @extend_schema(
        operation_id="get_project_member",
        summary="Get project member",
        description="Retrieve a project member by ID.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={
            200: OpenApiResponse(description="Project member", response=ProjectMemberSerializer),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    @can(ProjectMemberPermissions.VIEW, resource_param="project_id")
    # Get a project member by ID
    def get(self, request, slug, project_id, pk):
        """Get project member

        Retrieve a project member by ID.
        Returns a project member with their project-specific roles and access levels.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace members that are present inside the workspace
        project_members = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        user = User.objects.get(id=project_members.member_id)
        user = UserLiteSerializer(user).data
        return Response(user, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_project_member",
        summary="Update project member",
        description="Update a project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={200: OpenApiResponse(description="Project member updated", response=ProjectMemberSerializer)},
        request=OpenApiRequest(request=ProjectMemberSerializer),
    )
    @can(ProjectMemberPermissions.CHANGE_ROLE, resource_param="project_id")
    def patch(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        serializer = ProjectMemberSerializer(project_member, data=request.data, partial=True, context={"slug": slug})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="delete_project_member",
        summary="Delete project member",
        description="Delete a project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={204: OpenApiResponse(description="Project member deleted")},
    )
    @can(ProjectMemberPermissions.REMOVE, resource_param="project_id")
    def delete(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        project_member.is_active = False
        project_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMemberRemoveEndpoint(ScopedBaseAPIView):
    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [WORKSPACES_MEMBERS_WRITE_SCOPE]],
    }

    @extend_schema(
        operation_id="remove_workspace_member",
        summary="Remove workspace member",
        description="Remove a member from the workspace, deactivate them from all projects, and reduce the seat count.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            204: OpenApiResponse(description="Member removed successfully"),
            400: OpenApiResponse(description="Validation error"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    @can(WorkspaceMemberPermissions.REMOVE, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug):
        """Remove workspace member

        Remove a member from the specified workspace. This deactivates the member
        from all projects, removes them from teamspaces and pages, syncs with the
        payment server, and reduces the purchased seat count.
        """

        email = request.data.get("email", False)
        remove_seat = request.data.get("remove_seat", False)

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Get the workspace member to be removed
        try:
            workspace_member = WorkspaceMember.objects.get(
                workspace__slug=slug, member__email=email, member__is_bot=False, is_active=True
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "Workspace member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the requesting user's workspace member record
        try:
            requesting_workspace_member = WorkspaceMember.objects.get(
                workspace__slug=slug, member=request.user, is_active=True
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Cannot remove yourself
        if str(workspace_member.id) == str(requesting_workspace_member.id):
            return Response(
                {"error": "You cannot remove yourself from the workspace. Please use leave workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot remove a member with a higher role
        if requesting_workspace_member.role < workspace_member.role:
            return Response(
                {"error": "You cannot remove a user having role higher than you"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot remove if user is the sole admin of any project
        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=workspace_member.member_id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "User is a part of some projects where they are the only admin, they should either leave that project or promote another user to admin."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the user from all projects
        ProjectMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id, is_active=True).update(
            is_active=False, updated_at=timezone.now()
        )

        # Deactivate the workspace member
        removed_member_name = workspace_member.member.display_name
        workspace_member.is_active = False
        workspace_member.save()

        # Remove from teamspaces and pages
        TeamspaceMember.objects.filter(workspace__slug=slug, member_id=workspace_member.member_id).delete()
        PageUser.objects.filter(workspace__slug=slug, user_id=workspace_member.member_id).delete()

        # Sync workspace members with the payment server
        member_sync_task.delay(slug)

        # Remove seats on the payment server if requested
        if remove_seat:
            # Reduce seats on the payment server
            self._reduce_seat(slug, request.user.id)

        # Log activity
        workspace_members_activity.delay(
            type="workspace_member.activity.removed",
            requested_data={"name": removed_member_name},
            current_instance=None,
            actor_id=request.user.id,
            workspace_id=workspace_member.workspace_id,
            epoch=int(timezone.now().timestamp()),
            notification=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _reduce_seat(self, slug, actor_id):
        """Reduce purchased seats to match current active paid members + invites."""
        try:
            if not settings.PAYMENT_SERVER_BASE_URL:
                return

            workspace_license = WorkspaceLicense.objects.filter(workspace__slug=slug).first()
            if not workspace_license or workspace_license.is_cancelled:
                return

            previous_purchased_seats = workspace_license.purchased_seats

            # Count active paid members (Admin/Member roles, i.e. role >= 15)
            workspace_member_count = WorkspaceMember.objects.filter(
                workspace__slug=slug, is_active=True, member__is_bot=False, role__gte=WORKSPACE_ROLE.MEMBER.value
            ).count()

            # Count pending invites for paid roles
            invited_member_count = WorkspaceMemberInvite.objects.filter(
                workspace__slug=slug, role__gte=WORKSPACE_ROLE.MEMBER.value
            ).count()

            required_seats = workspace_member_count + invited_member_count

            # No unused seats to remove
            if workspace_license.purchased_seats <= required_seats:
                logger.info(f"Workspace {slug} has no unused seats to remove.")
                return

            ## Just reduce one seat
            updated_seat_count = workspace_license.purchased_seats - 1

            workspace = Workspace.objects.get(slug=slug)

            # Call payment server to reduce seats
            response = http_requests.post(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/modify-seats/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
                json={
                    "workspace_id": str(workspace.id),
                    "quantity": updated_seat_count,
                    "workspace_slug": slug,
                },
            )
            response.raise_for_status()
            response_data = response.json()

            # Update local seat count
            workspace_license.purchased_seats = response_data["seats"]
            workspace_license.save()

            # Log seat removal activity
            workspace_members_activity.delay(
                type="workspace_member.activity.removed_unused_seats",
                requested_data={"required_seats": required_seats},
                current_instance={"purchased_seats": previous_purchased_seats},
                actor_id=actor_id,
                workspace_id=workspace.id,
                epoch=int(timezone.now().timestamp()),
                notification=True,
            )
            return
        except http_requests.exceptions.RequestException as e:
            log_exception(e)
            return
        except Exception as e:
            log_exception(e)
            return
