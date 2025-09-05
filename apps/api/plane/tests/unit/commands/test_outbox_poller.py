import asyncio
from unittest.mock import MagicMock
from uuid import uuid4, UUID
import pytest
from django.utils import timezone
from datetime import datetime

from plane.event_stream.models.outbox import Outbox
from plane.event_stream.management.commands.outbox_poller import (
    OutboxPoller,
    DatabaseConnectionPool,
    MemoryMonitor,
)


@pytest.fixture
def outbox_poller():
    """Create an OutboxPoller instance with test configuration"""
    return OutboxPoller(
        batch_size=10,
        interval_min=0.1,
        interval_max=1.0,
        memory_limit_mb=100,
        memory_check_interval=5,
    )


def create_outbox_records(
    count: int = 3,
    workspace_id: UUID = None,
    project_id: UUID = None,
    processed_at: datetime = None,
):
    """Create outbox records for testing"""
    records = []
    for i in range(count):
        record = Outbox.objects.create(
            event_type=f"issue.updated.{i}",
            entity_type="issue",
            entity_id=uuid4(),
            payload={
                "issue_id": f"issue-{i}",
                "status": "completed" if processed_at else "pending",
            },
            processed_at=processed_at,
            workspace_id=workspace_id,
            project_id=project_id,
        )
        records.append(record)
    return records


def delete_outbox_records(processed: bool = False) -> None:
    """Delete all outbox records"""
    Outbox.objects.filter(processed_at__isnull=processed).delete()


@pytest.fixture
def mock_handler():
    """Create a mock handler function for testing"""
    mock = MagicMock()
    # Set a name for the mock to avoid AttributeError
    mock.__name__ = "mock_handler"
    return mock


@pytest.mark.unit
class TestOutboxPoller:
    """Test the OutboxPoller class"""

    def test_outbox_poller_initialization(self, outbox_poller):
        """Test OutboxPoller is initialized with correct parameters"""
        assert outbox_poller.batch_size == 10
        assert outbox_poller.interval_min == 0.1
        assert outbox_poller.interval_max == 1.0
        assert outbox_poller.memory_limit_mb == 100
        assert outbox_poller.memory_check_interval == 5
        assert outbox_poller.handlers == []

    def test_add_handler(self, outbox_poller, mock_handler):
        """Test adding handlers to the poller"""
        outbox_poller.add_handler(mock_handler)
        assert len(outbox_poller.handlers) == 1
        assert outbox_poller.handlers[0] == mock_handler

    @pytest.mark.asyncio
    async def test_process_event_success(
        self, outbox_poller, mock_handler, workspace, project
    ):
        """Test successful event processing"""
        outbox_poller.add_handler(mock_handler)

        # Create a mock row tuple
        row = (
            1,  # id
            uuid4(),  # event_id
            "issue.created",  # event_type
            "issue",  # entity_type
            uuid4(),  # entity_id
            {"issue_id": "123", "title": "Test Issue"},  # payload
            None,  # processed_at
            timezone.now(),  # created_at
            None,  # claimed_at
            workspace.id,  # workspace_id
            project.id,
        )
        result = await outbox_poller._process_event(row)

        assert result is True
        mock_handler.assert_called_once()

        # Verify the event data passed to handler
        call_args = mock_handler.call_args[0][0]
        assert call_args.id == 1
        assert call_args.event_type == "issue.created"
        assert call_args.entity_type == "issue"
        assert call_args.payload == {"issue_id": "123", "title": "Test Issue"}
        assert call_args.workspace_id == workspace.id
        assert call_args.project_id == project.id

    @pytest.mark.asyncio
    async def test_process_event_handler_error(
        self, outbox_poller, mock_handler, workspace, project
    ):
        """Test event processing when handler raises an exception"""
        # Make the handler raise an exception
        mock_handler.side_effect = Exception("Handler error")
        outbox_poller.add_handler(mock_handler)

        row = (
            1,
            uuid4(),
            "issue.created",
            "issue",
            uuid4(),
            {"issue_id": "123"},
            None,
            timezone.now(),
            None,
            workspace.id,
            project.id,
        )

        result = await outbox_poller._process_event(row)

        assert result is False
        mock_handler.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_event_lambda_handler_error(
        self, outbox_poller, workspace, project
    ):
        """Test event processing when lambda handler raises an exception"""
        # Lambda function that raises an exception
        lambda_handler = lambda x: (_ for _ in ()).throw(Exception("Lambda error"))
        outbox_poller.add_handler(lambda_handler)

        row = (
            1,
            uuid4(),
            "issue.created",
            "issue",
            uuid4(),
            {"issue_id": "123"},
            None,
            timezone.now(),
            None,
            workspace.id,
            project.id,
        )

        result = await outbox_poller._process_event(row)

        assert result is False

    @pytest.mark.asyncio
    async def test_process_event_async_handler(self, outbox_poller, workspace, project):
        """Test processing event with async handler"""

        async def async_handler(event_data):
            await asyncio.sleep(0.01)  # Simulate async work
            return True

        outbox_poller.add_handler(async_handler)

        row = (
            1,
            uuid4(),
            "issue.created",
            "issue",
            uuid4(),
            {"issue_id": "123"},
            None,
            timezone.now(),
            None,
            workspace.id,
            project.id,
        )

        result = await outbox_poller._process_event(row)
        assert result is True

    @pytest.mark.asyncio
    async def test_process_event_multiple_handlers(
        self, outbox_poller, workspace, project
    ):
        """Test processing event with multiple handlers"""
        handler1 = MagicMock()
        handler1.__name__ = "handler1"
        handler2 = MagicMock()
        handler2.__name__ = "handler2"

        outbox_poller.add_handler(handler1)
        outbox_poller.add_handler(handler2)

        row = (
            1,
            uuid4(),
            "issue.created",
            "issue",
            uuid4(),
            {"issue_id": "123"},
            None,
            timezone.now(),
            None,
            workspace.id,
            project.id,
        )

        result = await outbox_poller._process_event(row)

        assert result is True
        handler1.assert_called_once()
        handler2.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_event_mixed_handler_types(
        self, outbox_poller, mock_handler, workspace, project
    ):
        """Test processing event with mixed handler types (normal, lambda, mock)"""

        def normal_handler(event_data):
            return "normal"

        outbox_poller.add_handler(normal_handler)
        outbox_poller.add_handler(mock_handler)

        row = (
            1,
            uuid4(),
            "issue.created",
            "issue",
            uuid4(),
            {"issue_id": "123"},
            None,
            timezone.now(),
            None,
            workspace.id,
            project.id,
        )

        result = await outbox_poller._process_event(row)
        assert result is True


