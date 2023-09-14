# Python imports
import json

# Django imports
from django.db.models import Prefetch
from django.core.serializers.json import DjangoJSONEncoder
# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Property, PropertyValue, Issue
from plane.api.serializers import PropertyReadSerializer


@shared_task
def issue_property_json_task(slug, project_id, issue_id):
    try:
        issue = Issue.objects.get(
            pk=issue_id, workspace__slug=slug, project_id=project_id
        )
        issue_properties = (
            Property.objects.filter(
                workspace__slug=slug,
                property_values__project_id=project_id,
            )
            .prefetch_related("children")
            .prefetch_related(
                Prefetch(
                    "property_values",
                    queryset=PropertyValue.objects.filter(
                        issue_id=issue_id,
                        workspace__slug=slug,
                        project_id=project_id,
                    ),
                )
            )
            .distinct()
        )
        serializer = PropertyReadSerializer(issue_properties, many=True)
        issue.issue_properties = json.loads(json.dumps(serializer.data, cls=DjangoJSONEncoder))
        issue.save(update_fields=["issue_properties"])
        return
    except Exception as e:
        capture_exception(e)
        return
