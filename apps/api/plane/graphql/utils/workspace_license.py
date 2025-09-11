# Python imports
import requests
import os

# Django imports
from django.conf import settings
from django.utils import timezone
from django.db.models import F

# Module imports
from plane.db.models import Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense


def fetch_workspace_license(workspace_id, workspace_slug, free_seats=12):
    # If the number of free seats is less than 12, set it to 12
    workspace_free_seats = 12 if free_seats <= 12 else free_seats
    owner_email = Workspace.objects.get(slug=workspace_slug).owner.email
    # Get all active workspace members
    workspace_members = (
        WorkspaceMember.objects.filter(
            workspace_id=workspace_id, is_active=True, member__is_bot=False
        )
        .annotate(
            user_email=F("member__email"), user_id=F("member__id"), user_role=F("role")
        )
        .values("user_email", "user_id", "user_role")
    )

    # Convert user_id to string
    for member in workspace_members:
        member["user_id"] = str(member["user_id"])

    response = requests.post(
        f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/workspace-products/{str(workspace_id)}/",
        headers={
            "content-type": "application/json",
            "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
        },
        json={
            "workspace_slug": str(workspace_slug),
            "free_seats": workspace_free_seats,
            "owner_email": owner_email,
            "members_list": list(workspace_members),
        },
    )
    response.raise_for_status()
    response = response.json()
    return response


def is_trial_allowed(workspace_license):
    """
    The free trial is only allowed if the workspace has not activated
    the free trial and the workspace does not have a subscription
    """
    if settings.IS_MULTI_TENANT and not workspace_license.has_activated_free_trial:
        return True
    return False


def has_upgraded(workspace_license):
    """Check if the workspace has upgraded from the trial"""
    if workspace_license.subscription and workspace_license.has_added_payment_method:
        return True
    return False


def is_on_trial(workspace_license):
    "Check if the workspace is on a trial"
    if (
        workspace_license.subscription
        and not has_upgraded(workspace_license)
        and workspace_license.trial_end_date
        and workspace_license.trial_end_date >= timezone.now()
    ):
        return True
    return False


def trial_remaining_days(workspace_license):
    """Calculate the remaining days of the trial"""
    if (
        workspace_license.subscription
        and not has_upgraded(workspace_license)
        and workspace_license.trial_end_date
        and workspace_license.trial_end_date >= timezone.now()
    ):
        return (workspace_license.trial_end_date - timezone.now()).days
    return None


def is_billing_active(workspace_license):
    """Check if the billing is active"""

    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        return False

    if workspace_license.plan == WorkspaceLicense.PlanChoice.PRO and is_on_trial(
        workspace_license
    ):
        return False

    return True


def show_payment_button(workspace_license):
    """Check if the workspace is allowed to show the payment button"""

    # If the workspace is on free product then show the payment button
    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        return True
    # If the workspace is on pro product and is on trial then show the payment button
    if (
        workspace_license.plan == WorkspaceLicense.PlanChoice.PRO
        and is_on_trial(workspace_license)
        and not has_upgraded(workspace_license)
    ):
        return True
    # If the workspace is on pro product and has not upgraded then show the payment button
    return False


def show_trial_banner(workspace_license):
    """Determine if the trial banner should be shown"""
    if is_on_trial(workspace_license) and not has_upgraded(workspace_license):
        return trial_remaining_days(workspace_license) <= 4
    return False


def is_trial_ended(workspace_license):
    """Check if the trial has ended"""
    if (
        settings.IS_MULTI_TENANT
        and workspace_license.plan == WorkspaceLicense.PlanChoice.FREE
    ):
        # If the workspace is on free product then check if the trial is allowed
        return not is_trial_allowed(workspace_license)
    return False


def count_billable_members(workspace_license):
    """Count the number of billable members in the workspace"""
    # Check the active paid users in the workspace
    workspace_member_count = WorkspaceMember.objects.filter(
        workspace=workspace_license.workspace,
        is_active=True,
        member__is_bot=False,
        role__gt=10,
    ).count()

    # Check the active paid users in the workspace
    invited_member_count = WorkspaceMemberInvite.objects.filter(
        workspace=workspace_license.workspace, role__gt=10
    ).count()

    return workspace_member_count + invited_member_count


