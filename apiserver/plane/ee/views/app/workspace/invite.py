# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.payment.utils.member_payment_count import workspace_member_check


class WorkspaceInviteCheckEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        # Check if someone could be invited to the workspace

        # Get the current invite list
        invite_allowed, allowed_members, allowed_guests = workspace_member_check(
            slug=slug,
            requested_invite_list=[],
            requested_role=False,
            current_role=False,
        )

        # Return the response
        return Response(
            {
                "invite_allowed": invite_allowed,
                "allowed_admin_members": allowed_members,
                "allowed_guests": allowed_guests,
            },
            status=status.HTTP_200_OK,
        )
