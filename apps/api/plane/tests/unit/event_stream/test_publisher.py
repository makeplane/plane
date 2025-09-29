"""
Test cases for the EventStreamPublisher module.

These tests cover:
- Publisher initialization and configuration
- Connection management and thread safety
- Exchange and queue setup
- Message publishing (generic and outbox events)
- Error handling and retry logic
- Context manager functionality
- Global publisher instance management
"""

import json
import pytest
import threading
from unittest.mock import MagicMock, patch

# Django test setup
from django.test import override_settings
from django.conf import settings

# Pika exceptions for testing
from pika.exceptions import AMQPConnectionError, AMQPChannelError

# Local imports
from plane.event_stream.publisher import (
    EventStreamPublisher,
    get_publisher,
    _publisher_instances,
    _publisher_lock,
)


@pytest.fixture
def mock_rabbitmq():
    """
    Mock RabbitMQ/pika for testing without actual RabbitMQ connection.

    This fixture patches pika components to return MagicMock objects
    that behave like a RabbitMQ client.

    Returns a dict containing all mocked components for easy access in tests.
    """
    # Mock connection and channel objects
    mock_channel = MagicMock()
    mock_connection = MagicMock()

    # Configure the mock connection
    mock_connection.is_closed = False
    mock_connection.channel.return_value = mock_channel
    mock_connection.close.return_value = None

    # Configure the mock channel
    mock_channel.is_closed = False
    mock_channel.exchange_declare.return_value = None
    mock_channel.queue_declare.return_value = MagicMock(
        method=MagicMock(queue="test_queue", message_count=0, consumer_count=0)
    )
    mock_channel.queue_bind.return_value = None
    mock_channel.basic_publish.return_value = None
    mock_channel.close.return_value = None

    # Mock connection parameters and credentials
    mock_connection_params = MagicMock()
    mock_url_params = MagicMock()
    mock_credentials = MagicMock()

    # Mock BasicProperties for message publishing
    mock_basic_props = MagicMock()

    # Start the patches for all pika components
    with patch(
        "pika.BlockingConnection", return_value=mock_connection
    ) as mock_blocking_conn, patch(
        "pika.ConnectionParameters", return_value=mock_connection_params
    ) as mock_conn_params, patch(
        "pika.URLParameters", return_value=mock_url_params
    ) as mock_url_params_patch, patch(
        "pika.PlainCredentials", return_value=mock_credentials
    ) as mock_plain_creds, patch(
        "pika.BasicProperties", return_value=mock_basic_props
    ) as mock_basic_properties:

        # Yield all mocked components for test access
        yield {
            "connection": mock_connection,
            "channel": mock_channel,
            "blocking_connection": mock_blocking_conn,
            "connection_params": mock_conn_params,
            "url_params": mock_url_params_patch,
            "credentials": mock_plain_creds,
            "basic_properties": mock_basic_properties,
        }


