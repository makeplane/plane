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
import requests

# Django imports
from django.conf import settings

# Model imports
from plane.db.models import User, WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense
from plane.payment.utils.workspace_license_request import resync_workspace_license
from plane.permissions.system_roles import is_paid_role_slug, UNPAID_ROLE_SLUGS
from plane.utils.exception_logger import log_exception


def count_member_payments(members_list):
    # Calculate the quantity of admin and member users based on the members list (paid role slugs)
    admin_member_users = sum(
        1 for member in members_list if is_paid_role_slug(member.get("user_role_slug", "guest"))
    )
    # Calculate the quantity of viewers and guest users based on the members list (unpaid role slugs)
    viewers_guest_users = sum(
        1 for member in members_list if not is_paid_role_slug(member.get("user_role_slug", "guest"))
    )

    # Get the workspace paid quantity that is the quantity of admin and member users
    workspace_paid_quantity = admin_member_users

    # If the viewers and guest users are more than 5 times the workspace paid quantity then
    # increase the workspace paid quantity by the difference
    if viewers_guest_users > 5 * workspace_paid_quantity:
        # Increase the workspace paid quantity by the difference
        workspace_paid_quantity += viewers_guest_users - 5 * workspace_paid_quantity

    return workspace_paid_quantity


def handle_free_plan_invite_case(slug, requested_invite_list, workspace_license):
    """This function handles the free plan invite case"""

    # Case 1a
    total_requested_invite_count = len(requested_invite_list)

    # Get the current total invited and current active users in the workspace
    current_active_users = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False
    ).count()

    # Get the current total invited users in the workspace
    current_invited_users = WorkspaceMemberInvite.objects.filter(workspace__slug=slug).count()

    # Check if the total
    if current_active_users + current_invited_users + total_requested_invite_count <= workspace_license.free_seats:
        return True, 0, 0
    else:
        return False, 0, 0


def handle_free_plan_update_case(slug, workspace_license):
    """This function handles the free plan update case"""
    # Case 1b
    # Allow update for all roles since the total count of current members and
    # invited members is less than or equal to workspace_license.free_seats
    return True, 0, 0


def handle_member_update_case(slug, workspace_license, requested_role_slug=None, current_role_slug=None):
    """Handle the member update case for the workspace"""
    # Get the current admin and member count
    active_admin_member_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False,
    ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

    # Get the current guest and viewer count
    active_guest_viewer_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
    ).count()

    # Get the requested invite emails
    invited_admin_members = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug,
    ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

    # Get the requested invited guest viewers
    invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
    ).count()

    # total admin member seats
    total_admin_member_seats = active_admin_member_count + invited_admin_members

    # total guest viewer seats
    total_guest_viewer_seats = active_guest_viewer_count + invited_guest_viewers

    # Check if the requested role is a paid role
    if is_paid_role_slug(requested_role_slug or "guest"):
        # Check the current role of the user if the user is already an admin or member the count does not change
        if is_paid_role_slug(current_role_slug or "guest"):
            return (total_admin_member_seats <= workspace_license.purchased_seats, 0, 0)
        else:
            return (
                total_admin_member_seats + 1 <= workspace_license.purchased_seats,
                0,
                0,
            )

    # Check if the requested role is guest or viewer
    if not is_paid_role_slug(requested_role_slug or "guest"):
        # Check the current role of the user if the user is already a guest or viewer the count does not change
        if not is_paid_role_slug(current_role_slug or "guest"):
            return (
                total_guest_viewer_seats <= 5 * workspace_license.purchased_seats,
                0,
                0,
            )
        else:
            return (
                total_guest_viewer_seats + 1 <= 5 * workspace_license.purchased_seats,
                0,
                0,
            )


