# Django imports
from django.conf import settings

# Model imports
from plane.db.models import WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense
from plane.payment.utils.workspace_license_request import resync_workspace_license


def count_member_payments(members_list):
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
    current_invited_users = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug
    ).count()

    # Check if the total
    if (
        current_active_users + current_invited_users + total_requested_invite_count
        <= workspace_license.free_seats
    ):
        return True, 0, 0
    else:
        return False, 0, 0


def handle_free_plan_update_case(slug, requested_role, workspace_license):
    """This function handles the free plan update case"""
    # Case 1b
    # Allow update for all roles since the total count of current members and invited members is less than or equal to workspace_license.free_seats
    return True, 0, 0


def handle_member_update_case(requested_role, slug, workspace_license, current_role):
    """Handle the member update case for the workspace"""
    # Get the current admin and member count
    active_admin_member_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role__gt=10
    ).count()

    # Get the current guest and viewer count
    active_guest_viewer_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role__lte=10
    ).count()

    # Get the requested invite emails
    invited_admin_members = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role__gt=10
    ).count()

    # Get the requested invited guest viewers
    invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role__lte=10
    ).count()

    # total admin member seats
    total_admin_member_seats = active_admin_member_count + invited_admin_members

    # total guest viewer seats
    total_guest_viewer_seats = active_guest_viewer_count + invited_guest_viewers

    # Check if the requested role is admin
    if int(requested_role) > 10:
        # Check the current role of the user if the user is already an admin or member the count does not change
        if current_role > 10:
            return (total_admin_member_seats <= workspace_license.purchased_seats, 0, 0)
        else:
            return (
                total_admin_member_seats + 1 <= workspace_license.purchased_seats,
                0,
                0,
            )

    #  Check if the requested role is guest or viewer
    if int(requested_role) <= 10:
        # Check the current role of the user if the user is already a guest or viewer the count does not change
        if current_role <= 10:
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
    # Get the requested invite emails
    requested_invited_admin_members = len(
        [invite for invite in requested_invite_list if invite.get("role") > 10]
    )
    # Case the requested invite emails
    requested_invited_guest_viewers = len(
        [invite for invite in requested_invite_list if invite.get("role") <= 10]
    )

    # Get the current invited emails for the admin members
    check_admin_members = bool(requested_invited_admin_members)
    # Get the current invited emails for the guest viewers
    check_guest_viewers = bool(requested_invited_guest_viewers)

    # check admin members and guest viewers
    if check_admin_members and check_guest_viewers:
        # Get the current admin and member count
        active_admin_member_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role__gt=10
        ).count()
        # Get the current invited admin members
        invited_admin_members = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role__gt=10
        ).count()

        # Get the current guest and viewer count
        active_guest_viewer_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role__lte=10
        ).count()

        # Get the  current invited guest viewers
        invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role__lte=10
        ).count()

        # Get the total admin member seats
        total_admin_member_seats = (
            active_admin_member_count
            + invited_admin_members
            + requested_invited_admin_members
        )

        # Get the total guest viewer seats
        total_guest_viewer_seats = (
            active_guest_viewer_count
            + invited_guest_viewers
            + requested_invited_guest_viewers
        )

        # Allowed admin members and guest viewers
        allowed_admin_members = (
            total_admin_member_seats <= workspace_license.purchased_seats
        )

        # Allowed guest viewers
        allowed_guest_viewers = (
            total_guest_viewer_seats <= 5 * workspace_license.purchased_seats
        )

        # Return the allowed admin members and guest viewers
        return bool(allowed_admin_members and allowed_guest_viewers), 0, 0

    # Should the check be done for the admin members
    if check_admin_members:
        # Get the current admin and member count
        active_admin_member_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role__gt=10
        ).count()
        # Get the current invited admin members
        invited_admin_members = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role__gt=10
        ).count()

        # Get the total admin member seats
        total_admin_member_seats = (
            active_admin_member_count
            + invited_admin_members
            + requested_invited_admin_members
        )

        if total_admin_member_seats <= workspace_license.purchased_seats:
            return True, 0, 0
        else:
            return False, 0, 0

    # Should the check be done for the guest viewers
    if check_guest_viewers:
        # Get the current guest and viewer count
        active_guest_viewer_count = WorkspaceMember.objects.filter(
            workspace__slug=slug, is_active=True, member__is_bot=False, role__lte=10
        ).count()

        # Get the  current invited guest viewers
        invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
            workspace__slug=slug, role__lte=10
        ).count()

        # Get the total guest viewer seats
        total_guest_viewer_seats = (
            active_guest_viewer_count
            + invited_guest_viewers
            + requested_invited_guest_viewers
        )

        if total_guest_viewer_seats <= 5 * workspace_license.purchased_seats:
            return True, 0, 0
        else:
            return False, 0, 0


