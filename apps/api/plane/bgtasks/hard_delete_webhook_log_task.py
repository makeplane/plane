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
# Third party imports
from celery import shared_task
from django.db import transaction

# Module imports
from plane.db.models import WebhookLog


@shared_task
def hard_delete_webhook_log(batch_size=5000, batch_countdown=300):
    # Get batch of logs to process
    logs_to_process = (
        WebhookLog.all_objects.filter(deleted_at__isnull=False)
        .order_by("created_at")
        .values_list("id", flat=True)[:batch_size]
    )

    # If no more logs to process, exit
    if not logs_to_process:
        return

    # Process the batch
    try:
        with transaction.atomic():
            # Hard delete the logs
            deleted_count = WebhookLog.all_objects.filter(id__in=logs_to_process).delete()[0]
            print(f"Hard deleted {deleted_count} records")

    except Exception as e:
        print(f"Error processing batch: {str(e)}")
        return

    # Schedule next batch if we got a full batch (meaning there might be more)
    if len(logs_to_process) == batch_size:
        hard_delete_webhook_log.apply_async(
            kwargs={"batch_size": batch_size, "batch_countdown": batch_countdown},
            countdown=batch_countdown,
        )

    return


@shared_task
def schedule_hard_delete_webhook_log(batch_size=5000, batch_countdown=300):
    hard_delete_webhook_log.delay(batch_size=batch_size, batch_countdown=batch_countdown)
