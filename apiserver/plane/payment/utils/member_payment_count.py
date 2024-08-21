# Model imports
from plane.db.models import WorkspaceMember
from plane.ee.models import WorkspaceLicense


def count_member_payments(members_list):
    """
    Count the quantity of admin and member users and calculate the workspace paid quantity based on the members list
    """

    # Calculate the quantity of admin and member users based on the members list that is roles greater than 10
    admin_member_users = len(
        [member for member in members_list if member.get("user_role") > 10]
    )
    # Calculate the quantity of viewers and guest users based on the members list that is roles less than or equal to 10
    viewers_guest_users = len(
        [member for member in members_list if member.get("user_role") <= 10]
    )

    # Get the workspace paid quantity that is the quantity of admin and member users
    workspace_paid_quantity = admin_member_users

    # If the viewers and guest users are more than 5 times the workspace paid quantity then increase the workspace paid quantity by the difference
    if viewers_guest_users > 5 * workspace_paid_quantity:
        # Increase the workspace paid quantity by the difference
        workspace_paid_quantity += (
            viewers_guest_users - 5 * workspace_paid_quantity
        )

    return workspace_paid_quantity


ALLOWED_FREE_USERS = 12


def workspace_member_check(current_invite_list, requested_invite_list, slug):
    """
    Check if can be invited based on the current members list and the current invite list
    """

    # Get the current invite emails
    current_invited_admin_members = len(
        [invite for invite in current_invite_list if invite.get("role") > 10]
    )
    current_invited_guest_viewers = len(
        [invite for invite in current_invite_list if invite.get("role") <= 10]
    )

    # Get the requested invite emails
    requested_invited_admin_members = len(
        [invite for invite in requested_invite_list if invite.get("role") > 10]
    )
    requested_invited_guest_viewers = len(
        [
            invite
            for invite in requested_invite_list
            if invite.get("role") <= 10
        ]
    )

    check_admin_members = bool(requested_invited_admin_members)
    check_guest_viewers = bool(requested_invited_guest_viewers)

    # Current invited admin members and guest viewers
    # current guest and viewers
    current_guest_viewers = WorkspaceMember.objects.filter(
        workspace__slug=slug,
        is_active=True,
        member__is_bot=False,
        role__lte=10,
    ).count()

    # current members and admins
    current_admin_members = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role__gt=10
    ).count()

    # Get the workspace licenses
    workspace_license = WorkspaceLicense.objects.filter(
        workspace__slug=slug
    ).first()

    # For the free plan the allowed users are only 12 including the viewer and guest users
    if (
        not workspace_license
        or workspace_license.plan == WorkspaceLicense.PlanChoice.FREE
    ):
        # This is the current workspace count
        current_workspace_count = current_admin_members + current_guest_viewers
        # The current invited count
        current_invited_count = (
            current_invited_admin_members + current_invited_guest_viewers
        )
        # The requested invited count
        requested_invited_count = (
            requested_invited_admin_members + requested_invited_guest_viewers
        )

        # The sum of all this should be less than or equal to 12
        status = (
            current_workspace_count
            + current_invited_count
            + requested_invited_count
            <= 12
        )

        # If the status is false then return the allowed invite count
        if not status:
            allowed_users = 12 - (
                current_workspace_count + current_invited_count
            )
            return status, max(0, allowed_users), max(0, allowed_users)
        else:
            return status, max(0, allowed_users), max(0, allowed_users)

    # For the paid plan the allowed users can be increased if the payment is not offline
    else:
        # Count the member payments
        if workspace_license.is_offline_payment:
            # Get the workspace members
            # If the workspace license is offline then the allowed members can be only less than or equal to the purchased seats
            purchased_seats = workspace_license.purchased_seats
            # Left over calculated seats
            left_over_admin_member_seats = (
                purchased_seats
                - current_admin_members
                - current_invited_admin_members
                - requested_invited_admin_members
            )

            left_over_guest_viewer_seats = (
                5 * purchased_seats
                - current_guest_viewers
                - current_invited_guest_viewers
                - requested_invited_guest_viewers
            )

            if check_admin_members:
                return (
                    left_over_admin_member_seats > 0,
                    max(left_over_admin_member_seats, 0),
                    max(left_over_guest_viewer_seats, 0),
                )

            if check_guest_viewers:
                return (
                    left_over_guest_viewer_seats > 0,
                    max(left_over_admin_member_seats, 0),
                    max(left_over_guest_viewer_seats, 0),
                )

            return (
                left_over_admin_member_seats > 0
                and left_over_guest_viewer_seats > 0,
                max(left_over_admin_member_seats, 0),
                max(left_over_guest_viewer_seats, 0),
            )
        else:
            return True, 1000, 1000
