# Django imports
from django.conf import settings
from django.db.models import F
from django.utils import timezone

# Third party imports
import requests
from celery import shared_task

# Module imports
from plane.utils.exception_logger import log_exception
from plane.ee.models.workspace import WorkspaceLicense
from plane.db.models import Workspace, WorkspaceMember


def fetch_workspace_license(workspace_id, workspace_slug, free_seats=12):
    try:
        # If the number of free seats is less than 12, set it to 12
        workspace_free_seats = 12 if free_seats <= 12 else free_seats
        owner_email = Workspace.objects.get(slug=workspace_slug).owner.email
        # Get all active workspace members
        workspace_members = (
            WorkspaceMember.objects.filter(
                workspace_id=workspace_id, is_active=True, member__is_bot=False
            )
            .annotate(
                user_email=F("member__email"),
                user_id=F("member__id"),
                user_role=F("role"),
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
    except Exception:
        return None


def save_workspace_license(workspace_license, response):
    workspace_license.last_synced_at = timezone.now()
    workspace_license.is_cancelled = response.get("is_cancelled", False)
    workspace_license.free_seats = response.get("free_seats", 12)
    workspace_license.purchased_seats = response.get("purchased_seats", 0)
    workspace_license.current_period_end_date = response.get("current_period_end_date")
    workspace_license.current_period_start_date = response.get(
        "current_period_start_date"
    )
    workspace_license.recurring_interval = response.get("interval")
    workspace_license.plan = response.get("plan")
    workspace_license.is_offline_payment = response.get("is_offline_payment", False)
    workspace_license.trial_end_date = response.get("trial_end_date")
    workspace_license.has_activated_free_trial = response.get(
        "has_activated_free_trial", False
    )
    workspace_license.has_added_payment_method = response.get(
        "has_added_payment_method", False
    )
    workspace_license.subscription = response.get("subscription")
    workspace_license.last_verified_at = response.get(
        "last_verified_at", timezone.now()
    )
    workspace_license.last_payment_failed_date = response.get(
        "last_payment_failed_date", None
    )
    workspace_license.last_payment_failed_count = response.get(
        "last_payment_failed_count", 0
    )

    return workspace_license


@shared_task
def update_licenses():
    # get all workspace licenses
    workspace_licenses = WorkspaceLicense.objects.all()
    updated_workspace_licenses = []
    for workspace_license in workspace_licenses:
        response = fetch_workspace_license(
            workspace_license.workspace_id,
            workspace_license.workspace.slug,
            workspace_license.free_seats,
        )

        if response is None:
            continue

        updated_workspace_licenses.append(
            save_workspace_license(workspace_license, response)
        )

    try:
        WorkspaceLicense.objects.bulk_update(
            updated_workspace_licenses,
            [
                "last_synced_at",
                "is_cancelled",
                "free_seats",
                "purchased_seats",
                "current_period_end_date",
                "current_period_start_date",
                "recurring_interval",
                "plan",
                "is_offline_payment",
                "trial_end_date",
                "has_activated_free_trial",
                "has_added_payment_method",
                "subscription",
                "last_verified_at",
                "last_payment_failed_date",
                "last_payment_failed_count",
            ],
            batch_size=100,
        )
        return
    except Exception as e:
        log_exception(e)
        return