def handle_member_invite_case(requested_invite_list, slug, workspace_license):
    """Handle the member invite case for the workspace"""
    # Case 2b i.
    # Get the requested invite emails — use role_slug if available, fall back to role numeric
    requested_invited_admin_members = sum(
        1 for invite in requested_invite_list if is_paid_role_slug(invite.get("role_slug", "guest"))
    )
    # Case the requested invite emails
    requested_invited_guest_viewers = sum(
        1 for invite in requested_invite_list if not is_paid_role_slug(invite.get("role_slug", "guest"))
    )

    # Get the current invited emails for the admin members
    check_admin_members = bool(requested_invited_admin_members)
    # Get the current invited emails for the guest viewers
    check_guest_viewers = bool(requested_invited_guest_viewers)

    # check admin members and guest viewers
    if check_admin_members and check_guest_viewers:
        # Get the current admin and member count
        active_admin_member_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False,
        ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()
        # Get the current invited admin members
        invited_admin_members = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug,
        ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

        # Get the current guest and viewer count
        active_guest_viewer_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
        ).count()

        # Get the  current invited guest viewers
        invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
        ).count()

        # Get the total admin member seats
        total_admin_member_seats = active_admin_member_count + invited_admin_members + requested_invited_admin_members

        # Get the total guest viewer seats
        total_guest_viewer_seats = active_guest_viewer_count + invited_guest_viewers + requested_invited_guest_viewers

        # Allowed admin members and guest viewers
        allowed_admin_members = total_admin_member_seats <= workspace_license.purchased_seats

        # Allowed guest viewers
        allowed_guest_viewers = total_guest_viewer_seats <= 5 * workspace_license.purchased_seats

        # Return the allowed admin members and guest viewers
        return bool(allowed_admin_members and allowed_guest_viewers), 0, 0

    # Should the check be done for the admin members
    if check_admin_members:
        # Get the current admin and member count
        active_admin_member_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False,
        ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()
        # Get the current invited admin members
        invited_admin_members = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug,
        ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

        # Get the total admin member seats
        total_admin_member_seats = active_admin_member_count + invited_admin_members + requested_invited_admin_members

        if total_admin_member_seats <= workspace_license.purchased_seats:
            return True, 0, 0
        else:
            return False, 0, 0

    # Should the check be done for the guest viewers
    if check_guest_viewers:
        # Get the current guest and viewer count
        active_guest_viewer_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
        ).count()

        # Get the  current invited guest viewers
        invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
        ).count()

        # Get the total guest viewer seats
        total_guest_viewer_seats = active_guest_viewer_count + invited_guest_viewers + requested_invited_guest_viewers

        if total_guest_viewer_seats <= 5 * workspace_license.purchased_seats:
            return True, 0, 0
        else:
            return False, 0, 0


def handle_invite_check_case(slug, workspace_license):
    # workspace invite check
    active_admin_member_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False,
    ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

    active_guest_viewer_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
    ).count()

    # Get the current workspace invite count
    current_invited_admin_members = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug,
    ).exclude(role_ref__slug__in=list(UNPAID_ROLE_SLUGS)).count()

    current_invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role_ref__slug__in=list(UNPAID_ROLE_SLUGS),
    ).count()

    # Get the total admin member seats
    purchased_seats = workspace_license.purchased_seats

    allowed_admin_members = max(0, purchased_seats - (active_admin_member_count + current_invited_admin_members))

    allowed_guest_viewers = max(
        0,
        5 * purchased_seats - (active_guest_viewer_count + current_invited_guest_viewers),
    )

    return (
        bool(allowed_admin_members or allowed_guest_viewers),
        allowed_admin_members,
        allowed_guest_viewers,
    )


def handle_enterprise_plan_invite_case(slug, requested_invite_list, workspace_license):
    """This function handles the free plan invite case"""

    # Case 1a
    total_requested_invite_count = len(requested_invite_list)

    # Get the current total invited and current active users in the workspace
    current_active_users = User.objects.filter(is_active=True, is_bot=False).count()

    # Get the current total invited users in the workspace
    # Here check all the invites that does not have an active account right now
    current_invited_users = WorkspaceMemberInvite.objects.exclude(
        email__in=User.objects.filter(is_active=True, is_bot=False).values_list("email", flat=True)
    ).count()

    # Check if the total
    if current_active_users + current_invited_users + total_requested_invite_count <= workspace_license.purchased_seats:
        return True, 0, 0
    else:
        return False, 0, 0


def handle_enterprise_plan_update_case(slug, workspace_license):
    """This function handles the enterprise plan update case"""
    # Allow update for all roles since the total count of current members and invited
    # members is less than or equal to workspace_license.purchased_seats
    return True, 0, 0


def handle_cloud_payments(
    slug, requested_invite_list, workspace_license, requested_role_slug=None, current_role_slug=None
):
    """
    Case1: Free Plan and Trial Plan
        a. Invitation case - requested_role_slug is None and requested_invite_list is a list of invite emails with roles
            - Allowed only if the total count of current users and invited users and requested invite users is less than or equal to workspace_license.free_seats
        b. Update case - requested_role_slug is a role slug and requested_invite_list is None
            - Allowed for all roles since the total count of current members and invited members is less than or equal to workspace_license.free_seats
    Case2: Paid Plan
        a. Online/Offline Payment case
            i. Invitation case - requested_role_slug is None and requested_invite_list is a list of invite emails with roles
                - Allowed only if the total count of paid current users and paid invited users and paid requested invite users is less than or equal to workspace_license.purchased_seats
            ii. Update case - requested_role_slug is a role slug and requested_invite_list is None
              - Allowed for paid roles if in the purchased seats limit and for unpaid roles (guest) if in the 5 * purchased seats limit
    """  # noqa: E501

    # Check the plan of the workspace license and trial
    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        # FREE Plan Case
        # Check Case 1a or Case 1b
        if requested_invite_list and not requested_role_slug:
            return handle_free_plan_invite_case(
                slug=slug,
                requested_invite_list=requested_invite_list,
                workspace_license=workspace_license,
            )
        else:
            # Case 1b
            # Allow update for all roles since the total count of current members and
            # invited members is less than or equal to workspace_license.free_seats
            return handle_free_plan_update_case(
                slug=slug,
                workspace_license=workspace_license,
            )

    else:
        # Case 2b i. or Case 2b ii.
        if requested_invite_list and not requested_role_slug:
            return handle_member_invite_case(
                requested_invite_list=requested_invite_list,
                slug=slug,
                workspace_license=workspace_license,
            )
        # Update case
        if requested_role_slug and not requested_invite_list:
            # Case 2b
            return handle_member_update_case(
                slug=slug,
                workspace_license=workspace_license,
                requested_role_slug=requested_role_slug,
                current_role_slug=current_role_slug,
            )

        if not requested_invite_list and not requested_role_slug:
            return handle_invite_check_case(slug=slug, workspace_license=workspace_license)


