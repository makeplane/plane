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

# Python imports
import logging
from typing import Optional

# Third party imports
from celery.utils.time import timedelta
from django.db import transaction

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task
from pymongo.errors import BulkWriteError
from pymongo.collection import Collection
from pymongo.operations import InsertOne

# Module imports
from plane.db.models.webhook import WebhookLog
from plane.settings.mongo import MongoConnection
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


def get_mongo_collection(collection_name: str) -> Optional[Collection]:
    """Get MongoDB collection if available, otherwise return None."""
    if not MongoConnection.is_configured():
        logger.info("MongoDB not configured")
        return None

    try:
        mongo_collection = MongoConnection.get_collection(collection_name)
        logger.info(f"MongoDB collection '{collection_name}' connected successfully")
        return mongo_collection
    except Exception as e:
        logger.error(f"Failed to get MongoDB collection: {str(e)}")
        log_exception(e)
        return None


def generate_logs(logs_to_process):
    """Generator function that yields webhook activity logs one at a time."""
    for log in logs_to_process:
        # Convert request body to JSON if it's a string

        yield {
            "id": str(log.get("id")),
            "created_at": log.get("created_at"),
            "updated_at": log.get("updated_at"),
            "workspace_id": str(log.get("workspace_id")),
            "webhook": str(log.get("webhook")),
            "event_type": log.get("event_type"),
            "request_method": log.get("request_method"),
            "request_headers": log.get("request_headers"),
            "request_body": log.get("request_body"),
            "response_status": log.get("response_status"),
            "response_headers": log.get("response_headers"),
            "response_body": log.get("response_body"),
            "retry_count": log.get("retry_count"),
        }


@shared_task
def transfer_webhook_log(batch_size=5000, batch_countdown=300, offset=0):
    # Set cutoff date
    cutoff_date = timezone.now() - timedelta(days=30)

    # total webhooks
    total_webhooks = WebhookLog.all_objects.filter(created_at__lte=cutoff_date).count()

    # Process one batch of workspaces
    end_offset = min(offset + batch_size, total_webhooks)

    # Get batch of logs to process
    logs_to_process = (
        WebhookLog.all_objects.filter(created_at__lte=cutoff_date).order_by("created_at").values()[offset:end_offset]
    )

    # If no more logs to process, exit
    if not logs_to_process:
        return

    # Process the batch
    try:
        with transaction.atomic():
            logger.info("Starting webhook log transfer task")

            # Get MongoDB collection
            mongo_collection = get_mongo_collection("webhook_logs")
            mongo_available = mongo_collection is not None

            logger.info(
                "Transferring webhook logs to MongoDB",
                extra={
                    "mongo_available": mongo_available,
                    "mongo_collection": mongo_collection,
                },
            )

            # Try to insert into MongoDB if available
            if mongo_collection is not None and mongo_available:
                try:
                    mongo_collection.bulk_write([InsertOne(doc) for doc in generate_logs(logs_to_process)])
                except BulkWriteError as bwe:
                    logger.error(f"MongoDB bulk write error: {str(bwe)}")
                    log_exception(bwe)

            # Soft delete the records from PostgreSQL
            log_ids = [log.get("id") for log in logs_to_process]

            # hard delete the records from DB
            deleted_count = WebhookLog.all_objects.filter(id__in=log_ids).delete()

            logger.info(
                "Webhook logs transferred and deleted",
                extra={
                    "deleted_count": deleted_count,
                },
            )

    except Exception as e:
        log_exception(e)
        return

    # Schedule the next batch if there are more workspaces to process
    if end_offset < total_webhooks:
        transfer_webhook_log.apply_async(
            kwargs={
                "batch_size": batch_size,
                "batch_countdown": batch_countdown,
                "offset": end_offset,
            },
            countdown=batch_countdown,  # 20 minutes,
        )
    return


@shared_task
def schedule_transfer_webhook_logs(batch_size=5000, batch_countdown=300):
    transfer_webhook_log.delay(batch_size=batch_size, batch_countdown=batch_countdown)