@pytest.mark.unit
class TestEventStreamPublisher:
    """Test cases for EventStreamPublisher class."""

    def test_publisher_initialization_default_values(self, mock_rabbitmq):
        """Test publisher initializes with default configuration values."""
        publisher = EventStreamPublisher()

        assert publisher.exchange_name == "plane_event_stream"
        assert publisher.default_queue == "plane_event_stream"
        assert publisher.message_ttl_ms == 24 * 60 * 60 * 1000  # 24 hours in ms
        assert publisher.max_queue_length == 100000
        assert publisher.max_retries == 3
        assert publisher.retry_delay == 1.0
        assert publisher.instance_id.startswith("publisher-")
        assert publisher._connection is None
        assert publisher._channel is None

    def test_publisher_initialization_custom_values(self, mock_rabbitmq):
        """Test publisher initializes with custom configuration values."""
        publisher = EventStreamPublisher(
            exchange_name="custom_exchange",
            default_queue="custom_queue",
            message_ttl_hours=12,
            max_queue_length=50000,
            max_retries=5,
            retry_delay=2.0,
            instance_id="test_publisher",
        )

        assert publisher.exchange_name == "custom_exchange"
        assert publisher.default_queue == "custom_queue"
        assert publisher.message_ttl_ms == 12 * 60 * 60 * 1000  # 12 hours in ms
        assert publisher.max_queue_length == 50000
        assert publisher.max_retries == 5
        assert publisher.retry_delay == 2.0
        assert publisher.instance_id == "test_publisher"

    @override_settings(AMQP_URL="amqp://test:test@localhost:5672/test")
    def test_setup_connection_params_with_amqp_url(self, mock_rabbitmq):
        """Test connection parameters setup using AMQP_URL."""
        publisher = EventStreamPublisher()

        # Verify URLParameters was called with the AMQP_URL
        mock_rabbitmq["url_params"].assert_called_once_with(
            "amqp://test:test@localhost:5672/test"
        )

    @override_settings(
        RABBITMQ_HOST="testhost",
        RABBITMQ_PORT=5673,
        RABBITMQ_USER="testuser",
        RABBITMQ_PASSWORD="testpass",
        RABBITMQ_VHOST="/test",
    )
    def test_setup_connection_params_with_individual_settings(self, mock_rabbitmq):
        """Test connection parameters setup using individual settings."""
        # Remove AMQP_URL if it exists to test fallback
        with patch.object(settings, "AMQP_URL", None, create=True):
            publisher = EventStreamPublisher()

        # Verify PlainCredentials and ConnectionParameters were called
        mock_rabbitmq["credentials"].assert_called_once_with("testuser", "testpass")
        mock_rabbitmq["connection_params"].assert_called_once()

    def test_connect_success(self, mock_rabbitmq):
        """Test successful connection to RabbitMQ."""
        publisher = EventStreamPublisher()
        publisher._connect()

        # Verify connection was established
        mock_rabbitmq["blocking_connection"].assert_called_once()
        assert publisher._connection is not None
        assert publisher._channel is not None

        # Verify exchange and queue setup
        mock_rabbitmq["channel"].exchange_declare.assert_called_once_with(
            exchange="plane_event_stream",
            exchange_type="fanout",
            durable=True,
            auto_delete=False,
        )

        expected_queue_args = {
            "x-message-ttl": 24 * 60 * 60 * 1000,
            "x-max-length": 100000,
            "x-overflow": "drop-head",
        }
        mock_rabbitmq["channel"].queue_declare.assert_called_once_with(
            queue="plane_event_stream",
            durable=True,
            auto_delete=False,
            arguments=expected_queue_args,
        )

        mock_rabbitmq["channel"].queue_bind.assert_called_once_with(
            exchange="plane_event_stream", queue="plane_event_stream"
        )

    def test_connect_failure_amqp_connection_error(self, mock_rabbitmq):
        """Test connection failure handling."""
        # Make BlockingConnection raise AMQPConnectionError
        mock_rabbitmq["blocking_connection"].side_effect = AMQPConnectionError(
            "Connection failed"
        )

        publisher = EventStreamPublisher()

        with pytest.raises(AMQPConnectionError):
            publisher._connect()

        # Verify cleanup was attempted
        assert publisher._connection is None
        assert publisher._channel is None

    def test_connect_failure_channel_error(self, mock_rabbitmq):
        """Test channel error during setup."""
        # Make exchange_declare raise AMQPChannelError
        mock_rabbitmq["channel"].exchange_declare.side_effect = AMQPChannelError(
            "Channel error"
        )

        publisher = EventStreamPublisher()

        with pytest.raises(AMQPChannelError):
            publisher._connect()

    def test_disconnect(self, mock_rabbitmq):
        """Test connection cleanup."""
        publisher = EventStreamPublisher()
        publisher._connect()

        # Simulate connected state
        assert publisher._connection is not None
        assert publisher._channel is not None

        publisher._disconnect()

        # Verify cleanup
        mock_rabbitmq["channel"].close.assert_called_once()
        mock_rabbitmq["connection"].close.assert_called_once()
        assert publisher._connection is None
        assert publisher._channel is None

    def test_prepare_message_with_dict_data(self, mock_rabbitmq):
        """Test message preparation with dictionary data."""
        publisher = EventStreamPublisher(instance_id="test_publisher")

        data = {"event_type": "test_event", "data": {"key": "value"}}
        metadata = {"source": "test"}

        with patch("time.time", return_value=1234567890):
            message = publisher._prepare_message(data, metadata)

        expected = {
            "timestamp": 1234567890,
            "publisher": "plane-event-stream",
            "publisher_instance": "test_publisher",
            "version": "1.0",
            "source": "test",
            "event_type": "test_event",
            "data": {"key": "value"},
        }

        assert message == expected

    def test_prepare_message_with_string_data(self, mock_rabbitmq):
        """Test message preparation with string data."""
        publisher = EventStreamPublisher(instance_id="test_publisher")

        data = "test string data"

        with patch("time.time", return_value=1234567890):
            message = publisher._prepare_message(data)

        expected = {
            "timestamp": 1234567890,
            "publisher": "plane-event-stream",
            "publisher_instance": "test_publisher",
            "version": "1.0",
            "data": "test string data",
        }

        assert message == expected

    def test_publish_message_success(self, mock_rabbitmq):
        """Test successful message publishing."""
        publisher = EventStreamPublisher()
        publisher._connect()

        message = {"test": "data"}
        publisher._publish_message(message, "test.routing.key")

        # Verify basic_publish was called
        mock_rabbitmq["channel"].basic_publish.assert_called_once()
        call_args = mock_rabbitmq["channel"].basic_publish.call_args

        assert call_args[1]["exchange"] == "plane_event_stream"
        assert call_args[1]["routing_key"] == "test.routing.key"
        assert json.loads(call_args[1]["body"]) == message
        assert call_args[1]["mandatory"] is False

        # Verify BasicProperties was used
        mock_rabbitmq["basic_properties"].assert_called_once()

    def test_publish_success(self, mock_rabbitmq):
        """Test successful publish method."""
        publisher = EventStreamPublisher()

        data = {"event_type": "test_event", "data": {"key": "value"}}
        metadata = {"source": "test"}

        result = publisher.publish(data, "test.routing.key", metadata)

        assert result is True
        # Verify connection was established and message was published
        mock_rabbitmq["blocking_connection"].assert_called()
        mock_rabbitmq["channel"].basic_publish.assert_called_once()

    def test_publish_with_connection_failure_and_retry(self, mock_rabbitmq):
        """Test publish with connection failure and successful retry."""
        publisher = EventStreamPublisher(max_retries=2, retry_delay=0.1)

        # Create a second mock connection for retry
        retry_connection = MagicMock()
        retry_connection.is_closed = False
        retry_channel = MagicMock()
        retry_channel.is_closed = False
        retry_connection.channel.return_value = retry_channel

        # First call fails, second succeeds
        mock_rabbitmq["blocking_connection"].side_effect = [
            AMQPConnectionError("Connection failed"),
            retry_connection,
        ]

        data = {"event_type": "test_event"}

        with patch("time.sleep") as mock_sleep:
            result = publisher.publish(data)

        assert result is True
        # Verify retry was attempted
        assert mock_rabbitmq["blocking_connection"].call_count == 2

    def test_publish_failure_all_retries_exhausted(self, mock_rabbitmq):
        """Test publish failure when all retries are exhausted."""
        publisher = EventStreamPublisher(max_retries=2, retry_delay=0.1)

        # All attempts fail
        mock_rabbitmq["blocking_connection"].side_effect = AMQPConnectionError(
            "Connection failed"
        )

        data = {"event_type": "test_event"}

        with patch("time.sleep"):
            result = publisher.publish(data)

        assert result is False
        assert mock_rabbitmq["blocking_connection"].call_count == 4

    def test_publish_outbox_event(self, mock_rabbitmq):
        """Test publishing outbox event."""
        # Create a mock outbox event
        mock_outbox_event = MagicMock()
        mock_outbox_event.id = "test_event_123"
        mock_outbox_event.to_publisher_format.return_value = {
            "event_type": "issue.created",
            "data": {"issue_id": "123"},
        }

        publisher = EventStreamPublisher()
        result = publisher.publish_outbox_event(mock_outbox_event)

        assert result is True
        mock_outbox_event.to_publisher_format.assert_called_once()

        # Verify the message was published with correct metadata
        mock_rabbitmq["channel"].basic_publish.assert_called_once()
        call_args = mock_rabbitmq["channel"].basic_publish.call_args
        published_data = json.loads(call_args[1]["body"])

        assert published_data["event_type"] == "issue.created"
        assert published_data["data"] == {"issue_id": "123"}
        assert published_data["source"] == "outbox-poller"
        assert published_data["outbox_id"] == "test_event_123"

    def test_context_manager(self, mock_rabbitmq):
        """Test publisher as context manager."""
        with EventStreamPublisher() as publisher:
            assert isinstance(publisher, EventStreamPublisher)
            # Verify we can publish within context
            result = publisher.publish({"test": "data"})
            assert result is True

        # After exiting context, close should have been called
        mock_rabbitmq["connection"].close.assert_called()

    def test_thread_safety_concurrent_publish(self, mock_rabbitmq):
        """Test thread safety with concurrent publishing."""
        publisher = EventStreamPublisher()
        results = []
        errors = []

        def publish_worker(worker_id):
            try:
                for i in range(5):
                    data = {"worker": worker_id, "message": i}
                    result = publisher.publish(data)
                    results.append(result)
            except Exception as e:
                errors.append(e)

        # Create multiple threads
        threads = []
        for worker_id in range(3):
            thread = threading.Thread(target=publish_worker, args=(worker_id,))
            threads.append(thread)

        # Start all threads
        for thread in threads:
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Verify no errors and all publishes succeeded
        assert len(errors) == 0
        assert len(results) == 15  # 3 workers * 5 messages each
        assert all(results)  # All should be True


