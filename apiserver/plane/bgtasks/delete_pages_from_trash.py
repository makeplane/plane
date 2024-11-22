# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import Page
from plane.utils.exception_logger import log_exception


@shared_task
def delete_pages_from_trash():
    try:
        # Get all the pages whose archived_at is not null, i.e., they are in the trash
        Page.objects.filter(
            archived_at__isnull=False,
            archived_at__lte=timezone.now() - timezone.timedelta(days=90),
        ).delete()
        return
    except Exception as e:
        log_exception(e)
        return