@pytest.mark.unit
@pytest.mark.django_db
class TestDatabaseConnectionPool:
    """Test the DatabaseConnectionPool class"""

    @pytest.mark.asyncio
    async def test_fetch_and_lock_rows_with_real_connection(self, workspace, project):
        """Test fetch_and_lock_rows with real database connection using fixtures"""
        delete_outbox_records(processed=False)

        # Create unprocessed outbox records
        create_outbox_records(
            processed_at=None, count=3, workspace_id=workspace.id, project_id=project.id
        )

        async with DatabaseConnectionPool() as db_pool:
            # Fetch unprocessed records using the real connection
            rows = await db_pool.fetch_and_lock_rows(10)

            # Should fetch exactly 3 unprocessed records from our fixture
            assert len(rows) == 3

            # Verify the structure of returned rows
            for i, row in enumerate(rows):
                assert (
                    len(row) == 11
                )  # id, event_id, event_type, entity_type, entity_id, payload, processed_at, created_at, claimed_at, workspace_id, project_id
                assert row[0] is not None  # id
                assert row[1] is not None  # event_id
                assert row[2] == f"issue.updated.{i}"  # event_type
                assert row[3] == "issue"  # entity_type
                assert row[4] is not None  # entity_id
                assert row[5] == {
                    "issue_id": f"issue-{i}",
                    "status": "pending",
                }  # payload
                assert (
                    row[6] is None
                )  # processed_at should be None for unprocessed records
                assert row[7] is not None  # created_at
                assert row[9] == workspace.id  # workspace_id
                assert row[10] == project.id  # project_id
            # Delete the records
            delete_outbox_records(processed=False)

        # Delete the records
        delete_outbox_records(processed=False)

    @pytest.mark.asyncio
    async def test_mark_processed_with_real_connection(self, workspace, project):
        """Test mark_processed with real database connection using fixtures"""
        delete_outbox_records(processed=False)

        # Create unprocessed outbox records
        create_outbox_records(
            processed_at=None, count=3, workspace_id=workspace.id, project_id=project.id
        )

        # Get the IDs of unprocessed records
        record_ids = [record.id for record in Outbox.objects.all()]

        async with DatabaseConnectionPool() as db_pool:
            # Mark records as processed using the real connection
            result = await db_pool.mark_processed(record_ids)

            # Should successfully mark all records as processed
            assert result is True

            # Verify records are now marked as processed in the database
            for record_id in record_ids:
                record = Outbox.objects.get(id=record_id)
                assert record.processed_at is not None

        # Delete the records
        delete_outbox_records(processed=False)

    @pytest.mark.asyncio
    async def test_fetch_and_lock_rows_batch_size_limit(self, workspace, project):
        """Test that fetch_and_lock_rows respects batch size limits"""
        delete_outbox_records(processed=False)

        # Create unprocessed outbox records
        create_outbox_records(
            processed_at=None, count=3, workspace_id=workspace.id, project_id=project.id
        )

        async with DatabaseConnectionPool() as db_pool:
            # Request only 2 records when we have 3 unprocessed records
            rows = await db_pool.fetch_and_lock_rows(2)

            # Should respect batch size limit
            assert len(rows) == 2

            # The first 2 records should be returned (ordered by id)
            assert rows[0][2] == "issue.updated.0"  # event_type
            assert rows[1][2] == "issue.updated.1"  # event_type

        # Delete the records
        delete_outbox_records(processed=False)

    @pytest.mark.asyncio
    async def test_fetch_and_lock_rows_empty_when_all_processed(
        self, workspace, project
    ):
        """Test that fetch_and_lock_rows returns empty when all records are processed"""
        delete_outbox_records(processed=True)

        # Create processed outbox records
        create_outbox_records(
            processed_at=timezone.now(),
            count=2,
            workspace_id=workspace.id,
            project_id=project.id,
        )

        async with DatabaseConnectionPool() as db_pool:
            # All records in processed_outbox_records fixture are already processed
            rows = await db_pool.fetch_and_lock_rows(10)

            # Should return empty list since all records are processed
            assert len(rows) == 0

        # Delete the records
        delete_outbox_records(processed=True)

    @pytest.mark.asyncio
    async def test_mark_processed_empty_list(self):
        """Test mark_processed with empty list of IDs"""
        async with DatabaseConnectionPool() as db_pool:
            result = await db_pool.mark_processed([])

            # Should return False for empty list
            assert result is False

    @pytest.mark.asyncio
    async def test_mark_processed_nonexistent_ids(self):
        """Test mark_processed with nonexistent record IDs"""
        async with DatabaseConnectionPool() as db_pool:
            # Use IDs that don't exist in the database
            nonexistent_ids = [99999, 99998]
            result = await db_pool.mark_processed(nonexistent_ids)

            # Should return False when no rows are updated
            assert result is False

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health_check method returns health status"""
        async with DatabaseConnectionPool() as db_pool:
            health_status = await db_pool.health_check()

            # Should return a dictionary with health information
            assert isinstance(health_status, dict)
            assert "healthy" in health_status
            assert "timestamp" in health_status

            # Should be healthy for a working connection
            assert health_status["healthy"] is True

    @pytest.mark.asyncio
    async def test_get_pool_stats(self):
        """Test get_pool_stats method returns pool statistics"""
        async with DatabaseConnectionPool() as db_pool:
            pool_stats = await db_pool.get_pool_stats()

            # Should return a dictionary with pool statistics
            assert isinstance(pool_stats, dict)

            # Should contain configuration information
            assert "min_size" in pool_stats
            assert "max_size" in pool_stats
            assert "timeout" in pool_stats

            # Should contain runtime statistics
            assert "pool_size" in pool_stats or "error" in pool_stats

    @pytest.mark.asyncio
    async def test_health_check_with_no_pool(self):
        """Test health_check when pool is not initialized"""
        db_pool = DatabaseConnectionPool()
        # Don't initialize the pool
        health_status = await db_pool.health_check()

        assert health_status["healthy"] is False
        assert "Pool not initialized" in health_status["error"]

    @pytest.mark.asyncio
    async def test_get_pool_stats_with_no_pool(self):
        """Test get_pool_stats when pool is not initialized"""
        db_pool = DatabaseConnectionPool()
        # Don't initialize the pool
        pool_stats = await db_pool.get_pool_stats()

        assert "error" in pool_stats
        assert "Pool not initialized" in pool_stats["error"]


@pytest.mark.unit
class TestMemoryMonitor:
    """Test the MemoryMonitor class"""

    @pytest.mark.asyncio
    async def test_memory_monitor_initialization(self):
        """Test MemoryMonitor is initialized correctly"""
        monitor = MemoryMonitor(memory_limit_mb=100, check_interval=5)
        assert monitor.memory_limit_mb == 100
        assert monitor.check_interval == 5
        assert monitor._running is False

    @pytest.mark.asyncio
    async def test_memory_monitor_stop(self):
        """Test stopping the memory monitor"""
        monitor = MemoryMonitor(memory_limit_mb=100, check_interval=5)
        monitor._running = True

        await monitor.stop()
        assert monitor._running is False


@pytest.mark.unit
class TestOutboxModelIntegration:
    """Test integration with Outbox model"""

    def test_outbox_model_creation(self, db, workspace, project):
        """Test creating outbox records"""
        record = Outbox.objects.create(
            event_type="issue.created",
            entity_type="issue",
            entity_id=uuid4(),
            payload={"issue_id": "123", "title": "Test Issue"},
            workspace_id=workspace.id,
            project_id=project.id,
        )

        assert record.id is not None
        assert record.event_id is not None
        assert record.event_type == "issue.created"
        assert record.entity_type == "issue"
        assert record.processed_at is None
        assert record.created_at is not None

    def test_outbox_model_processed_records(self, db, workspace, project):
        """Test creating processed outbox records"""
        record = Outbox.objects.create(
            event_type="issue.updated",
            entity_type="issue",
            entity_id=uuid4(),
            payload={"issue_id": "123", "status": "completed"},
            processed_at=timezone.now(),
            workspace_id=workspace.id,
            project_id=project.id,
        )

        assert record.processed_at is not None
        assert record.event_type == "issue.updated"

    def test_outbox_model_string_representation(self, db, workspace, project):
        """Test the string representation of Outbox model"""
        entity_id = uuid4()
        record = Outbox.objects.create(
            event_type="issue.created",
            entity_type="issue",
            entity_id=entity_id,
            payload={"issue_id": "123"},
            workspace_id=workspace.id,
            project_id=project.id,
        )

        expected_str = f"Outbox<issue.created:issue:{entity_id}> {record.id}"
        assert str(record) == expected_str
