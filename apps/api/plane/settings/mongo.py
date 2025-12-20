"""
MongoDB Connection Module (DEPRECATED)

MongoDB has been removed from the Treasury fork to simplify infrastructure.
Log archival now uses PostgreSQL partitioned tables instead.

This module is kept as a stub for backward compatibility - all methods return None
or False, causing callers to gracefully skip MongoDB operations.
"""
import logging
from typing import Optional

# Set up logger
logger = logging.getLogger("plane.mongo")


class MongoConnection:
    """
    Stub class that disables MongoDB functionality.

    MongoDB has been removed from the Treasury fork. This stub ensures
    backward compatibility - all methods return None/False, causing
    callers to skip MongoDB operations gracefully.
    """

    _instance: Optional["MongoConnection"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoConnection, cls).__new__(cls)
            logger.info("MongoDB disabled in Treasury fork - using PostgreSQL for log archival")
        return cls._instance

    @classmethod
    def get_client(cls):
        """Returns None - MongoDB is disabled."""
        return None

    @classmethod
    def get_db(cls):
        """Returns None - MongoDB is disabled."""
        return None

    @classmethod
    def get_collection(cls, collection_name: str):
        """Returns None - MongoDB is disabled."""
        return None

    @classmethod
    def is_configured(cls) -> bool:
        """Returns False - MongoDB is disabled."""
        return False