@pytest.mark.unit
class TestGlobalPublisherManagement:
    """Test cases for global publisher instance management."""

    def setup_method(self):
        """Clear publisher instances before each test."""
        global _publisher_instances
        _publisher_instances.clear()

    def teardown_method(self):
        """Clean up publisher instances after each test."""
        global _publisher_instances
        with _publisher_lock:
            for publisher in _publisher_instances.values():
                try:
                    publisher.close()
                except:
                    pass
            _publisher_instances.clear()

    def test_get_publisher_creates_new_instance(self, mock_rabbitmq):
        """Test that get_publisher creates a new instance."""
        publisher = get_publisher("test_instance")

        assert isinstance(publisher, EventStreamPublisher)
        assert publisher.instance_id == "test_instance"
        assert "test_instance" in _publisher_instances

    def test_get_publisher_returns_existing_instance(self, mock_rabbitmq):
        """Test that get_publisher returns existing instance."""
        publisher1 = get_publisher("test_instance")
        publisher2 = get_publisher("test_instance")

        assert publisher1 is publisher2
        assert len(_publisher_instances) == 1

    def test_get_publisher_thread_safety(self, mock_rabbitmq):
        """Test thread safety of get_publisher."""
        publishers = {}
        errors = []

        def get_publisher_worker(worker_id):
            try:
                publisher = get_publisher(f"worker_{worker_id}")
                publishers[worker_id] = publisher
            except Exception as e:
                errors.append(e)

        # Create multiple threads trying to get publishers simultaneously
        threads = []
        for worker_id in range(10):
            thread = threading.Thread(target=get_publisher_worker, args=(worker_id,))
            threads.append(thread)

        # Start all threads
        for thread in threads:
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify no errors and all publishers were created
        assert len(errors) == 0
        assert len(publishers) == 10
        assert len(_publisher_instances) == 10

        # Verify each worker got a unique publisher
        for worker_id in range(10):
            assert publishers[worker_id].instance_id == f"worker_{worker_id}"

    def test_get_publisher_auto_generated_id(self, mock_rabbitmq):
        """Test that get_publisher generates unique IDs when none provided."""
        publisher1 = get_publisher()
        publisher2 = get_publisher()

        assert publisher1 is not publisher2
        assert publisher1.instance_id != publisher2.instance_id
        assert len(_publisher_instances) == 2
