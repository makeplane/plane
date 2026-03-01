# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from celery.utils.time import timedelta
from celery import shared_task

# Module imports
from plane.utils.exception_logger import log_exception
from plane.db.models import EmailNotificationLog
from plane.settings.mongo import MongoConnection


def generate_email_notification_logs(logs_to_process):
    """Generator function that yields Email notification logs one at a time."""
    for log in logs_to_process:
        yield {
            "receiver_id": str(log.get("receiver_id")),
            "triggered_by_id": str(log.get("triggered_by_id")),
            "entity_identifier": str(log.get("entity_identifier")) if log.get("entity_identifier") else None,
            "entity_name": log.get("entity_name"),
            "data": log.get("data"),
            "processed_at": log.get("processed_at"),
            "sent_at": log.get("sent_at"),
            "entity": log.get("entity"),
            "old_value": log.get("old_value"),
            "new_value": log.get("new_value"),
            "created_at": log.get("created_at"),
            "updated_at": log.get("updated_at"),
        }


@shared_task
def transfer_email_notification_log(batch_size=5000, batch_countdown=300):
    # Set cutoff date
    cutoff_date = timezone.now() - timedelta(days=30)

    # Get batch of logs to process
    logs_to_process = (
        EmailNotificationLog.objects.filter(created_at__lte=cutoff_date).order_by("created_at").values()[:batch_size]
    )

    # If no more logs to process, exit
    if not logs_to_process:
        return

    # Process the batch
    try:
        with transaction.atomic():
            # Prepare the logs for bulk insert
            collection = MongoConnection.get_collection("email_notification_logs")

            # Convert generator to list for length check
            bulk_email_notification_logs = list(generate_email_notification_logs(logs_to_process))

            # Create backup records in MongoDB
            collection.insert_many(bulk_email_notification_logs)

            # Soft delete the records from PostgreSQL
            log_ids = [log.get("id") for log in logs_to_process]
            deleted_count = EmailNotificationLog.objects.filter(id__in=log_ids).delete()

            # Print the progress
            print(f"Transferred and deleted {deleted_count} records")

    except Exception as e:
        log_exception(e)
        return

    # Schedule next batch if we got a full batch (meaning there might be more)
    if len(logs_to_process) == batch_size:
        transfer_email_notification_log.apply_async(
            kwargs={
                "batch_size": batch_size,
                "batch_countdown": batch_countdown,
            },
            countdown=batch_countdown,
        )

    return


@shared_task
def schedule_transfer_email_notification_logs(batch_size=5000, batch_countdown=300):
    transfer_email_notification_log.delay(batch_size=batch_size, batch_countdown=batch_countdown)
