# Python imports
import requests
import os

# Django imports
from django.conf import settings
from django.db.models import F

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace, WorkspaceMember
from plane.utils.exception_logger import log_exception


@shared_task
def workspace_member_sync_payment_task(slug):
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

            # Check if response is successful
            if response.status_code == 200:
                return
            # Workspace does not have a subscription
            elif response.status_code == 404:
                return
            # Invalid request
            else:
                return
        else:
            return
    except requests.exceptions.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def workspace_billing_task(batch_size=1000, offset=0):
    # Get total count of workspaces
    total_workspaces = Workspace.objects.count()

    # Process one batch of workspaces
    end_offset = min(offset + batch_size, total_workspaces)
    workspaces = Workspace.objects.all()[offset:end_offset].values(
        "id", "slug"
    )

    # Loop through workspaces in the current batch
    for workspace in workspaces:
        # Check if workspace subscription
        try:
            response = requests.get(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/subscriptions/status/{str(workspace['id'])}/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )
            # Check if the response is successful
            response.raise_for_status()
            # Return the response
            response = response.json()
            # Check if the response contains the product key
            if response.get("status"):
                workspace_member_sync_payment_task.delay(workspace["slug"])
        except Exception as e:
            log_exception(e)

    # Schedule the next batch if there are more workspaces to process
    if end_offset < total_workspaces:
        workspace_billing_task.apply_async(
            args=[batch_size, end_offset],
            countdown=os.environ.get(
                "WORKSPACE_BILLING_TASK_DELAY", 1800
            ),  # 20 minutes,
        )

    return


# Initial task to start the batch processing
@shared_task
def schedule_workspace_billing_task():
    batch_size = os.environ.get("WORKSPACE_BILLING_TASK_BATCH_SIZE", 5000)
    workspace_billing_task.delay(batch_size, 0)
