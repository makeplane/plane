import requests
import json

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder

# Module imports
from plane.db.models import Workspace, Project, User

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception


@shared_task
def track_event(event_name, slug, project_id, user_id):
    try:
        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(slug=slug, id=project_id)
        user = User.objects.get(id=user_id)

        extra = {
            "projectId": str(project.id),
            "projectIdentifier": str(project.identifier),
            "projectName": str(project.name),
            "workspaceId": str(workspace.id),
            "workspaceName": str(workspace.name),
            "workspaceSlug": str(workspace.slug),
        }

        _ = requests.post(
            settings.ANALYTICS_BASE_API,
            params={"token": settings.ANALYTICS_SECRET_KEY},
            json=json.dumps(
                {
                    "eventName": event_name,
                    "extra": extra,
                    "user": {
                        "id": str(user.id),
                        "email": str(user.email),
                        "first_name": str(user.first_name),
                        "last_name": str(user.last_name),
                        "last_login_ip": str(user.last_login_ip),
                        "last_login_uagent": str(user.last_login_uagent),
                    },
                },
                cls=DjangoJSONEncoder,
            ),
        )
    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
