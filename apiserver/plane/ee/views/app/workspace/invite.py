# Django imports
from django.db.models import F

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import WorkspaceMemberInvite
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.payment.utils.member_payment_count import (
    workspace_member_check,
)


class WorkspaceInviteCheckEndpoint(BaseAPIView):

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        # Check if someone could be invited to the workspace

        # Get the current invite list
        # Get current existing workspace invitations where accepted is False
        workspace_invitations = (
            WorkspaceMemberInvite.objects.filter(
                workspace__slug=slug,
            )
            .annotate(
                user_email=F("email"), user_id=F("id"), user_role=F("role")
            )
            .values("user_email", "user_id", "user_role")
        )

        invite_allowed, allowed_members, allowed_guests = (
            workspace_member_check(
                slug=slug,
                current_invite_list=workspace_invitations,
                requested_invite_list=[],
            )
        )

        # Return the response
        return Response(
            {
                "invite_allowed": invite_allowed,
                "allowed_members": allowed_members,
                "allowed_guests": allowed_guests,
            },
            status=status.HTTP_200_OK,
        )
