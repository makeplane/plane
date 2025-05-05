# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import WorkspaceMember, Workspace
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import resync_workspace_license


@shared_task
def member_sync_task(slug):
    try:
        # Do not run this task if payment server base url is not set
        if settings.PAYMENT_SERVER_BASE_URL:
            # workspace from slug
            workspace = Workspace.objects.filter(slug=slug).first()

            if not workspace:
                return

            workspace_id = str(workspace.id)

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
            _ = requests.patch(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{workspace_id}/subscriptions/",
                json={
                    "slug": str(workspace.slug),
                    "workspace_id": str(workspace_id),
                    "members_list": list(workspace_members),
                },
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )

            # Refresh workspace license
            resync_workspace_license(slug, force=True)
        else:
            return
    except requests.exceptions.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return
