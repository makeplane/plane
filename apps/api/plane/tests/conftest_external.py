import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_redis():
    """
    Mock Redis for testing without actual Redis connection.

    This fixture patches the redis_instance function to return a MagicMock
    that behaves like a Redis client.
    """
    mock_redis_client = MagicMock()

    # Configure the mock to handle common Redis operations
    mock_redis_client.get.return_value = None
    mock_redis_client.set.return_value = True
    mock_redis_client.delete.return_value = True
    mock_redis_client.exists.return_value = 0
    mock_redis_client.ttl.return_value = -1

    # Start the patch
    with patch("plane.settings.redis.redis_instance", return_value=mock_redis_client):
        yield mock_redis_client


@pytest.fixture
def mock_elasticsearch():
    """
    Mock Elasticsearch for testing without actual ES connection.

    This fixture patches Elasticsearch to return a MagicMock
    that behaves like an Elasticsearch client.
    """
    mock_es_client = MagicMock()

    # Configure the mock to handle common ES operations
    mock_es_client.indices.exists.return_value = True
    mock_es_client.indices.create.return_value = {"acknowledged": True}
    mock_es_client.search.return_value = {"hits": {"total": {"value": 0}, "hits": []}}
    mock_es_client.index.return_value = {"_id": "test_id", "result": "created"}
    mock_es_client.update.return_value = {"_id": "test_id", "result": "updated"}
    mock_es_client.delete.return_value = {"_id": "test_id", "result": "deleted"}

    # Start the patch
    with patch("elasticsearch.Elasticsearch", return_value=mock_es_client):
        yield mock_es_client


@pytest.fixture
def mock_mongodb():
    """
    Mock MongoDB for testing without actual MongoDB connection.

    This fixture patches PyMongo to return a MagicMock that behaves like a MongoDB client.
    """
    # Create mock MongoDB clients and collections
    mock_mongo_client = MagicMock()
    mock_mongo_db = MagicMock()
    mock_mongo_collection = MagicMock()

    # Set up the chain: client -> database -> collection
    mock_mongo_client.__getitem__.return_value = mock_mongo_db
    mock_mongo_client.get_database.return_value = mock_mongo_db
    mock_mongo_db.__getitem__.return_value = mock_mongo_collection

    # Configure common MongoDB collection operations
    mock_mongo_collection.find_one.return_value = None
    mock_mongo_collection.find.return_value = MagicMock(
        __iter__=lambda x: iter([]), count=lambda: 0
    )
    mock_mongo_collection.insert_one.return_value = MagicMock(
        inserted_id="mock_id_123", acknowledged=True
    )
    mock_mongo_collection.insert_many.return_value = MagicMock(
        inserted_ids=["mock_id_123", "mock_id_456"], acknowledged=True
    )
    mock_mongo_collection.update_one.return_value = MagicMock(
        modified_count=1, matched_count=1, acknowledged=True
    )
    mock_mongo_collection.update_many.return_value = MagicMock(
        modified_count=2, matched_count=2, acknowledged=True
    )
    mock_mongo_collection.delete_one.return_value = MagicMock(
        deleted_count=1, acknowledged=True
    )
    mock_mongo_collection.delete_many.return_value = MagicMock(
        deleted_count=2, acknowledged=True
    )
    mock_mongo_collection.count_documents.return_value = 0

    # Start the patch
    with patch("pymongo.MongoClient", return_value=mock_mongo_client):
        yield mock_mongo_client


@pytest.fixture
def mock_celery():
    """
    Mock Celery for testing without actual task execution.

    This fixture patches Celery's task.delay() to prevent actual task execution.
    """
    # Start the patch
    with patch("celery.app.task.Task.delay") as mock_delay:
        mock_delay.return_value = MagicMock(id="mock-task-id")
        yield mock_delay