def count_total_seats(workspace_license):
    """Count the total seats in the workspace"""

    # Check the active users in the workspace
    workspace_seats_count = WorkspaceMember.objects.filter(
        workspace=workspace_license.workspace, is_active=True, member__is_bot=False
    ).count()

    # Check the active paid users in the workspace
    invited_seats_count = WorkspaceMemberInvite.objects.filter(
        workspace=workspace_license.workspace
    ).count()

    return workspace_seats_count + invited_seats_count


def show_seats_banner(workspace_license):
    """Determine if the seats banner should be shown"""
    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        return count_total_seats(workspace_license) >= int(
            os.environ.get("SEATS_BANNER_LIMIT", 8)
        )
    return False


def is_free_member_count_exceeded(workspace_license):
    """Determine if the free member count has been exceeded"""
    current_seats = count_total_seats(workspace_license)
    if workspace_license.plan == WorkspaceLicense.PlanChoice.FREE:
        return current_seats > workspace_license.free_seats
    else:
        return False


def resync_workspace_license(workspace_slug, force=False):
    # Fetch the workspace
    workspace = Workspace.objects.get(slug=workspace_slug)

    # Check if the license is present for the workspace
    workspace_license = WorkspaceLicense.objects.filter(workspace=workspace).first()

    # If the license is present, then check if the last sync is more than 1 hour
    if workspace_license:
        # If the last sync is more than 1 hour, then sync the license or if force is True
        if (
            timezone.now() - workspace_license.last_synced_at
        ).total_seconds() > 3600 or force:
            # Fetch the workspace license
            response = fetch_workspace_license(
                workspace_id=str(workspace.id),
                workspace_slug=workspace_slug,
                free_seats=WorkspaceMember.objects.filter(
                    is_active=True, workspace__slug=workspace_slug, member__is_bot=False
                ).count(),
            )
            # Update the last synced time
            workspace_license.last_synced_at = timezone.now()
            workspace_license.is_cancelled = response.get("is_cancelled", False)
            workspace_license.free_seats = response.get("free_seats", 12)
            workspace_license.purchased_seats = response.get("purchased_seats", 0)
            workspace_license.current_period_end_date = response.get(
                "current_period_end_date"
            )
            workspace_license.recurring_interval = response.get("interval")
            workspace_license.plan = response.get("plan")
            workspace_license.is_offline_payment = response.get(
                "is_offline_payment", False
            )
            workspace_license.trial_end_date = response.get("trial_end_date")
            workspace_license.has_activated_free_trial = response.get(
                "has_activated_free_trial", False
            )
            workspace_license.has_added_payment_method = response.get(
                "has_added_payment_method", False
            )
            workspace_license.subscription = response.get("subscription")
            workspace_license.current_period_start_date = response.get(
                "current_period_start_date"
            )
            workspace_license.save()

            workspace_license = WorkspaceLicense.objects.get(workspace=workspace)
            return {
                "is_cancelled": workspace_license.is_cancelled,
                "purchased_seats": workspace_license.purchased_seats,
                "current_period_end_date": workspace_license.current_period_end_date,
                "interval": workspace_license.recurring_interval,
                "product": workspace_license.plan,
                "is_offline_payment": workspace_license.is_offline_payment,
                "trial_end_date": workspace_license.trial_end_date,
                "has_activated_free_trial": workspace_license.has_activated_free_trial,
                "has_added_payment_method": workspace_license.has_added_payment_method,
                "subscription": workspace_license.subscription,
                "is_self_managed": (not settings.IS_MULTI_TENANT),
                "is_on_trial": is_on_trial(workspace_license),
                "is_trial_allowed": is_trial_allowed(workspace_license),
                "remaining_trial_days": trial_remaining_days(workspace_license),
                "has_upgraded": has_upgraded(workspace_license),
                "show_payment_button": show_payment_button(workspace_license),
                "show_trial_banner": show_trial_banner(workspace_license),
                "free_seats": workspace_license.free_seats,
                "occupied_seats": count_total_seats(workspace_license),
                "show_seats_banner": show_seats_banner(workspace_license),
                "current_period_start_date": workspace_license.current_period_start_date,
                "is_trial_ended": is_trial_ended(workspace_license),
                "billable_members": count_billable_members(workspace_license),
                "is_free_member_count_exceeded": is_free_member_count_exceeded(
                    workspace_license
                ),
            }
        else:
            return {
                "is_cancelled": workspace_license.is_cancelled,
                "purchased_seats": workspace_license.purchased_seats,
                "current_period_end_date": workspace_license.current_period_end_date,
                "interval": workspace_license.recurring_interval,
                "product": workspace_license.plan,
                "is_offline_payment": workspace_license.is_offline_payment,
                "trial_end_date": workspace_license.trial_end_date,
                "has_activated_free_trial": workspace_license.has_activated_free_trial,
                "has_added_payment_method": workspace_license.has_added_payment_method,
                "subscription": workspace_license.subscription,
                "is_self_managed": (not settings.IS_MULTI_TENANT),
                "is_on_trial": is_on_trial(workspace_license),
                "is_trial_allowed": is_trial_allowed(workspace_license),
                "remaining_trial_days": trial_remaining_days(workspace_license),
                "has_upgraded": has_upgraded(workspace_license),
                "show_payment_button": show_payment_button(workspace_license),
                "show_trial_banner": show_trial_banner(workspace_license),
                "free_seats": workspace_license.free_seats,
                "occupied_seats": count_total_seats(workspace_license),
                "show_seats_banner": show_seats_banner(workspace_license),
                "current_period_start_date": workspace_license.current_period_start_date,
                "is_trial_ended": is_trial_ended(workspace_license),
                "billable_members": count_billable_members(workspace_license),
                "is_free_member_count_exceeded": is_free_member_count_exceeded(
                    workspace_license
                ),
            }
    # If the license is not present, then fetch the license from the payment server and create it
    else:
        # Fetch the workspace license
        response = fetch_workspace_license(
            workspace_id=str(workspace.id),
            workspace_slug=workspace_slug,
            free_seats=WorkspaceMember.objects.filter(
                is_active=True, workspace__slug=workspace_slug, member__is_bot=False
            ).count(),
        )

        # Create the workspace license
        _ = WorkspaceLicense.objects.create(
            workspace=workspace,
            is_cancelled=response.get("is_cancelled", False),
            purchased_seats=response.get("purchased_seats", 0),
            free_seats=response.get("free_seats", 12),
            current_period_end_date=response.get("current_period_end_date"),
            recurring_interval=response.get("interval"),
            plan=response.get("plan"),
            last_synced_at=timezone.now(),
            trial_end_date=response.get("trial_end_date"),
            has_activated_free_trial=response.get("has_activated_free_trial", False),
            has_added_payment_method=response.get("has_added_payment_method", False),
            subscription=response.get("subscription"),
            current_period_start_date=response.get("current_period_start_date"),
        )

        workspace_license = WorkspaceLicense.objects.get(workspace=workspace)
        # Return the workspace license
        return {
            "is_cancelled": workspace_license.is_cancelled,
            "purchased_seats": workspace_license.purchased_seats,
            "current_period_end_date": workspace_license.current_period_end_date,
            "interval": workspace_license.recurring_interval,
            "product": workspace_license.plan,
            "is_offline_payment": workspace_license.is_offline_payment,
            "trial_end_date": workspace_license.trial_end_date,
            "has_activated_free_trial": workspace_license.has_activated_free_trial,
            "has_added_payment_method": workspace_license.has_added_payment_method,
            "subscription": workspace_license.subscription,
            "is_self_managed": (not settings.IS_MULTI_TENANT),
            "is_on_trial": is_on_trial(workspace_license),
            "is_trial_allowed": is_trial_allowed(workspace_license),
            "remaining_trial_days": trial_remaining_days(workspace_license),
            "has_upgraded": has_upgraded(workspace_license),
            "show_payment_button": show_payment_button(workspace_license),
            "show_trial_banner": show_trial_banner(workspace_license),
            "free_seats": workspace_license.free_seats,
            "occupied_seats": count_total_seats(workspace_license),
            "show_seats_banner": show_seats_banner(workspace_license),
            "current_period_start_date": workspace_license.current_period_start_date,
            "is_trial_ended": is_trial_ended(workspace_license),
            "billable_members": count_billable_members(workspace_license),
            "is_free_member_count_exceeded": is_free_member_count_exceeded(
                workspace_license
            ),
        }
