# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense


@shared_task
def sync_workspace_license_free_seats(batch_size=5000, offset=0, batch_countdown=300):
    # Get total count of workspaces
    total_workspaces = WorkspaceLicense.objects.count()

    # Process one batch of workspaces
    end_offset = min(offset + batch_size, total_workspaces)

    # Loop through the workspace licenses
    for workspace_license in WorkspaceLicense.objects.order_by("-last_synced_at").all()[
        offset:end_offset
    ]:
        # Get the workspace member count
        workspace_member_count = WorkspaceMember.objects.filter(
            workspace_id=workspace_license.workspace_id,
            is_active=True,
            member__is_bot=False,
        ).count()

        # Get the workspace invite count
        workspace_invite_count = WorkspaceMemberInvite.objects.filter(
            workspace_id=workspace_license.workspace_id
        ).count()

        # Calculate the total required seats
        total_required_free_seats = workspace_member_count + workspace_invite_count

        try:
            # Hit the sync endpoint on disco to update the free seats
            response = requests.post(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspace-seat-update/{str(workspace_license.workspace_id)}/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
                json={"free_seats": total_required_free_seats},
            )

            # Check if the request was successful
            response.raise_for_status()

            # Update the free seats
            workspace_license.free_seats = response.json().get("free_seats", 12)
            workspace_license.save()
        except requests.exceptions.RequestException as e:
            print(f"Error updating workspace license: {e}")
            continue

    # Schedule the next batch if there are more workspaces to process
    if end_offset < total_workspaces:
        sync_workspace_license_free_seats.apply_async(
            kwargs={
                "batch_size": batch_size,
                "offset": end_offset,
                "batch_countdown": batch_countdown,
            },
            countdown=batch_countdown,
        )

    return


@shared_task
def schedule_workspace_license_free_seats(batch_size=5000, batch_countdown=300):
    sync_workspace_license_free_seats.delay(
        batch_size=batch_size, batch_countdown=batch_countdown
    )
