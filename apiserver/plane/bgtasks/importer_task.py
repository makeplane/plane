# Python imports
import json
import requests

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from django_rq import job
from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import ImporterSerializer
from plane.db.models import Importer


@job("default")
def service_importer(service, importer_id):
    try:
        importer = Importer.objects.get(pk=importer_id)
        importer.status = "processing"
        importer.save()

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
            print(res.status_code)
        return
    except Exception as e:
        capture_exception(e)
        return
