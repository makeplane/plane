import uuid
from datetime import timedelta
from unittest.mock import patch, MagicMock
import pytest
from django.utils import timezone
from pymongo.errors import BulkWriteError
from pymongo.operations import InsertOne

from plane.event_stream.models.outbox import Outbox
from plane.event_stream.bgtasks.outbox_cleaner import (
    flush_to_mongo_and_delete,
    delete_outbox_records,
)


@pytest.fixture
def mock_mongo_collection():
    """Create a mock MongoDB collection"""
    return MagicMock()


@pytest.fixture
def old_outbox_records(db, workspace, project):
    """Create old outbox records that should be processed"""
    cutoff_time = timezone.now() - timedelta(days=2)
    records = []

    for i in range(3):
        record = Outbox.objects.create(
            event_type=f"issue.old.{i}",
            entity_type="issue",
            entity_id=uuid.uuid4(),
            payload={"issue_id": f"old-{i}"},
            processed_at=cutoff_time - timedelta(hours=1),
            workspace_id=workspace.id,
            project_id=project.id,
        )

        records.append(record)

    return records


@pytest.fixture
def recent_outbox_records(db, workspace, project):
    """Create recent outbox records that should not be processed"""
    records = []

    for i in range(2):
        record = Outbox.objects.create(
            event_type=f"issue.recent.{i}",
            entity_type="issue",
            entity_id=uuid.uuid4(),
            payload={"issue_id": f"recent-{i}"},
            processed_at=timezone.now() - timedelta(hours=1),
            workspace_id=workspace.id,
            project_id=project.id,
        )
        records.append(record)

    return records


@pytest.mark.unit
@pytest.mark.django_db
class TestFlushToMongoAndDelete:
    """Test the flush_to_mongo_and_delete function"""

    def test_flush_to_mongo_and_delete_success(
        self, mock_mongo_collection, workspace, project
    ):
        """Test successful MongoDB insert and PostgreSQL deletion"""
        # Arrange
        buffer = [
            {
                "event_id": str(uuid.uuid4()),
                "event_type": "issue.created",
                "entity_type": "issue",
                "entity_id": str(uuid.uuid4()),
                "payload": {"issue_id": "123"},
                "processed_at": timezone.now() - timedelta(days=3),
                "created_at": timezone.now() - timedelta(days=3),
                "workspace_id": str(uuid.uuid4()),
                "project_id": str(uuid.uuid4()),
            }
        ]
        ids_to_delete = [1]

        # Act
        flush_to_mongo_and_delete(mock_mongo_collection, buffer, ids_to_delete)

        # Assert
        expected_operations = [InsertOne(doc) for doc in buffer]
        mock_mongo_collection.bulk_write.assert_called_once_with(expected_operations)

    def test_flush_to_mongo_and_delete_empty_buffer(self, mock_mongo_collection):
        """Test handling of empty buffer"""
        # Act
        flush_to_mongo_and_delete(mock_mongo_collection, [], [])

        # Assert
        mock_mongo_collection.bulk_write.assert_not_called()

    def test_flush_to_mongo_and_delete_mongodb_error(self, mock_mongo_collection):
        """Test handling of MongoDB bulk write error"""
        # Arrange
        buffer = [{"event_id": str(uuid.uuid4()), "event_type": "issue.created"}]
        mock_mongo_collection.bulk_write.side_effect = BulkWriteError(
            results=MagicMock()
        )

        # Act & Assert - should not raise exception
        flush_to_mongo_and_delete(mock_mongo_collection, buffer, [1])

        # Verify MongoDB was still called
        mock_mongo_collection.bulk_write.assert_called_once()

    def test_flush_to_mongo_and_delete_with_real_records(
        self, db, mock_mongo_collection, workspace, project
    ):
        """Test with actual Outbox records in database"""
        # Arrange
        outbox = Outbox.objects.create(
            event_type="issue.created",
            entity_type="issue",
            entity_id=uuid.uuid4(),
            payload={"issue_id": "123"},
            processed_at=timezone.now() - timedelta(days=3),
            workspace_id=workspace.id,
            project_id=project.id,
        )

        buffer = [
            {
                "event_id": str(outbox.event_id),
                "event_type": outbox.event_type,
                "entity_type": outbox.entity_type,
                "entity_id": str(outbox.entity_id),
                "payload": outbox.payload,
                "processed_at": outbox.processed_at,
                "created_at": outbox.created_at,
                "workspace_id": str(outbox.workspace_id),
                "project_id": str(outbox.project_id),
            }
        ]
        ids_to_delete = [outbox.id]

        # Act
        flush_to_mongo_and_delete(mock_mongo_collection, buffer, ids_to_delete)

        # Assert
        mock_mongo_collection.bulk_write.assert_called_once()
        assert not Outbox.objects.filter(id=outbox.id).exists()


@pytest.mark.unit
@pytest.mark.django_db
class TestDeleteOutboxRecords:
    """Test the delete_outbox_records Celery task"""

    @patch("plane.event_stream.bgtasks.outbox_cleaner.MongoConnection")
    def test_delete_outbox_records_mongodb_available(
        self, mock_mongo_connection, old_outbox_records, recent_outbox_records
    ):
        """Test outbox cleanup with MongoDB available"""
        # Arrange
        mock_mongo_connection.is_configured.return_value = True
        mock_collection = MagicMock()
        mock_mongo_connection.get_collection.return_value = mock_collection

        # Act
        delete_outbox_records()

        # Assert
        # Check that old records were processed (deleted from PostgreSQL)
        for record in old_outbox_records:
            assert not Outbox.objects.filter(id=record.id).exists()

        # Check that recent records were not processed
        for record in recent_outbox_records:
            assert Outbox.objects.filter(id=record.id).exists()

        # Check MongoDB was called
        mock_mongo_connection.is_configured.assert_called_once()
        mock_mongo_connection.get_collection.assert_called_once_with("outbox")

    @patch("plane.event_stream.bgtasks.outbox_cleaner.MongoConnection")
    def test_delete_outbox_records_mongodb_unavailable(
        self, mock_mongo_connection, old_outbox_records, recent_outbox_records
    ):
        """Test outbox cleanup when MongoDB is not available"""
        # Arrange
        mock_mongo_connection.is_configured.return_value = False

        # Act
        delete_outbox_records()

        # Assert
        # Check that old records were still deleted from PostgreSQL
        for record in old_outbox_records:
            assert not Outbox.objects.filter(id=record.id).exists()

        # Check that recent records were not processed
        for record in recent_outbox_records:
            assert Outbox.objects.filter(id=record.id).exists()

        # Check MongoDB was checked but not used
        mock_mongo_connection.is_configured.assert_called_once()
        mock_mongo_connection.get_collection.assert_not_called()

    @patch("plane.event_stream.bgtasks.outbox_cleaner.MongoConnection")
    def test_delete_outbox_records_no_records_to_process(self, mock_mongo_connection):
        """Test outbox cleanup when no records need processing"""
        # Arrange
        Outbox.objects.all().delete()
        mock_mongo_connection.is_configured.return_value = True
        mock_collection = MagicMock()
        mock_mongo_connection.get_collection.return_value = mock_collection

        # Act
        delete_outbox_records()

        # Assert
        mock_mongo_connection.is_configured.assert_called_once()
        mock_mongo_connection.get_collection.assert_called_once()
        mock_collection.bulk_write.assert_not_called()
