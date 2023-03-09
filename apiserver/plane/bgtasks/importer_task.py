# Python imports
import json
import requests
import jwt
from datetime import datetime

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from django_rq import job
from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import ImporterSerializer
from plane.db.models import Importer, WorkspaceMemberInvite
from .workspace_invitation_task import workspace_invitation


@job("default")
def service_importer(service, importer_id):
    try:
        importer = Importer.objects.get(pk=importer_id)
        importer.status = "processing"
        importer.save()

        users = importer.data.get("users", [])

        if not len(users):
            return

        workspace_members_invite = []
        for user in users:
            if user.get("import", False) == "invite":
                workspace_members_invite.append(
                    WorkspaceMemberInvite(
                        email=user.get("email").strip().lower(),
                        workspace_id=importer.workspace_id,
                        token=jwt.encode(
                            {
                                "email": user.get("email").strip().lower(),
                                "timestamp": datetime.now().timestamp(),
                            },
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=10,
                    )
                )

        workspace_invitations = WorkspaceMemberInvite.objects.bulk_create(
            workspace_members_invite, batch_size=100, ignore_conflicts=True
        )

        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                importer.workspace_id,
                invitation.token,
                settings.WEB_URL,
                importer.initiated_by.email,
            )

        if settings.PROXY_BASE_URL:
            headers = {"Content-Type": "application/json"}
            import_data_json = json.dumps(
                ImporterSerializer(importer).data,
                cls=DjangoJSONEncoder,
            )
            res = requests.post(
                f"{settings.PROXY_BASE_URL}/hooks/workspaces/{str(importer.workspace_id)}/projects/{str(importer.project_id)}/importers/{str(service)}/",
                json=import_data_json,
                headers=headers,
            )

        return
    except Exception as e:
        importer = Importer.objects.get(pk=importer_id)
        importer.status = "failed"
        importer.save()
        capture_exception(e)
        return
