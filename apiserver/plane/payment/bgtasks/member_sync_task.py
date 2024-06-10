# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import WorkspaceMember


@shared_task
def member_sync_task(workspace_id):

    if settings.PAYMENT_SERVER_BASE_URL:
        workspace_members = (
            WorkspaceMember.objects.filter(
                workspace_id=workspace_id, is_active=True, member__is_bot=False
            )
            .annotate(user_email=F("member__email"), user_id=F("member__id"))
            .values("user_email", "user_id")
        )

        for member in workspace_members:
            member["user_id"] = str(member["user_id"])

        response = requests.patch(
            f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{workspace_id}/subscriptions/",
            json={
                "workspace_id": str(workspace_id),
                "members_list": list(workspace_members),
            },
            headers={"content-type": "application/json"},
        )

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return response.json()
        else:
            return
    else:
        return
