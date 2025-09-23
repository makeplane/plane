# Python imports
import requests
import os

# Django imports
from django.conf import settings
from django.db.models import F, Q

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import WorkspaceMember
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import resync_workspace_license


@shared_task
def workspace_billing_task(batch_size=5000, batch_countdown=300, offset=0):
    # Get total count of workspaces
    total_workspaces = WorkspaceLicense.objects.filter(~Q(plan="FREE")).count()

    # Process one batch of workspaces
    end_offset = min(offset + batch_size, total_workspaces)

    # Get the workspaces that are not free
    workspace_licenses = WorkspaceLicense.objects.filter(~Q(plan="FREE"))[
        offset:end_offset
    ].values("workspace_id", "workspace__slug")

    # Loop through the workspace licenses
    for workspace_license in workspace_licenses:
        # Check if workspace subscription
        try:
            # Hit the sync endpoint on disco to update the free seats
            workspace_id = str(workspace_license["workspace_id"])
            workspace_slug = workspace_license["workspace__slug"]

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

            # Send request to payment server to sync workspace members
            response = requests.patch(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{workspace_id}/subscriptions/",
                json={
                    "slug": workspace_slug,
                    "workspace_id": str(workspace_id),
                    "members_list": list(workspace_members),
                },
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )

            # Refresh workspace license
            resync_workspace_license(workspace_slug, force=True)

            # Check if response is successful
            if response.status_code == 200:
                continue
            # Workspace does not have a subscription
            elif response.status_code == 404:
                continue
            # Invalid request
            else:
                continue
        except Exception as e:
            log_exception(e)

    # Schedule the next batch if there are more workspaces to process
    if end_offset < total_workspaces:
        workspace_billing_task.apply_async(
            kwargs={
                "batch_size": batch_size,
                "batch_countdown": batch_countdown,
                "offset": end_offset,
            },
            countdown=batch_countdown,  # 20 minutes,
        )

    return


# Initial task to start the batch processing
@shared_task
def schedule_workspace_billing_task(
    batch_size=os.environ.get("WORKSPACE_BILLING_TASK_BATCH_SIZE", 5000),
    batch_countdown=os.environ.get("WORKSPACE_BILLING_TASK_BATCH_COUNTDOWN", 300),
):
    """
    Schedule the workspace billing task to run
    """
    workspace_billing_task.delay(batch_size=batch_size, batch_countdown=batch_countdown)
