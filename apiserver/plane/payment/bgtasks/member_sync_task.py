# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import WorkspaceMember, Workspace
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import (
    fetch_workspace_license,
)


@shared_task
def member_sync_task(slug):
    try:
        # Do not run this task if payment server base url is not set
        if settings.PAYMENT_SERVER_BASE_URL:
            # workspace from slug
            workspace = Workspace.objects.filter(slug=slug).first()
            workspace_id = str(workspace.id)

            # Get all active workspace members
            workspace_members = (
                WorkspaceMember.objects.filter(
                    workspace_id=workspace_id,
                    is_active=True,
                    member__is_bot=False,
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

            # Send request to payment server to sync workspace members
            response = requests.patch(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{workspace_id}/subscriptions/",
                json={
                    "slug": slug,
                    "workspace_id": str(workspace_id),
                    "members_list": list(workspace_members),
                },
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )

            response.raise_for_status()

            # Refresh workspace license
            updated_workspace_license = fetch_workspace_license(
                workspace_id=workspace_id,
                workspace_slug=slug,
                free_seats=WorkspaceMember.objects.filter(
                    is_active=True,
                    workspace__slug=slug,
                    member__is_bot=False,
                ).count(),
            )

            # Update workspace license
            workspace_license = WorkspaceLicense.objects.filter(
                workspace=workspace
            ).first()

            # If workspace license exists, update it
            if workspace_license:
                workspace_license.plane = updated_workspace_license["plan"]
                workspace_license.recurring_interval = (
                    updated_workspace_license["interval"]
                )
                workspace_license.current_period_end_date = (
                    updated_workspace_license["current_period_end_date"]
                )
                workspace_license.purchased_seats = updated_workspace_license[
                    "purchased_seats"
                ]
                workspace_license.free_seats = updated_workspace_license[
                    "free_seats"
                ]
                workspace_license.is_cancelled = updated_workspace_license[
                    "is_cancelled"
                ]
                workspace_license.is_offline_payment = (
                    updated_workspace_license["is_offline_payment"]
                )
                workspace_license.trial_end_date = updated_workspace_license[
                    "trial_end_date"
                ]
                workspace_license.has_activated_free_trial = (
                    updated_workspace_license["has_activated_free_trial"]
                )
                workspace_license.has_added_payment_method = (
                    updated_workspace_license["has_added_payment_method"]
                )
                workspace_license.last_synced_at = timezone.now()
                workspace_license.save()

            # Else create a new workspace license
            else:
                WorkspaceLicense.objects.create(
                    workspace=workspace,
                    plan=updated_workspace_license["plan"],
                    recurring_interval=updated_workspace_license["interval"],
                    current_period_end_date=updated_workspace_license[
                        "current_period_end_date"
                    ],
                    purchased_seats=updated_workspace_license["seats"],
                    is_cancelled=updated_workspace_license["is_cancelled"],
                    is_offline_payment=updated_workspace_license[
                        "is_offline_payment"
                    ],
                    last_synced_at=timezone.now(),
                    has_activated_free_trial=updated_workspace_license[
                        "has_activated_free_trial"
                    ],
                    has_added_payment_method=updated_workspace_license[
                        "has_added_payment_method"
                    ],
                )
        else:
            return
    except requests.exceptions.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return
