# Django imports
from django.conf import settings
import logging

# Third party imports
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from typing import Optional, TypeVar, Type


T = TypeVar("T", bound="MongoConnection")

# Set up logger
logger = logging.getLogger(__name__)


class MongoConnection:
    """
    A singleton class that manages MongoDB connections.

    This class ensures only one MongoDB connection is maintained throughout the application.
    It provides methods to access the MongoDB client, database, and collections.

    Attributes:
        _instance (Optional[MongoConnection]): The singleton instance of this class
        _client (Optional[MongoClient]): The MongoDB client instance
        _db (Optional[Database]): The MongoDB database instance
    """

    _instance: Optional["MongoConnection"] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None

    def __new__(cls: Type[T]) -> T:
        """
        Creates a new instance of MongoConnection if one doesn't exist.

        Returns:
            MongoConnection: The singleton instance
        """
        if cls._instance is None:
            cls._instance = super(MongoConnection, cls).__new__(cls)
            try:
                if not settings.MONGO_DB_URL or not settings.MONGO_DB_DATABASE:
                    logger.warning(
                        "MongoDB connection parameters not configured. MongoDB functionality will be disabled."
                    )
                    return cls._instance

                cls._client = MongoClient(settings.MONGO_DB_URL)
                cls._db = cls._client[settings.MONGO_DB_DATABASE]

                # Test the connection
                cls._client.server_info()
                logger.info("MongoDB connection established successfully")
            except Exception as e:
                logger.warning(
                    f"Failed to initialize MongoDB connection: {str(e)}. MongoDB functionality will be disabled."
                )
        return cls._instance

    @classmethod
    def get_client(cls) -> Optional[MongoClient]:
        """
        Returns the MongoDB client instance.

        Returns:
            Optional[MongoClient]: The MongoDB client instance or None if not configured
        """
        if cls._client is None:
            cls._instance = cls()
        return cls._client

    @classmethod
    def get_db(cls) -> Optional[Database]:
        """
        Returns the MongoDB database instance.

        Returns:
            Optional[Database]: The MongoDB database instance or None if not configured
        """
        if cls._db is None:
            cls._instance = cls()
        return cls._db

    @classmethod
    def get_collection(cls, collection_name: str) -> Optional[Collection]:
        """
        Returns a MongoDB collection by name.

        Args:
            collection_name (str): The name of the collection to retrieve

        Returns:
            Optional[Collection]: The MongoDB collection instance or None if not configured
        """
        try:
            db = cls.get_db()
            if db is None:
                logger.warning(
                    f"Cannot access collection '{collection_name}': MongoDB not configured"
                )
                return None
            return db[collection_name]
        except Exception as e:
            logger.warning(f"Failed to access collection '{collection_name}': {str(e)}")
            return None

    @classmethod
    def is_configured(cls) -> bool:
        """
        Check if MongoDB is properly configured and connected.

        Returns:
            bool: True if MongoDB is configured and connected, False otherwise
        """
        return cls._client is not None and cls._db is not None