def handle_invite_check_case(slug, workspace_license):
    # workspace invite check
    active_admin_member_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role__gt=10
    ).count()

    active_guest_viewer_count = WorkspaceMember.objects.filter(
        workspace__slug=slug, is_active=True, member__is_bot=False, role__lte=10
    ).count()

    # Get the current workspace invite count
    current_invited_admin_members = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role__gt=10
    ).count()

    current_invited_guest_viewers = WorkspaceMemberInvite.objects.filter(
        workspace__slug=slug, role__lte=10
    ).count()

    # Get the total admin member seats
    purchased_seats = workspace_license.purchased_seats

    allowed_admin_members = max(
        0, purchased_seats - (active_admin_member_count + current_invited_admin_members)
    )

    allowed_guest_viewers = max(
        0,
        5 * purchased_seats
        - (active_guest_viewer_count + current_invited_guest_viewers),
    )

    return (
        bool(allowed_admin_members or allowed_guest_viewers),
        allowed_admin_members,
        allowed_guest_viewers,
    )


def handle_cloud_payments(
    slug, requested_invite_list, requested_role, workspace_license, current_role
):
    """
    Case1: Free Plan and Trial Plan
        a. Invitation case - requested_role is None and requested_invite_list is a list of invite emails with roles
            - Allowed only if the total count of current users and invited users and requested invite users is less than or equal to workspace_license.free_seats
        b. Update case - requested_role is a role and requested_invite_list is None
            - Allowed for all roles since the total count of current members and invited members is less than or equal to workspace_license.free_seats
    Case2: Paid Plan
        a. Online/Offline Payment case
            i. Invitation case - requested_role is None and requested_invite_list is a list of invite emails with roles
                - Allowed only if the total count of paid current users and paid invited users and paid requested invite users is less than or equal to workspace_license.purchased_seats
            ii. Update case - requested_role is a role and requested_invite_list is None
              - Allowed for roles > 10 if in the purchased seats limit and for roles <= 10 if in the 5 * purchased seats limit
    """

    # Check the plan of the workspace license and trial
    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        # FREE Plan Case
        # Check Case 1a or Case 1b
        if requested_invite_list and not requested_role:
            return handle_free_plan_invite_case(
                slug=slug,
                requested_invite_list=requested_invite_list,
                workspace_license=workspace_license,
            )
        else:
            # Case 1b
            # Allow update for all roles since the total count of current members and invited members is less than or equal to workspace_license.free_seats
            return handle_free_plan_update_case(
                slug=slug,
                requested_role=requested_role,
                workspace_license=workspace_license,
            )

    else:
        # Case 2b i. or Case 2b ii.
        if requested_invite_list and not requested_role:
            return handle_member_invite_case(
                requested_invite_list=requested_invite_list,
                slug=slug,
                workspace_license=workspace_license,
            )
        # Update case
        if requested_role and not requested_invite_list:
            # Case 2b
            return handle_member_update_case(
                requested_role=requested_role,
                slug=slug,
                workspace_license=workspace_license,
                current_role=current_role,
            )

        if not requested_invite_list and not requested_role:
            return handle_invite_check_case(
                slug=slug, workspace_license=workspace_license
            )


def handle_self_managed_payments(
    slug, requested_invite_list, requested_role, workspace_license, current_role
):
    """
    Handle the self managed payment cases
    """

    """
    Case1: Free Plan and One Time Payment Plan
        return True for all cases
    Case2: Subscription Plan
        a. Invitation case - requested_role is None and requested_invite_list is a list of invite emails with roles
            - Allowed only if the total count of paid current users and paid invited users and paid requested invite users is less than or equal to workspace_license.purchased_seats
        b. Update case - requested_role is a role and requested_invite_list is None
            - Allowed for roles > 10 if in the purchased seats limit and for roles <= 10 if in the 5 * purchased seats limit
    """

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
        WorkspaceLicense.PlanChoice.ENTERPRISE.value,
    ]:
        if requested_invite_list and not requested_role:
            return handle_member_invite_case(
                requested_invite_list=requested_invite_list,
                slug=slug,
                workspace_license=workspace_license,
            )
        # Update case
        if requested_role and not requested_invite_list:
            # Case 2b
            return handle_member_update_case(
                requested_role=requested_role,
                current_role=current_role,
                slug=slug,
                workspace_license=workspace_license,
            )

        if not requested_invite_list and not requested_role:
            return handle_invite_check_case(
                slug=slug, workspace_license=workspace_license
            )


def workspace_member_check(slug, requested_invite_list, requested_role, current_role):
    """
    Check if can be invited based on the current members list and the current invite list
    """

    workspace_license = WorkspaceLicense.objects.filter(workspace__slug=slug).first()

    # If the workspace license is not found then resync the workspace license
    if not workspace_license:
        resync_workspace_license(workspace_slug=slug)
        # Fetch the workspace license
        workspace_license = WorkspaceLicense.objects.filter(
            workspace__slug=slug
        ).first()

    # Get the workspace license
    if settings.IS_MULTI_TENANT:
        return handle_cloud_payments(
            slug=slug,
            requested_invite_list=requested_invite_list,
            requested_role=requested_role,
            current_role=current_role,
            workspace_license=workspace_license,
        )
    else:
        return handle_self_managed_payments(
            slug=slug,
            requested_invite_list=requested_invite_list,
            requested_role=requested_role,
            current_role=current_role,
            workspace_license=workspace_license,
        )
