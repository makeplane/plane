# Python imports
import logging
from typing import Optional, Dict, Any

# Third party imports
from pymongo.collection import Collection
from celery import shared_task

# Django imports
from plane.settings.mongo import MongoConnection
from plane.utils.exception_logger import log_exception
from plane.db.models import APIActivityLog


logger = logging.getLogger("plane.worker")


def get_mongo_collection() -> Optional[Collection]:
    """
    Returns the MongoDB collection for external API activity logs.
    """
    if not MongoConnection.is_configured():
        logger.info("MongoDB not configured")
        return None

    try:
        return MongoConnection.get_collection("api_activity_logs")
    except Exception as e:
        logger.error(f"Error getting MongoDB collection: {str(e)}")
        log_exception(e)
        return None


def safe_decode_body(content: bytes) -> Optional[str]:
    """
    Safely decodes request/response body content, handling binary data.
    Returns "[Binary Content]" if the content is binary, or a string representation of the content.
    Returns None if the content is None or empty.
    """
    # If the content is None, return None
    if content is None:
        return None

    # If the content is an empty bytes object, return None
    if content == b"":
        return None

    # Check if content is binary by looking for common binary file signatures
    if content.startswith(b"\x89PNG") or content.startswith(b"\xff\xd8\xff") or content.startswith(b"%PDF"):
        return "[Binary Content]"

    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return "[Could not decode content]"


def log_to_mongo(log_document: Dict[str, Any]) -> bool:
    """
    Logs the request to MongoDB if available.
    """
    mongo_collection = get_mongo_collection()
    if mongo_collection is None:
        logger.error("MongoDB not configured")
        return False

    try:
        mongo_collection.insert_one(log_document)
        return True
    except Exception as e:
        log_exception(e)
        return False


def log_to_postgres(log_data: Dict[str, Any]) -> bool:
    """
    Fallback to logging to PostgreSQL if MongoDB is unavailable.
    """
    try:
        APIActivityLog.objects.create(**log_data)
        return True
    except Exception as e:
        log_exception(e)
        return False


@shared_task
def process_logs(log_data: Dict[str, Any], mongo_log: Dict[str, Any]) -> None:
    """
    Process logs to save to MongoDB or Postgres based on the configuration
    """

    if MongoConnection.is_configured():
        log_to_mongo(mongo_log)
    else:
        log_to_postgres(log_data)
