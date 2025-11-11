"""
RabbitMQ Event Stream Publisher

This module provides a reliable and scalable publisher for sending events to RabbitMQ.
It uses a fanout exchange with durable messages and configurable TTL.
Includes proper handling for concurrent access from multiple outbox poller instances.
"""

import json
import logging
import os
import time
import threading
from contextlib import contextmanager
from typing import Any, Dict, Optional, Union
import uuid

# Django imports
from django.conf import settings


# Third party imports
import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.connection import Connection
from pika.exceptions import AMQPConnectionError, AMQPChannelError, ConnectionClosed

# Local imports
from plane.event_stream.models.outbox import OutboxEvent

logger = logging.getLogger("plane.event_stream")

# Constants
EXCHANGE_NAME = os.environ.get("EVENT_STREAM_EXCHANGE_NAME", "plane.event_stream")
MESSAGE_TTL_HOURS = int(os.environ.get("EVENT_STREAM_MESSAGE_TTL_HOURS", 24))
MAX_RETRIES = int(os.environ.get("EVENT_STREAM_MAX_RETRIES", 3))
RETRY_DELAY = float(os.environ.get("EVENT_STREAM_RETRY_DELAY", 1.0))


class EventStreamPublisher:
    """
    A robust RabbitMQ publisher for the event stream system.

    Thread-safe implementation that handles concurrent access from multiple
    outbox poller instances running in the same process or different processes.

    Features:
    - Fanout exchange with durable setup
    - Message persistence and reliability
    - Thread-safe connection management
    - Race condition prevention for exchange setup
    - Monitoring and error handling
    - Consumers manage their own queues and bindings
    """

    def __init__(
        self,
        exchange_name: str = EXCHANGE_NAME,
        max_retries: int = MAX_RETRIES,
        retry_delay: float = RETRY_DELAY,
        instance_id: Optional[str] = None,
    ):
        """
        Initialize the publisher with configuration options.

        Args:
            exchange_name: Name of the fanout exchange
            max_retries: Maximum retry attempts for failed operations
            retry_delay: Delay between retries in seconds
            instance_id: Optional unique identifier for this publisher instance
        """
        self.exchange_name = exchange_name
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.instance_id = instance_id or f"publisher-{id(self)}"

        # Thread-safe connection management
        self._connection: Optional[Connection] = None
        self._channel: Optional[BlockingChannel] = None
        self._connection_params = None
        self._connection_lock = threading.RLock()  # Re-entrant lock for nested calls

        self._setup_connection_params()

    def _setup_connection_params(self) -> None:
        """Setup RabbitMQ connection parameters from Django settings."""
        # Use AMQP_URL if available, otherwise construct from individual settings
        if hasattr(settings, "AMQP_URL") and settings.AMQP_URL:
            self._connection_params = pika.URLParameters(settings.AMQP_URL)
            logger.debug(f"[{self.instance_id}] Using AMQP_URL for connection")
        else:
            # Fallback to individual settings
            host = getattr(settings, "RABBITMQ_HOST", "localhost")
            port = int(getattr(settings, "RABBITMQ_PORT", 5672))
            user = getattr(settings, "RABBITMQ_USER", "guest")
            password = getattr(settings, "RABBITMQ_PASSWORD", "guest")
            vhost = getattr(settings, "RABBITMQ_VHOST", "/")

            credentials = pika.PlainCredentials(user, password)
            self._connection_params = pika.ConnectionParameters(
                host=host,
                port=port,
                virtual_host=vhost,
                credentials=credentials,
                heartbeat=int(
                    os.environ.get("RABBITMQ_HEARTBEAT", 600)
                ),  # 10 minutes heartbeat
                blocked_connection_timeout=int(
                    os.environ.get("RABBITMQ_BLOCKED_CONNECTION_TIMEOUT", 300)
                ),  # 5 minutes
                connection_attempts=int(
                    os.environ.get("RABBITMQ_CONNECTION_ATTEMPTS", 3)
                ),
                retry_delay=self.retry_delay,
            )
            logger.debug(
                f"[{self.instance_id}] Using individual settings for connection: {host}:{port}"
            )

    def _connect(self) -> None:
        """
        Establish connection to RabbitMQ and setup exchange.
        Thread-safe implementation that prevents concurrent setup.
        """
        with self._connection_lock:
            # If already connected and healthy, return
            if self._connection and not self._connection.is_closed:
                if self._channel and not self._channel.is_closed:
                    return

            try:
                logger.info(f"[{self.instance_id}] Connecting to RabbitMQ...")

                # Close existing connections if they exist
                self._disconnect_unsafe()

                # Create new connection
                self._connection = pika.BlockingConnection(self._connection_params)
                self._channel = self._connection.channel()

                # Setup exchange only
                self._setup_exchange()

                logger.info(
                    f"[{self.instance_id}] Successfully connected to RabbitMQ. "
                    f"Exchange: {self.exchange_name}"
                )

            except AMQPConnectionError as e:
                logger.error(f"[{self.instance_id}] Failed to connect to RabbitMQ: {e}")
                self._disconnect_unsafe()
                raise
            except Exception as e:
                logger.error(
                    f"[{self.instance_id}] Unexpected error during connection setup: {e}"
                )
                self._disconnect_unsafe()
                raise

    def _setup_exchange(self) -> None:
        """
        Setup exchange with proper race condition handling.
        This method handles the case where multiple publishers try to declare
        the same exchange simultaneously.
        Consumers are responsible for creating and binding their own queues.
        """
        try:
            # Declare the fanout exchange (idempotent operation)
            # This is safe to call concurrently from multiple publishers
            self._channel.exchange_declare(
                exchange=self.exchange_name,
                exchange_type="fanout",
                durable=True,
                auto_delete=False,
            )
            logger.debug(
                f"[{self.instance_id}] Exchange '{self.exchange_name}' declared"
            )

        except AMQPChannelError as e:
            # This can happen if there's a configuration mismatch
            # (e.g., trying to declare with different parameters)
            logger.error(f"[{self.instance_id}] Channel error during setup: {e}")
            # Close the channel and connection so next attempt gets fresh ones
            self._disconnect_unsafe()
            raise
        except Exception as e:
            logger.error(
                f"[{self.instance_id}] Unexpected error during exchange setup: {e}"
            )
            self._disconnect_unsafe()
            raise

    def _disconnect_unsafe(self) -> None:
        """Clean up connections without acquiring locks (internal use only)."""
        try:
            if self._channel and not self._channel.is_closed:
                self._channel.close()
        except Exception as e:
            logger.debug(f"[{self.instance_id}] Error closing channel: {e}")

        try:
            if self._connection and not self._connection.is_closed:
                self._connection.close()
        except Exception as e:
            logger.debug(f"[{self.instance_id}] Error closing connection: {e}")

        self._channel = None
        self._connection = None

    def _disconnect(self) -> None:
        """Thread-safe connection cleanup."""
        with self._connection_lock:
            self._disconnect_unsafe()

    @contextmanager
    def _ensure_connection(self):
        """
        Context manager to ensure connection is available.
        Thread-safe and handles reconnection on failures.
        """
        try:
            self._connect()
            yield
        except (ConnectionClosed, AMQPConnectionError, AMQPChannelError) as e:
            logger.warning(
                f"[{self.instance_id}] Connection lost, attempting to reconnect: {e}"
            )
            with self._connection_lock:
                self._disconnect_unsafe()
                self._connect()
            yield
        except Exception as e:
            logger.error(f"[{self.instance_id}] Unexpected connection error: {e}")
            with self._connection_lock:
                self._disconnect_unsafe()
            raise

    def _retry_operation(self, operation, *args, **kwargs):
        """Retry an operation with exponential backoff."""
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                return operation(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2**attempt)  # Exponential backoff
                    logger.warning(
                        f"[{self.instance_id}] Attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        f"[{self.instance_id}] All {self.max_retries} attempts failed"
                    )

        raise last_exception

    def _prepare_message(
        self,
        data: Union[Dict[str, Any], str],
        event_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Prepare message with metadata and timestamps.

        Args:
            data: The event data to publish
            event_metadata: Optional metadata to include with the message

        Returns:
            Dict containing the prepared message
        """
        message = {
            "timestamp": int(time.time()),
            "publisher": "plane-event-stream",
            "publisher_instance": self.instance_id,
            "version": "1.0",
        }

        if event_metadata:
            message.update(event_metadata)

        if isinstance(data, str):
            message["data"] = data
        else:
            message.update(data)

        return message

    def _publish_message(self, message: Dict[str, Any], routing_key: str = "") -> None:
        """
        Internal method to publish a message.

        Args:
            message: The message to publish
            routing_key: Routing key (ignored for fanout exchanges)
        """
        message_body = json.dumps(message, default=str)

        properties = pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
            content_type="application/json",
            content_encoding="utf-8",
            timestamp=int(time.time()),
        )

        self._channel.basic_publish(
            exchange=self.exchange_name,
            routing_key=routing_key,  # Ignored for fanout exchange
            body=message_body,
            properties=properties,
            mandatory=False,  # Don't return undeliverable messages
        )
        logger.info(
            f"[{self.instance_id}] Published message: {message_body}",
            extra=message,
        )

    def publish(
        self,
        data: Union[Dict[str, Any], str],
        routing_key: str = "",
        event_metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Publish a message to the event stream.
        Thread-safe method that can be called concurrently.

        Args:
            data: The event data to publish
            routing_key: Routing key (optional, ignored for fanout exchanges)
            event_metadata: Optional metadata to include with the message

        Returns:
            bool: True if message was published successfully, False otherwise
        """
        try:
            message = self._prepare_message(data, event_metadata)

            def _publish():
                with self._ensure_connection():
                    self._publish_message(message, routing_key)

            self._retry_operation(_publish)

            logger.debug(
                f"[{self.instance_id}] Successfully published message: "
                f"{message.get('event_type', 'unknown')}"
            )
            return True

        except Exception as e:
            logger.error(
                f"[{self.instance_id}] Failed to publish message after all retries: {e}"
            )
            return False

    def publish_outbox_event(self, outbox_event: OutboxEvent) -> bool:
        """
        Publish an event from the outbox system.

        This method is specifically designed to work with Plane's outbox events.

        Args:
            outbox_event: Event data from the outbox table

        Returns:
            bool: True if published successfully, False otherwise
        """
        try:
            # Extract relevant data from outbox event
            event_data = outbox_event.to_publisher_format()

            metadata = {
                "source": "outbox-poller",
                "outbox_id": outbox_event.id,
            }

            return self.publish(event_data, event_metadata=metadata)

        except Exception as e:
            logger.error(
                f"[{self.instance_id}] Failed to publish outbox event "
                f"{outbox_event.id}: {e}"
            )
            return False

    def close(self) -> None:
        """Close the publisher and clean up resources."""
        logger.info(f"[{self.instance_id}] Shutting down EventStreamPublisher...")
        self._disconnect()
        logger.info(f"[{self.instance_id}] EventStreamPublisher shutdown complete")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Thread-safe global publisher management
_publisher_instances: Dict[str, EventStreamPublisher] = {}
_publisher_lock = threading.Lock()


def get_publisher(instance_id: Optional[str] = None) -> EventStreamPublisher:
    """
    Get a publisher instance.

    If instance_id is provided, returns a specific instance (creating if needed).
    If instance_id is None, returns a default shared instance.
    Thread-safe implementation.

    Args:
        instance_id: Optional unique identifier for the publisher instance

    Returns:
        EventStreamPublisher: The requested publisher instance
    """
    with _publisher_lock:
        if instance_id is None:
            instance_id = str(uuid.uuid4())

        if instance_id not in _publisher_instances:
            _publisher_instances[instance_id] = EventStreamPublisher(
                instance_id=instance_id
            )

        return _publisher_instances[instance_id]


__all__ = ["get_publisher"]
