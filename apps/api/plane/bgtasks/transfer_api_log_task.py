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
from plane.db.models import APIActivityLog
from plane.settings.mongo import MongoConnection


def generate_logs(logs_to_process):
    """Generator function that yields API activity logs one at a time."""
    for log in logs_to_process:
        yield {
            "token_identifier": log.get("token_identifier"),
            "path": log.get("path"),
            "method": log.get("method"),
            "query_params": log.get("query_params"),
            "headers": log.get("headers"),
            "body": log.get("body"),
            "response_body": log.get("response_body"),
            "response_code": log.get("response_code"),
            "ip_address": log.get("ip_address"),
            "user_agent": log.get("user_agent"),
            "created_at": log.get("created_at"),
            "updated_at": log.get("updated_at"),
            "created_by": str(log.get("created_by_id")) if log.get("created_by_id") else None,
            "updated_by": str(log.get("updated_by_id")) if log.get("updated_by_id") else None,
        }


@shared_task
def transfer_api_activity_log(batch_size=5000, batch_countdown=300):
    # Set cutoff date
    cutoff_date = timezone.now() - timedelta(days=1)

    # Get batch of logs to process
    logs_to_process = (
        APIActivityLog.objects.filter(created_at__lte=cutoff_date).order_by("created_at").values()[:batch_size]
    )

    # If no more logs to process, exit
    if not logs_to_process:
        return

    # Process the batch
    try:
        with transaction.atomic():
            # Prepare the logs for bulk insert
            collection = MongoConnection.get_collection("api_activity_logs")

            # Convert generator to list for length check
            bulk_api_activity_logs = list(generate_logs(logs_to_process))

            # Create backup records in MongoDB
            collection.insert_many(bulk_api_activity_logs)

            # Soft delete the records from PostgreSQL
            log_ids = [log.get("id") for log in logs_to_process]
            deleted_count = APIActivityLog.objects.filter(id__in=log_ids).delete()

            # Print the progress
            print(f"Transferred and deleted {deleted_count} records")

    except Exception as e:
        log_exception(e)
        return

    # Schedule next batch if we got a full batch (meaning there might be more)
    if len(logs_to_process) == batch_size:
        transfer_api_activity_log.apply_async(
            kwargs={
                "batch_size": batch_size,
                "batch_countdown": batch_countdown,
            },
            countdown=batch_countdown,
        )

    return


@shared_task
def schedule_transfer_api_logs(batch_size=5000, batch_countdown=300):
    transfer_api_activity_log.delay(batch_size=batch_size, batch_countdown=batch_countdown)
