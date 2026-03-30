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

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.models.workspace import WorkspaceLicense
from plane.db.models import User, WorkspaceMemberInvite
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkSpaceAdminPermission
from plane.payment.utils.member_payment_count import workspace_member_check


class WorkspaceInviteCheckEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkSpaceAdminPermission]

    def enterprise_plan_invite_check(self, slug: str):
        # Total purchased seats
        workspace_license = WorkspaceLicense.objects.filter(workspace__slug=slug).first()

        if workspace_license.plan == WorkspaceLicense.PlanChoice.ENTERPRISE:
            # Get the current total invited and current active users in the workspace
            current_active_users = User.objects.filter(is_active=True, is_bot=False).count()

            # Get the current total invited users in the workspace
            # Here check all the invites that does not have an active account right now
            current_invited_users = WorkspaceMemberInvite.objects.exclude(
                email__in=User.objects.filter(is_active=True, is_bot=False).values_list("email", flat=True)
            ).count()

            # Check if the total
            allowed_total_users = workspace_license.purchased_seats - (current_active_users + current_invited_users)

            return allowed_total_users
        else:
            return False

    def get(self, request, slug):
        # Check if someone could be invited to the workspace

        # Get the current invite list
        invite_allowed, allowed_members, allowed_guests = workspace_member_check(
            slug=slug,
            requested_invite_list=[],
            requested_role=False,
            current_role=False,
        )

        # Check if the workspace is on the enterprise plan
        allowed_total_users = self.enterprise_plan_invite_check(slug=slug)

        data = {
            "invite_allowed": invite_allowed,
            "allowed_admin_members": allowed_members,
            "allowed_guests": allowed_guests,
        }

        if allowed_total_users:
            data["allowed_total_users"] = allowed_total_users

        # Return the response
        return Response(
            data,
            status=status.HTTP_200_OK,
        )
