# Python imports
from datetime import timedelta

# Django imports
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import ExporterHistory
from plane.utils.s3 import S3


@shared_task
def delete_old_s3_link():
    # Get a list of keys and IDs to process
    expired_exporter_history = ExporterHistory.objects.filter(
        Q(url__isnull=False) & Q(created_at__lte=timezone.now() - timedelta(days=8))
    ).values_list("key", "id")
    s3 = S3()

    for file_name, exporter_id in expired_exporter_history:
        # Delete object from S3
        if file_name:
            s3.delete_file(settings.AWS_STORAGE_BUCKET_NAME, file_name)

        ExporterHistory.objects.filter(id=exporter_id).update(url=None)
