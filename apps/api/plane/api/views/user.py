# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiExample, OpenApiResponse

# Module imports
from plane.api.serializers import UserLiteSerializer, WorkspaceLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User, Workspace, WorkspaceMember
from plane.utils.openapi.decorators import user_docs
from plane.utils.openapi import USER_EXAMPLE


class UserEndpoint(BaseAPIView):
    serializer_class = UserLiteSerializer
    model = User

    @user_docs(
        operation_id="get_current_user",
        summary="Get current user",
        description="Retrieve the authenticated user's profile information including basic details.",
        responses={
            200: OpenApiResponse(
                description="Current user profile",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
        },
    )
    def get(self, request):
        """Get current user

        Retrieve the authenticated user's profile information including basic details.
        Returns user data based on the current authentication context.
        """
        serializer = UserLiteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkspacesEndpoint(BaseAPIView):
    serializer_class = WorkspaceLiteSerializer
    model = Workspace
    use_read_replica = True

    @user_docs(
        operation_id="list_current_user_workspaces",
        summary="List current user's workspaces",
        description=(
            "List the workspaces the authenticated token can access, returning the id, name, "
            "and slug of each workspace the user is an active member of. Useful for discovering "
            "the workspace slug required by other API endpoints."
        ),
        responses={
            200: OpenApiResponse(
                description="List of workspaces accessible to the current token",
                response=WorkspaceLiteSerializer(many=True),
                examples=[
                    OpenApiExample(
                        name="Workspaces",
                        value=[
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "name": "My Workspace",
                                "slug": "my-workspace",
                            }
                        ],
                    )
                ],
            ),
        },
    )
    def get(self, request):
        """List current user's workspaces

        List the workspaces the authenticated token can access, returning the id, name, and
        slug of each workspace the user is an active member of. Useful for discovering the
        workspace slug required by other API endpoints.
        """
        workspace_ids = WorkspaceMember.objects.filter(
            member=request.user, is_active=True
        ).values_list("workspace_id", flat=True)
        workspaces = Workspace.objects.filter(id__in=workspace_ids).order_by("name")
        serializer = WorkspaceLiteSerializer(workspaces, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
