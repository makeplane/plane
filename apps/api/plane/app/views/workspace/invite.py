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
from datetime import datetime
import jwt

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceOwnerPermission
from plane.app.serializers import (
    WorkSpaceMemberInviteSerializer,
    WorkSpaceMemberSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.bgtasks.event_tracking_task import track_event
from plane.bgtasks.workspace_invitation_task import workspace_invitation
from plane.db.models import User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.utils.cache import invalidate_cache, invalidate_cache_directly
from plane.utils.host import base_host
from plane.utils.analytics_events import USER_JOINED_WORKSPACE, USER_INVITED_TO_WORKSPACE
from plane.payment.bgtasks.member_sync_task import member_sync_task
from .. import BaseViewSet
from plane.payment.utils.member_payment_count import workspace_member_check
from plane.ee.bgtasks.workspace_member_activities_task import workspace_members_activity


class WorkspaceInvitationsViewset(BaseViewSet):
    """Endpoint for creating, listing and  deleting workspaces"""

    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [WorkspaceOwnerPermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner", "created_by")
        )

    def create(self, request, slug):
        emails = request.data.get("emails", [])
        # Check if email is provided
        if not emails:
            return Response({"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST)

        # check for role level of the requesting user
        requesting_user = WorkspaceMember.objects.get(workspace__slug=slug, member=request.user, is_active=True)

        # Check if any invited user has an higher role
        if len([email for email in emails if int(email.get("role", 5)) > requesting_user.role]):
            return Response(
                {"error": "You cannot invite a user with higher role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace object
        workspace = Workspace.objects.get(slug=slug)

        # Check if user is already a member of workspace
        workspace_members = WorkspaceMember.objects.filter(
            workspace_id=workspace.id,
            member__email__in=[email.get("email") for email in emails],
            is_active=True,
        ).select_related("member", "member__avatar_asset")

        if workspace_members:
            return Response(
                {
                    "error": "Some users are already member of workspace",
                    "workspace_users": WorkSpaceMemberSerializer(workspace_members, many=True).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get current existing workspace invitations where accepted is False
        allowed, _, _ = workspace_member_check(
            slug=slug,
            requested_invite_list=emails,
            requested_role=False,
            current_role=False,
        )

        if not allowed:
            return Response(
                {"error": "Reached seat limit - Upgrade to add more members"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                workspace_invitations.append(
                    WorkspaceMemberInvite(
                        email=email.get("email").strip().lower(),
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {"email": email, "timestamp": datetime.now().timestamp()},
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=email.get("role", 5),
                        created_by=request.user,
                    )
                )
            except ValidationError:
                return Response(
                    {
                        "error": f"Invalid email - {email} provided a valid email address is required to send the invite"  # noqa: E501
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # Create workspace member invite
        workspace_invitations = WorkspaceMemberInvite.objects.bulk_create(
            workspace_invitations, batch_size=10, ignore_conflicts=True
        )

        current_site = base_host(request=request, is_app=True)

        # Send invitations
        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                current_site,
                request.user.email,
            )
            track_event.delay(
                user_id=request.user.id,
                event_name=USER_INVITED_TO_WORKSPACE,
                workspace_slug=slug,
                event_properties={
                    "user_id": request.user.id,
                    "workspace_id": workspace.id,
                    "workspace_slug": workspace.slug,
                    "invitee_role": invitation.role,
                    "invited_at": str(timezone.now()),
                    "invitee_email": invitation.email,
                },
            )

        for email in emails:
            workspace_members_activity.delay(
                type="workspace_member.activity.invited",
                requested_data={"email": email.get("email").strip().lower()},
                current_instance=None,
                actor_id=request.user.id,
                workspace_id=workspace.id,
                epoch=int(timezone.now().timestamp()),
                notification=True,
            )

        return Response({"message": "Emails sent successfully"}, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(pk=pk, workspace__slug=slug)
        # Check if the role is being updated
        if "role" in request.data:
            allowed, _, _ = workspace_member_check(
                slug=slug,
                requested_role=request.data["role"],
                current_role=workspace_member_invite.role,
                requested_invite_list=[],
            )
            if not allowed:
                return Response(
                    {"error": "You cannot change the role the user as it will exceed the purchased limit"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().partial_update(request, slug, pk)

    def destroy(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(pk=pk, workspace__slug=slug)
        workspace_member_invite.delete()

        workspace_members_activity.delay(
            type="workspace_member.activity.invitation_deleted",
            requested_data={"email": workspace_member_invite.email},
            current_instance=None,
            actor_id=request.user.id,
            workspace_id=workspace_member_invite.workspace.id,
            epoch=int(timezone.now().timestamp()),
            notification=True,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceJoinEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    """Invitation response endpoint the user can respond to the invitation"""

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    @invalidate_cache(
        path="/api/workspaces/:slug/members/",
        user=False,
        multiple=True,
        url_params=True,
    )
    @invalidate_cache(path="/api/users/me/settings/", multiple=True)
    def post(self, request, slug, pk):
        workspace_invite = WorkspaceMemberInvite.objects.get(pk=pk, workspace__slug=slug)

        token = request.data.get("token", "")

        # Validate the token to verify the user received the invitation email
        if not token or workspace_invite.token != token:
            return Response(
                {"error": "You do not have permission to join the workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If already responded then return error
        if workspace_invite.responded_at is None:
            workspace_invite.accepted = request.data.get("accepted", False)
            workspace_invite.responded_at = timezone.now()
            workspace_invite.save()

            if workspace_invite.accepted:
                # Check if the user created account after invitation
                user = User.objects.filter(email=workspace_invite.email).first()

                # If the user is present then create the workspace member
                if user is not None:
                    # Check if the user was already a member of workspace then activate the user
                    workspace_member = WorkspaceMember.objects.filter(
                        workspace=workspace_invite.workspace, member=user
                    ).first()
                    if workspace_member is not None:
                        workspace_member.is_active = True
                        workspace_member.role = workspace_invite.role
                        workspace_member.save()
                    else:
                        # Create a Workspace
                        _ = WorkspaceMember.objects.create(
                            workspace=workspace_invite.workspace,
                            member=user,
                            role=workspace_invite.role,
                        )

                    # Set the user last_workspace_id to the accepted workspace
                    user.last_workspace_id = workspace_invite.workspace.id
                    user.save()
                    track_event.delay(
                        user_id=user.id,
                        event_name=USER_JOINED_WORKSPACE,
                        workspace_slug=slug,
                        event_properties={
                            "user_id": user.id,
                            "workspace_id": workspace_invite.workspace.id,
                            "workspace_slug": workspace_invite.workspace.slug,
                            "role": workspace_invite.role,
                            "joined_at": str(timezone.now()),
                        },
                    )

                    # Delete the invitation
                    workspace_invite.delete()

                # sync workspace members
                member_sync_task.delay(slug)

                return Response(
                    {"message": "Workspace Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            # Workspace invitation rejected
            return Response(
                {"message": "Workspace Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug, pk):
        workspace_invitation = WorkspaceMemberInvite.objects.get(workspace__slug=slug, pk=pk)
        serializer = WorkSpaceMemberInviteSerializer(workspace_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkspaceInvitationsViewSet(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super().get_queryset().filter(email=self.request.user.email).select_related("workspace")
        )

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    def create(self, request):
        invitations = request.data.get("invitations", [])
        workspace_invitations = WorkspaceMemberInvite.objects.filter(
            pk__in=invitations, email=request.user.email
        ).order_by("-created_at")

        workspace_members_to_create = []
        # If the user is already a member of workspace and was deactivated then activate the user
        for invitation in workspace_invitations:
            invalidate_cache_directly(
                path=f"/api/workspaces/{invitation.workspace.slug}/members/",
                user=False,
                request=request,
                multiple=True,
            )

            # Update the WorkspaceMember for this specific invitation
            WorkspaceMember.objects.filter(workspace_id=invitation.workspace_id, member=request.user).update(
                is_active=True, role=invitation.role
            )

            # Track event
            track_event.delay(
                user_id=request.user.id,
                event_name=USER_JOINED_WORKSPACE,
                workspace_slug=invitation.workspace.slug,
                event_properties={
                    "user_id": request.user.id,
                    "workspace_id": invitation.workspace.id,
                    "workspace_slug": invitation.workspace.slug,
                    "role": invitation.role,
                    "joined_at": str(timezone.now()),
                },
            )

            # Bulk create the user for all the workspaces
            workspace_members_to_create.append(
                WorkspaceMember(
                    workspace=invitation.workspace,
                    member=request.user,
                    role=invitation.role,
                    created_by=request.user,
                )
            )

        WorkspaceMember.objects.bulk_create(
            workspace_members_to_create,
            ignore_conflicts=True,
        )

        # Sync workspace members
        [member_sync_task.delay(invitation.workspace.slug) for invitation in workspace_invitations]

        for invitation in workspace_invitations:
            workspace_members_activity.delay(
                type="workspace_member.activity.joined",
                requested_data=None,
                current_instance=None,
                actor_id=request.user.id,
                workspace_id=invitation.workspace.id,
                epoch=int(timezone.now().timestamp()),
                notification=True,
            )

        # Delete joined workspace invites
        workspace_invitations.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
