# Python imports
import requests

# Django imports
from django.db.models import F
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace, WorkspaceMember


@shared_task
def workspace_license_initiate_task(workspace_id):
    """Create a free license for the workspace."""

    if settings.IS_MULTI_TENANT:
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

        # Get workspace from workspace_id
        workspace = Workspace.objects.filter(id=workspace_id).first()

        # Send request to payment server to create a free license for the workspace
        requests.post(
            f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/initialize/",
            json={
                "workspace_slug": workspace.slug,
                "workspace_id": str(workspace_id),
                "members_list": list(workspace_members),
                "owner_email": workspace.owner.email,
            },
            headers={
                "content-type": "application/json",
                "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
            },
        )

    return
