# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone
from django.db.models import F, Window, Subquery
from django.db.models.functions import RowNumber
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    EmailNotificationLog,
    PageVersion,
    APIActivityLog,
    IssueDescriptionVersion,
)


@shared_task
def delete_api_logs():
    # Get the logs older than 30 days to delete
    logs_to_delete = APIActivityLog.all_objects.filter(
        created_at__lte=(
            timezone.now() - timedelta(days=settings.HARD_DELETE_AFTER_DAYS)
        )
    )

    # Delete the logs
    logs_to_delete.delete()


@shared_task
def delete_email_notification_logs():
    # Get the logs older than 30 days to delete
    logs_to_delete = EmailNotificationLog.all_objects.filter(
        sent_at__lte=(timezone.now() - timedelta(days=settings.HARD_DELETE_AFTER_DAYS))
    )

    # Delete the logs
    logs_to_delete.delete()


@shared_task
def delete_page_versions():
    # Here we have to keep maximum 20 versions of a page delete all versions that are greater than 20 for an issue
    subq = (
        PageVersion.all_objects.annotate(
            row_num=Window(
                expression=RowNumber(),
                partition_by=[F("page_id")],
                order_by=F("created_at").desc(),
            )
        )
        .filter(
            row_num__gt=20,
        )
        .values("id")
    )

    PageVersion.all_objects.filter(id__in=Subquery(subq)).delete()


@shared_task
def delete_issue_description_versions():
    # IssueDescriptionVersion:
    subq = (
        IssueDescriptionVersion.all_objects.annotate(
            row_num=Window(
                expression=RowNumber(),
                partition_by=[F("issue_id")],
                order_by=F("created_at").desc(),
            )
        )
        .filter(
            row_num__gt=20,
        )
        .values("id")
    )

    IssueDescriptionVersion.all_objects.filter(id__in=Subquery(subq)).delete()
