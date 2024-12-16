# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import APIActivityLog


@shared_task(queue=settings.TASK_SCHEDULER_QUEUE)
def delete_api_logs():
    # Get the logs older than 30 days to delete
    logs_to_delete = APIActivityLog.objects.filter(
        created_at__lte=timezone.now() - timedelta(days=30)
    )

    # Delete the logs
    logs_to_delete._raw_delete(logs_to_delete.db)
