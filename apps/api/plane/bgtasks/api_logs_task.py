# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task
from pymongo.errors import BulkWriteError

# Module imports
from plane.db.models import APIActivityLog
from plane.utils.exception_logger import log_exception
from plane.settings.mongo import MongoConnection

BATCH_SIZE = 3000


@shared_task
def delete_api_logs():
    """
    Deletes the API logs from the database
    """
    if MongoConnection.is_configured():
        """
        Moves the API logs to MongoDB
        """
        # Get the logs older than 30 days to delete
        logs_to_delete = APIActivityLog.objects.filter(
            created_at__lte=timezone.now() - timedelta(days=30)
        )

        # Create a MongoDB client
        collection = MongoConnection.get_collection("api_activity_logs")

        # Function to insert documents in batches
        def bulk_insert(docs):
            try:
                collection.insert_many(docs)
            except BulkWriteError as bwe:
                log_exception(bwe)

        # Prepare the logs for bulk insert
        def log_generator():
            batch = []
            for log in logs_to_delete.iterator():
                batch.append(
                    {
                        "token_identifier": log.token_identifier,
                        "path": log.path,
                        "method": log.method,
                        "query_params": log.query_params,
                        "headers": log.headers,
                        "body": log.body,
                        "response_body": log.response_body,
                        "response_code": log.response_code,
                        "ip_address": log.ip_address,
                        "user_agent": log.user_agent,
                        "created_at": log.created_at,
                        "updated_at": log.updated_at,
                        "created_by": str(log.created_by_id)
                        if log.created_by_id
                        else None,
                        "updated_by": str(log.updated_by_id)
                        if log.updated_by_id
                        else None,
                    }
                )
                # If batch size is reached, yield the batch
                if len(batch) == BATCH_SIZE:
                    yield batch
                    batch = []

            # Yield the remaining logs
            if batch:
                yield batch

        # Upload the logs to MongoDB in batches
        for batch in log_generator():
            bulk_insert(batch)

        # Delete the logs
        logs_to_delete._raw_delete(logs_to_delete.db)
