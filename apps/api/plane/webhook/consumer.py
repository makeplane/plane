import pika
import signal

from django.conf import settings
from django.db import IntegrityError, close_old_connections, connection

from plane.utils.logging import logger


class WebhookConsumer:
    """Simple automation consumer for processing events from plane_event_stream."""

    def __init__(self, queue_name: str = None, prefetch_count: int = 10):
        """Initialize the automation consumer."""
        self.queue_name = queue_name or getattr(
            settings,
            "WEBHOOK_QUEUE_NAME",
            "plane.event_stream.webhooks",
        )
        self.exchange_name = getattr(settings, "WEBHOOK_EXCHANGE_NAME", "plane.event_stream")
        self.prefetch_count = prefetch_count

        # Consumer state
        self._should_stop = False
        self._consumer_tag = None
        self._inflight_messages = 0

        # Setup
        self._setup_connection_params()
        self._setup_signal_handlers()

        logger.info(f"WebhookConsumer initialized for queue '{self.queue_name}'")

    def _setup_connection_params(self):
        """Set up RabbitMQ connection parameters."""
        if hasattr(settings, "AMQP_URL") and settings.AMQP_URL:
            self.connection_params = pika.URLParameters(settings.AMQP_URL)
        else:
            host = getattr(settings, "RABBITMQ_HOST", "localhost")
            port = int(getattr(settings, "RABBITMQ_PORT", 5672))
            username = getattr(settings, "RABBITMQ_USER", "guest")
            password = getattr(settings, "RABBITMQ_PASSWORD", "guest")
            virtual_host = getattr(settings, "RABBITMQ_VHOST", "/")

            self.connection_params = pika.ConnectionParameters(
                host=host,
                port=port,
                virtual_host=virtual_host,
                credentials=pika.PlainCredentials(username, password),
                heartbeat=600,
            )

    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal, stopping consumer...")
            self._should_stop = True

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    def ensure_database_connection(self):
        """Ensure database connection is alive, reconnect if necessary."""
        try:
            if not connection.is_usable():
                close_old_connections()
        except Exception as e:
            logger.warning(f"Database connection lost, reconnecting... {e}")
            close_old_connections()
