from django.utils import timezone
from datetime import timedelta
from plane.db.models import APIActivityLog
from celery import shared_task


@shared_task
def delete_api_logs():
    # Get the logs older than 30 days to delete
    logs_to_delete = APIActivityLog.objects.filter(
        created_at__lte=timezone.now() - timedelta(days=30)
    )

    # Delete the logs
    logs_to_delete._raw_delete(logs_to_delete.db)