def handle_self_managed_payments(
    slug, requested_invite_list, workspace_license, requested_role_slug=None, current_role_slug=None
):
    """
    Handle the self managed payment cases
    """

    """
    Case1: Free Plan and One Time Payment Plan
        return True for all cases
    Case2: Subscription Plan
        a. Invitation case - requested_role_slug is None and requested_invite_list is a list of invite emails with roles
            - Allowed only if the total count of paid current users and paid invited users and paid requested invite users is less than or equal to workspace_license.purchased_seats
        b. Update case - requested_role_slug is a role slug and requested_invite_list is None
            - Allowed for paid roles if in the purchased seats limit and for unpaid roles (guest) if in the 5 * purchased seats limit
    """  # noqa: E501

    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        # Free Plan Case
        return True, 0, 0

    if workspace_license.plan == WorkspaceLicense.PlanChoice.ONE:
        # One Time Payment Plan Case
        return True, 0, 0

    # Subscription Plan Case
    if workspace_license.plan in [
        WorkspaceLicense.PlanChoice.PRO.value,
        WorkspaceLicense.PlanChoice.BUSINESS.value,
    ]:
        if requested_invite_list and not requested_role_slug:
            return handle_member_invite_case(
                requested_invite_list=requested_invite_list,
                slug=slug,
                workspace_license=workspace_license,
            )
        # Update case
        if requested_role_slug and not requested_invite_list:
            # Case 2b
            return handle_member_update_case(
                slug=slug,
                workspace_license=workspace_license,
                requested_role_slug=requested_role_slug,
                current_role_slug=current_role_slug,
            )

        if not requested_invite_list and not requested_role_slug:
            return handle_invite_check_case(slug=slug, workspace_license=workspace_license)

    # Enterprise plan case
    if workspace_license.plan == WorkspaceLicense.PlanChoice.ENTERPRISE:
        # Enterprise plan case
        if requested_invite_list and not requested_role_slug:
            return handle_enterprise_plan_invite_case(
                slug=slug,
                requested_invite_list=requested_invite_list,
                workspace_license=workspace_license,
            )
        if requested_role_slug and not requested_invite_list:
            return handle_enterprise_plan_update_case(
                slug=slug,
                workspace_license=workspace_license,
            )
        if not requested_invite_list and not requested_role_slug:
            return handle_enterprise_plan_invite_case(
                slug=slug,
                requested_invite_list=[],
                workspace_license=workspace_license,
            )


def workspace_member_check(slug, requested_invite_list=None, requested_role_slug=None, current_role_slug=None):
    """
    Check if member can be invited or role can be changed based on seat limits.
    """

    workspace_license = WorkspaceLicense.objects.filter(workspace__slug=slug).first()

    # If the workspace license is not found then resync the workspace license
    if not workspace_license:
        resync_workspace_license(workspace_slug=slug)
        workspace_license = WorkspaceLicense.objects.filter(workspace__slug=slug).first()

    if not settings.IS_SELF_MANAGED:
        return handle_cloud_payments(
            slug=slug,
            requested_invite_list=requested_invite_list,
            workspace_license=workspace_license,
            requested_role_slug=requested_role_slug,
            current_role_slug=current_role_slug,
        )
    else:
        return handle_self_managed_payments(
            slug=slug,
            requested_invite_list=requested_invite_list,
            workspace_license=workspace_license,
            requested_role_slug=requested_role_slug,
            current_role_slug=current_role_slug,
        )


def instance_member_check(requested_invites_list):
    """
    Check if seats are available for the license
    """
    # Self-managed instances
    if settings.PAYMENT_SERVER_BASE_URL:
        try:
            response = requests.get(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/current-plan/",
                headers={"content-type": "application/json", "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN},
            )

            response.raise_for_status()

            data = response.json()
            occupied_seats = User.objects.filter(
                is_active=True,
                is_bot=False,
            ).count()
            purchased_seats = data.get("purchased_seats", 0)

            return occupied_seats < purchased_seats
        except Exception as e:
            log_exception(e)
            return False
    else:
        return False
