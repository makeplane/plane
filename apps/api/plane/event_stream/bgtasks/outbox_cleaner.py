# Python imports
import os
import logging
from datetime import timedelta
from typing import List, Dict, Any

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task
from pymongo.errors import BulkWriteError
from pymongo import collection
from pymongo.operations import InsertOne

# Module imports
from plane.event_stream.models.outbox import Outbox
from plane.utils.exception_logger import log_exception
from plane.settings.mongo import MongoConnection


BATCH_SIZE: int = int(os.environ.get("OUTBOX_CLEANER_BATCH_SIZE", 1000))


# Set up logger
logger = logging.getLogger("plane.worker")


def flush_to_mongo_and_delete(
    mongo_collection: collection, buffer: List[Dict[str, Any]], ids_to_delete: List[int]
) -> None:
    """
    Inserts a batch of API logs into MongoDB and deletes the corresponding rows from PostgreSQL.

    Args:
        mongo_collection (Collection): The MongoDB collection to insert documents into.
        buffer (List[Dict[str, Any]]): List of API log documents to insert into MongoDB.
        ids_to_delete (List[int]): List of primary key IDs of logs to delete from PostgreSQL.
    """
    if not buffer:
        logger.debug("No records to flush - buffer is empty")
        return

    logger.info(
        f"Starting batch flush: {len(buffer)} records, {len(ids_to_delete)} IDs to delete"
    )

    try:
        # Insert into MongoDB
        mongo_collection.bulk_write([InsertOne(doc) for doc in buffer])
    except BulkWriteError as bwe:
        logger.error(f"MongoDB bulk write error: {str(bwe)}")
        log_exception(bwe)
        # Continue with deletion even if MongoDB insert fails

    # Delete from PostgreSQL
    deleted_count = Outbox.objects.filter(id__in=ids_to_delete).delete()[0]

    logger.info(
        "Batch flush completed",
        extra={
            "batch_size": deleted_count,
        },
    )


@shared_task
def delete_outbox_records() -> None:
    """
    Celery background task that migrates outbox records older than 2 days
    from PostgreSQL to MongoDB, then deletes them from PostgreSQL.

    - Reads outbox records in chunks to reduce memory usage.
    - Writes to MongoDB using unordered bulk inserts for efficiency.
    - Deletes processed outbox records in batches to minimize write pressure.
    """

    logger.info("Starting outbox cleanup task")

    # Check MongoDB availability
    mongo_available = MongoConnection.is_configured()
    logger.info(f"MongoDB configured: {mongo_available}")

    mongo_collection = None
    if mongo_available:
        try:
            collection_name = os.environ.get("OUTBOX_COLLECTION_NAME", "outbox")
            mongo_collection = MongoConnection.get_collection(collection_name)
            logger.info(
                f"MongoDB collection '{collection_name}' connected successfully"
            )
        except Exception as e:
            logger.error(f"Failed to get MongoDB collection: {str(e)}")
            log_exception(e)
            mongo_available = False

    # Calculate cutoff time
    cutoff_days = int(os.environ.get("OUTBOX_CLEANER_CUTOFF_DAYS", 7))
    cutoff_time = timezone.now() - timedelta(days=cutoff_days)
    logger.info(
        f"Processing outbox records older than {cutoff_time} (cutoff: {cutoff_days} days)"
    )

    # Get records to process
    queryset = (
        Outbox.objects.filter(processed_at__lte=cutoff_time)
        .values(
            "id",
            "event_id",
            "event_type",
            "entity_type",
            "entity_id",
            "payload",
            "processed_at",
            "created_at",
            "workspace_id",
            "project_id",
        )
        .iterator(chunk_size=BATCH_SIZE)
    )

    buffer: List[Dict[str, Any]] = []
    ids_to_delete: List[int] = []
    total_processed = 0
    total_batches = 0

    logger.info(f"Starting to process outbox records with batch size: {BATCH_SIZE}")

    for log in queryset:
        buffer.append(
            {
                "event_id": log["event_id"],
                "event_type": log["event_type"],
                "entity_type": log["entity_type"],
                "entity_id": log["entity_id"],
                "payload": log["payload"],
                "processed_at": log["processed_at"],
                "created_at": log["created_at"],
                "workspace_id": log["workspace_id"],
                "project_id": log["project_id"],
            }
        )
        ids_to_delete.append(log["id"])

        if len(buffer) >= BATCH_SIZE:
            total_batches += 1
            logger.debug(f"Processing batch {total_batches}: {len(buffer)} records")

            if mongo_available:
                flush_to_mongo_and_delete(mongo_collection, buffer, ids_to_delete)
            else:
                deleted_count = Outbox.objects.filter(id__in=ids_to_delete).delete()[0]
                logger.info(
                    f"Deleted {deleted_count} records from PostgreSQL (MongoDB unavailable)"
                )

            total_processed += len(buffer)

            # Clear the buffer and ids_to_delete
            buffer.clear()
            ids_to_delete.clear()

    # Flush remaining outbox records
    if buffer:
        total_batches += 1
        logger.debug(f"Processing final batch {total_batches}: {len(buffer)} records")

        if mongo_available:
            flush_to_mongo_and_delete(mongo_collection, buffer, ids_to_delete)
        else:
            deleted_count = Outbox.objects.filter(id__in=ids_to_delete).delete()[0]
            logger.info(
                f"Deleted {deleted_count} records from PostgreSQL (MongoDB unavailable)"
            )

        total_processed += len(buffer)

    # Final summary log
    logger.info(
        "Outbox cleanup task completed",
        extra={
            "total_records_processed": total_processed,
            "total_batches": total_batches,
            "mongo_available": mongo_available,
            "cutoff_time": cutoff_time,
        },
    )

    return
