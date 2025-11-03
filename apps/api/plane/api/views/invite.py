# Third party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiRequest,
    OpenApiParameter,
    OpenApiTypes,
)

# Module imports
from plane.api.views.base import BaseViewSet
from plane.db.models import WorkspaceMemberInvite, Workspace
from plane.api.serializers import WorkspaceInviteSerializer
from plane.utils.permissions import WorkspaceOwnerPermission
from plane.utils.openapi.parameters import WORKSPACE_SLUG_PARAMETER


class WorkspaceInvitationsViewset(BaseViewSet):
    """
    Endpoint for creating, listing and deleting workspace invites.
    """

    serializer_class = WorkspaceInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().filter(workspace__slug=self.kwargs.get("slug")))

    def get_object(self):
        return self.get_queryset().get(pk=self.kwargs.get("pk"))

    @extend_schema(
        summary="List workspace invites",
        description="List all workspace invites for a workspace",
        responses={
            200: OpenApiResponse(
                description="Workspace invites",
                response=WorkspaceInviteSerializer(many=True),
            )
        },
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
        ],
    )
    def list(self, request, slug):
        workspace_member_invites = self.get_queryset()
        serializer = WorkspaceInviteSerializer(workspace_member_invites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Get workspace invite",
        description="Get a workspace invite by ID",
        responses={200: OpenApiResponse(description="Workspace invite", response=WorkspaceInviteSerializer)},
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            OpenApiParameter(
                name="pk",
                description="Workspace invite ID",
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def retrieve(self, request, slug, pk):
        workspace_member_invite = self.get_object()
        serializer = WorkspaceInviteSerializer(workspace_member_invite)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create workspace invite",
        description="Create a workspace invite",
        responses={201: OpenApiResponse(description="Workspace invite", response=WorkspaceInviteSerializer)},
        request=OpenApiRequest(request=WorkspaceInviteSerializer),
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
        ],
    )
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceInviteSerializer(data=request.data, context={"slug": slug})
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=workspace, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Update workspace invite",
        description="Update a workspace invite",
        responses={200: OpenApiResponse(description="Workspace invite", response=WorkspaceInviteSerializer)},
        request=OpenApiRequest(request=WorkspaceInviteSerializer),
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            OpenApiParameter(
                name="pk",
                description="Workspace invite ID",
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def partial_update(self, request, slug, pk):
        workspace_member_invite = self.get_object()
        if request.data.get("email"):
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Email cannot be updated after invite is created.", "code": "EMAIL_CANNOT_BE_UPDATED"},
            )
        serializer = WorkspaceInviteSerializer(
            workspace_member_invite, data=request.data, partial=True, context={"slug": slug}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete workspace invite",
        description="Delete a workspace invite",
        responses={204: OpenApiResponse(description="Workspace invite deleted")},
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            OpenApiParameter(
                name="pk",
                description="Workspace invite ID",
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
            ),
        ],
    )
    def destroy(self, request, slug, pk):
        workspace_member_invite = self.get_object()
        if workspace_member_invite.accepted:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Invite already accepted", "code": "INVITE_ALREADY_ACCEPTED"},
            )
        if workspace_member_invite.responded_at:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Invite already responded", "code": "INVITE_ALREADY_RESPONDED"},
            )
        workspace_member_invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
